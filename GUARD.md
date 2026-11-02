# 🛡️ GO88 GUARD — Cơ chế Bảo vệ Bản quyền

Hệ thống bảo vệ mã nguồn gồm **2 phần**:

| Phần | Vị trí | Có trong repo public? |
|---|---|---|
| **Guard Client** | `go88/guard/` | ✅ Có (không chứa bí mật) |
| **Control Panel** | `guard-panel/` (ngoài repo) | ❌ **KHÔNG** — giữ riêng |

> **Lưu ý quan trọng**: Cơ chế này là *biện pháp kỹ thuật*, không phải biện pháp pháp lý.
> "Khóa được" không đồng nghĩa với "được phép". Vẫn cần tuân thủ [DISCLAIMER.md](DISCLAIMER.md).

---

## 🎯 Các cơ chế bảo vệ

### 1. Heartbeat + License

Server game gửi "nhịp sống" định kỳ (mặc định 5 phút) về Control Panel kèm:

- `installId` — mã duy nhất của bản cài đặt
- `publicIp`, `localIp`, `host` (domain đang dùng), `hostname`
- `platform`, `nodeVersion`, `appVersion`, `uptime`
- `localViolations` — các vi phạm phát hiện tại chỗ

Control Panel trả về trạng thái: `licensed` / `trial` / `blocked`.

### 2. Tự hủy mã nguồn (self-destruct)

Khi Control Panel gửi lệnh `blocked` kèm `destroyOnBlock`, client sẽ:
1. Ghi đè toàn bộ file `.js`, `.json`, `.ejs`, `.md`... trong `app/`, `config/`, `data/`, `policies/`, `routes/`, `views/`, `guard/`
2. Ghi đè các file gốc (`server.js`, `config.js`, `router*.js`, `package.json`...)
3. Xoá `node_modules/` và `.git/`
4. Dừng tiến trình

File sau khi ghi đè:

```js
/* ============================================================
 * FILE NÀY ĐÃ BỊ VÔ HIỆU HÓA BỞI CƠ CHẾ BẢO VỆ (GO88 GUARD)
 * Lý do: <lý do>
 * Thời điểm: <ISO timestamp>
 * ============================================================ */
throw new Error("GO88 GUARD: Source code has been revoked. Contact the owner for details.");
```

### 3. Chặn đấu domain lạ (anti-domain-abuse)

Guard theo dõi `Host` header của mọi request. Nếu domain không thuộc allowlist bạn cấu hình
→ ghi nhận vi phạm `UNKNOWN_DOMAIN` / `DOMAIN_NOT_ALLOWED`.

Mặc định `alwaysAllowHosts` cho phép: `localhost`, `127.0.0.1`, `::1` + các đuôi
`.localhost`, `.trycloudflare.com`, `.local`, `.test`.

### 4. Ép allowlist IP

Chỉ cho phép IP trong danh sách bạn duyệt. Truy cập từ IP khác → vi phạm `IP_NOT_ALLOWED`.

### 5. Phát hiện server lộ Internet không có xác thực

Request từ IP ngoài mà không kèm token → vi phạm `EXPOSED_NO_AUTH`.

### 6. Gia hạn khi mất liên hệ (offline grace)

Nếu Control Panel không phản hồi, client có **72 giờ** (tuỳ chỉnh được) để liên hệ lại.
Quá hạn → tự hủy. Điều này đảm bảo server không thể chạy vô thời hạn sau khi bạn gỡ panel.

---

## ⚠️ Nguyên tắc thiết kế quan trọng

> **KHÔNG tự hủy chỉ vì "chưa có license".**

Lý do: nếu tự hủy khi chưa cấp phép, người dùng vô hại chỉ cần clone repo là mất code —
dễ gây thiệt hại oan và mất uy tín.

Chỉ hủy khi:
- Control Panel xác nhận `blocked` (bạn chủ động thu hồi), **hoặc**
- Control Panel gửi `violation.severity === 'critical'`, **hoặc**
- Hết gia hạn 72h không liên hệ được panel

Bảng mức độ vi phạm:

| Mã | Mức | Hành động |
|---|---|---|
| `PUBLIC_IP_HOST` | high | Ghi nhận, cảnh báo Telegram |
| `UNKNOWN_DOMAIN` | medium | Ghi nhận, cảnh báo |
| `IP_NOT_ALLOWED` | high | Ghi nhận, cảnh báo |
| `DOMAIN_NOT_ALLOWED` | high | Ghi nhận, cảnh báo |
| `EXPOSED_NO_AUTH` | high | Ghi nhận, cảnh báo |
| `critical` (do panel đặt) | critical | 🔥 **TỰ HỦY** |

