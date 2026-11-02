#!/usr/bin/env node
/**
 * guard/setup-license.js
 * ---------------------------------------------------------------------------
 * Script thiết lập license cho bản cài đặt hiện tại.
 *
 * Dùng khi muốn gắn license vào 1 bản cài đặt cụ thể (thay vì gửi qua
 * Control Panel online):
 *
 *   node guard/setup-license.js LIC-XXXX-XXXX-XXXX
 *
 * Lưu file .env vào thư mục gốc (đã được .gitignore bỏ qua).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env');
const key = process.argv[2];

if (!key) {
    console.error('Cách dùng: node guard/setup-license.js <LICENSE_KEY>');
    console.error('Ví dụ: node guard/setup-license.js LIC-6A1D9178C42C375685B307CF');
    process.exit(1);
}

let content = '';
if (fs.existsSync(ENV_FILE)) {
    content = fs.readFileSync(ENV_FILE, 'utf8');
}

// Thay dòng GUARD_LICENSE_KEY nếu đã có, không thì append
const line = 'GUARD_LICENSE_KEY = ' + key;
const re = /^GUARD_LICENSE_KEY\s*=.*$/m;

if (re.test(content)) {
    content = content.replace(re, line);
} else {
    if (content && !content.endsWith('\n')) content += '\n';
    content += '\n# Guard - license key (dùng để gắn license cho bản cài đặt này)\n' + line + '\n';
}

fs.writeFileSync(ENV_FILE, content, 'utf8');
console.log('✅ Đã ghi license vào .env');
console.log('   Key: ' + key);
console.log('   File: ' + ENV_FILE);
console.log('');
console.log('Khởi động lại server để áp dụng: npm start');