---

## 🛠 Cài đặt

### Bước 1 — Khởi động Control Panel (trên máy bạn / VPS riêng)

```bash
cd guard-panel
npm install          # không có dependency, nhưng để tạo package.json
node server.js
```

> **KHÔNG** đặt Control Panel trong cùng repo công khai, và **KHÔNG** expose nó ra Internet
> công khai. Mặc định nó bind `127.0.0.1:8787`.

Sửa `guard-panel/config.json`:

```json
{
  "port": 8787,
  "bindAddress": "127.0.0.1",
  "adminToken": "TOKEN_RANDOM_DÀI_64_KÝ_TỰ",
  "offlineGraceHours": 72,
  "destroyOnBlock": true,
  "telegram": {
    "enabled": true,
    "botToken": "123456:ABC-DEF...",
    "chatId": "123456789"
  }
}
```

Sinh `adminToken` an toàn:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Bước 2 — Cấu hình Guard Client trong repo

Sửa `guard/config.json`:

```json
{
  "controlUrl": "http://YOUR-PANEL-IP:8787",
  "heartbeatIntervalSec": 300,
  "offlineGraceHours": 72,
  "selfDefense": {
    "enabled": true,
    "enforceIpAllowlist": true,
    "enforceDomainAllowlist": false,
    "allowedIps": ["1.2.3.4"],
    "allowedDomains": ["your-domain.com"]
  },
  "destruct": {
    "enabled": true,
    "mode": "overwrite",
    "removeNodeModules": true,
    "removeGitDir": true
  }
}
```

> `controlUrl` nên trỏ tới Control Panel của bạn. Nếu Control Panel ở máy khác, dùng HTTPS
> + đặt sau Nginx/Cloudflare Tunnel có auth.

### Bước 3 — Khởi động server game

```bash
npm start
```

Log sẽ hiện:

```
[GUARD] Khởi động Guard. installId = 3f8a...
[GUARD] Control Panel: http://YOUR-PANEL-IP:8787
```

### Bước 4 — Cấp license

Xem danh sách bản cài đặt đã kết nối:

```bash
cd guard-panel
node cli.js list
```

```
INSTALL ID                            STATUS       ONLINE    PUBLIC IP         LAST SEEN
--------------------------------------------------------------------------------
3f8a9c2e1b4d6a8f0c2e5b7a9d1f3e4c      unlicensed   yes       8.8.8.8          2026-11-02 19:30:00
```

Cấp license:

```bash
node cli.js license 3f8a9c2e1b4d6a8f0c2e5b7a9d1f3e4c "VPS chính - Hà Nội"
```

Kết quả:

```
✅ Đã cấp license
   Install : 3f8a9c2e1b4d6a8f0c2e5b7a9d1f3e4c
   Key     : LIC-6A1D9178C42C375685B307CF
```

License được đẩy xuống client ở heartbeat kế tiếp (≤ 5 phút). Hoặc gắn thủ công vào
bản cài đặt cụ thể:

```bash
node guard/setup-license.js LIC-6A1D9178C42C375685B307CF
# ghi vào .env: GUARD_LICENSE_KEY = LIC-...
```

### Bước 5 — Áp allowlist IP / domain

```bash
node cli.js ip     3f8a9c2e... 8.8.8.8,1.2.3.4
node cli.js domain 3f8a9c2e... game.example.com
```

Áp dụng ở heartbeat kế tiếp.

---

## 🎯 Các lệnh CLI

```bash
cd guard-panel

node cli.js list                       # danh sách bản cài đặt
node cli.js info <installId>           # chi tiết 1 bản cài đặt
node cli.js license <installId> [label] # cấp license
node cli.js revoke <installId> "lý do"  # thu hồi + hủy mã nguồn
node cli.js unblock <installId>         # gỡ khoá (về trial)
node cli.js ip <installId> "1.1.1.1,2.2.2.2"      # allowlist IP
node cli.js domain <installId> "a.com,b.com"       # allowlist domain
node cli.js violations                  # xem tất cả vi phạm
```

---

## 🌐 Đấu domain / IP vào VPS

### Khuyến nghị: **dùng IP allowlist, KHÔNG đấu domain**

Bạn hỏi "nếu bạn thấy up VPS đấu IP vào IP cho tôi" — đây là lời khuyên **đúng đắn**:

**Vì sao nên ưu tiên IP allowlist hơn domain allowlist?**

1. **Domain có thể bị chiếm đoạt**: ai đó đăng ký tên miền giống bạn, trỏ về server khác
   rồi chuyển lại — allowlist theo domain sẽ vô hiệu
2. **Domain có thể bị đổi**: bạn đổi domain → phải cập nhật lại allowlist
3. **IP cố định = ổn định**: VPS thường có IP tĩnh, cấu hình một lần dùng lâu dài
4. **Bypass khó IP rất dễ**: đổi IP, dùng VPN, dùng proxy → domain allowlist cũng không cứu được
   (vì domain vẫn hợp lệ) — nên phải kết hợp cả hai

**Cách lấy IP VPS:**

```bash
# trên VPS
curl -s ifconfig.me
# hoặc
hostname -I
```

**Cấu hình allowlist IP:**

```bash
# Panel: cho phép IP của bạn (nhà/VPN/quản trị) + IP của người chơi
node cli.js ip <installId> "8.8.8.8,1.2.3.4"
```

> Vấn đề: người chơi thường đổi IP liên tục. Nếu bạn muốn người chơi truy cập được,
> **không** bật `enforceIpAllowlist` cho bản cài đặt đó — hãy bật
> `enforceDomainAllowlist` thay thế (chỉ cho phép domain chính thức).

### Cấu hình khuyến nghị cho từng tình huống

**A. Chỉ bạn dùng (nội bộ / test):**

```json
"selfDefense": {
  "enabled": true,
  "enforceIpAllowlist": true,
  "enforceDomainAllowlist": false,
  "allowedIps": ["<IP-của-bạn>"]
}
```

**B. Cho người chơi truy cập (vận hành thật):**

```json
"selfDefense": {
  "enabled": true,
  "enforceIpAllowlist": false,
  "enforceDomainAllowlist": true,
  "allowedDomains": ["game.tenmien.com"]
}
```

**C. Cả hai (khuyến nghị cho repo public):**

```json
"selfDefense": {
  "enabled": true,
  "enforceIpAllowlist": false,
  "enforceDomainAllowlist": true,
  "allowedDomains": ["game.tenmien.com"],
  "alwaysAllowHosts": ["localhost", "127.0.0.1", "::1", "0.0.0.0"]
}
```

> Với `enforceDomainAllowlist: true`, request từ IP lạ nhưng đúng domain vẫn qua.
> Người lấy domain đi đấu sang VPS khác sẽ bị chặn vì domain không khớp.

### Đấu domain lên VPS

```bash
# 1. Trỏ DNS A record
#    game.tenmien.com  ->  A  <IP-VPS>

# 2. Cài Nginx + Let's Encrypt
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d game.tenmien.com

# 3. Cấu hình Nginx (BẮT BUỘC có header WebSocket)
```

```nginx
server {
    listen 80;
    server_name game.tenmien.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;          # Guard dùng Host header này
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Dùng Cloudflare Tunnel (không cần IP public)

```bash
cloudflared tunnel --url http://localhost:3000
```

Cho phép mặc định: `*.trycloudflare.com`. Nếu dùng domain riêng qua Cloudflare, thêm domain
đó vào `allowedDomains`.

---

## 🔔 Cảnh báo Telegram

Bật trong `guard-panel/config.json`:

```json
"telegram": {
  "enabled": true,
  "botToken": "<token từ @BotFather>",
  "chatId": "<chat id của bạn>"
}
```

Sẽ nhận thông báo khi:
- Cấp license
- Thu hồi license
- Phát hiện vi phạm (`IP_NOT_ALLOWED`, `UNKNOWN_DOMAIN`…)

Lấy `chatId` bằng cách nhắn bot rồi gọi `https://api.telegram.org/bot<TOKEN>/getUpdates`.

---

## 🔌 API của Control Panel

### Heartbeat (client gọi, không cần token)

```http
POST /api/heartbeat
Content-Type: application/json
```

```json
{
  "installId": "3f8a...",
  "publicIp": "8.8.8.8",
  "host": "game.tenmien.com",
  "localViolations": []
}
```

**Response khi được cấp phép:**

```json
{
  "status": {
    "licensed": true,
    "licenseKey": "LIC-6A1D...",
    "blocked": false,
    "mode": "licensed",
    "policy": { "allowedIps": [...], "allowedDomains": [...], "allowIps": true }
  }
}
```

**Response khi bị khoá:**

```json
{
  "status": {
    "blocked": true,
    "licensed": false,
    "reason": "Đã bị thu hồi quyền sử dụng",
    "destroyOnBlock": true
  }
}
```

### API quản trị (cần header `X-Admin-Token`)

| Method | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra panel (không cần token) |
| `GET` | `/api/admin/installs` | Danh sách bản cài đặt |
| `GET` | `/api/admin/install/:id` | Chi tiết 1 bản cài đặt |
| `POST` | `/api/admin/license` | Cấp license |
| `POST` | `/api/admin/revoke` | Thu hồi / khoá + hủy mã nguồn |
| `POST` | `/api/admin/unblock` | Gỡ khoá |
| `POST` | `/api/admin/policy` | Đặt allowlist IP / domain |
| `DELETE` | `/api/admin/install/:id` | Xoá bản cài đặt khỏi danh sách |
| `GET` | `/api/admin/violations` | Danh sách vi phạm |

Ví dụ:

```bash
curl -X POST http://127.0.0.1:8787/api/admin/revoke \
  -H "X-Admin-Token: TOKEN_CUA_BAN" \
  -H "Content-Type: application/json" \
  -d '{"installId":"3f8a...","reason":"Dung sai muc dich","destroyOnBlock":true}'
```

---

## 📊 Endpoint kiểm tra của server game

```bash
curl http://localhost:3000/guard/status
```

```json
{
  "installId": "3f8a...",
  "licensed": true,
  "mode": "licensed",
  "blocked": false,
  "destroyed": false,
  "violation": null,
  "lastHeartbeat": 1793622799159
}
```

Khi bị khoá, mọi request trả về `403`:

```json
{
  "error": "LICENSE_REVOKED",
  "message": "Bản cài đặt này đã bị thu hồi quyền sử dụng.",
  "contact": "Liên hệ chủ sở hữu để được cấp lại license."
}
```

---

## ⚠️ Giới hạn của cơ chế này

Hãy hiểu rõ điều này trước khi dựa vào nó:

| Vấn đề | Giải thích |
|---|---|
| **Không chống được người có kỹ năng** | Ai đọc code `guard/client.js` đều có thể xoá/comment guard, hoặc chạy bằng bản vá đã sửa |
| **Không bảo vệ được phía server** | Guard chạy trong máy chủ — nếu người dùng sở hữu VPS, họ toàn quyền |
| **Có thể bị chặn mạng** | Chặn `controlUrl` → hết 72h giờ mới hủy (có thể tăng/giảm) |
| **Không thay thế giấy phép** | Chạy code **không đồng nghĩa** được phép vận hành cá cược — vẫn vi phạm BLHS 2015 |
| **Cần đường truyền ổn định** | Nếu panel chết, mọi bản cài đặt sẽ hủy sau 72h → hãy dùng VPS riêng + giám sát |

**Điều Guard thực sự làm được:**
- Phát hiện & **ghi nhận** ai đang chạy code, ở IP nào, domain nào
- **Chặn truy cập** và **thu hồi quyền** khi bạn muốn
- **Phá hủy mã nguồn** trên máy đó khi có bằng chứng vi phạm
- Tạo **bằng chứng pháp lý** (log heartbeat, lịch sử vi phạm)

**Điều Guard KHÔNG làm được:** bảo vệ người dùng khỏi hậu quả pháp lý. Đó là lý do
[DISCLAIMER.md](DISCLAIMER.md) vẫn là bắt buộc.

---

## 🧪 Test nhanh

```bash
# 1. Bật panel
cd guard-panel && node server.js

# 2. Trong repo: sửa guard/config.json trỏ về panel
#    "controlUrl": "http://127.0.0.1:8787"

# 3. Chạy server game, xem log
npm start
# [GUARD] Khởi động Guard. installId = ...

# 4. Kiểm tra panel đã nhận heartbeat
cd guard-panel && node cli.js list

# 5. Test khoá (KHÔNG bật destroyOnBlock nếu chưa muốn xoá file!)
node cli.js revoke <installId> "test" 
# -> client sẽ trả 403 cho mọi request
# -> nếu destroyOnBlock=true thì file bị ghi đè (KHÔNG THỬ trên bản thật!)

# 6. Gỡ khoá
node cli.js unblock <installId>
```

> ⚠️ **Luôn test trên bản sao trước.** `destroyOnBlock: true` sẽ ghi đè mã nguồn thật.

---

## 🔄 Vòng đời vận hành

```
1. Cài repo từ GitHub lên VPS
2. Server tự gửi heartbeat -> Panel thấy installId + IP
3. Bạn duyệt: node cli.js license <id>
4. Áp allowlist IP/domain theo nhu cầu
5. Người dùng đổi domain -> vi phạm được ghi nhận + cảnh báo Telegram
6. Bạn quyết định: node cli.js revoke <id> "lý do"
7. Client nhận lệnh -> chặn truy cập -> ghi đè mã nguồn
```
