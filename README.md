# 🎮 GO88 — Game Server (RedVip)

Server game bài/đá (tài xỉu, bầu cúa, xóc xóc, hũ…) viết bằng **Node.js + Express + MongoDB + Socket.IO**.
Game client chạy trên **Cocos2d-x** và kết nối vào server này qua WebSocket.

> ## 🚫 TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM
>
> **Mã nguồn này CHỈ ĐƯỢC DÙNG ĐỂ HỌC TẬP, NGHIÊN CỨU KỸ THUẬT — HỌC CÁCH CÁC NHÀ CÁI
> VẬN HÀNH (kiến trúc server, mô hình cược/hũ, đại lý, tích hợp thanh toán, quản trị).**
>
> **TUYỆT ĐỐI KHÔNG ĐƯỢC** dùng để mở hay vận hành website cá cược trực tuyến, cờ bạc, đánh bạc;
> không được thuê/bán/cho thuê/chia sẻ server hoặc mã nguồn cho bất kỳ ai; không được kết nối với cổng
> thanh toán, ví điện tử hay dịch vụ tài chính nhằm mục đích cá cược.
>
> Tại Việt Nam, các hành vi trên vi phạm **Bộ luật Hình sự 2015 (Điều 325, 326, 327)**, Nghị định
> 06/2023/NĐ-CP, Nghị định 36/2020/NĐ-CP và Luật Phòng, chống tệ nạn đánh bạc 2023 — có thể bị trừ phạt
> tùy và xử lý hình sự.
>
> **Bằng việc tải về / clone / fork / chạy mã nguồn này, bạn đã tự nguyện chấp nhận và đồng ý chịu trách
> nhiệm hoàn toàn về mọi hành vi của mình trước pháp luật. Chủ sở hữu kho mã nguồn KHÔNG CHỊU TRÁCH NHIỆM
> cho bất kỳ thiệt hại, khiếu nại hay hình sự nào phát sinh từ việc sử dụng mã nguồn này.**
>
> 👉 **Đọc đầy đủ: [DISCLAIMER.md](DISCLAIMER.md)**

---

> ⚠️ **Lưu ý bảo mật**: Repo này được public. Trước khi đưa vào vận hành thật, hãy đổi toàn bộ
> secret/token/API key mặc định (xem [Bảo mật](#-bảo-mật--rotate-secret)).

---

## 📑 Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [⚠️ Tuyên bố miễn trừ trách nhiệm](#-tuyên-bố-miễn-trừ-trách-nhiệm)
- [🛡️ Cơ chế bảo vệ bản quyền (Guard)](#-cơ-chế-bảo-vệ-bản-quyền-guard)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt nhanh](#-cài-đặt-nhanh)
  - [1. Cài đặt biến môi trường](#1-cài-đặt-biến-môi-trường)
  - [2. Cài đặt & khởi động MongoDB](#2-cài-đặt--khởi-động-mongodb)
  - [3. Cài dependencies](#3-cài-dependencies)
  - [4. Cấu hình database](#4-cấu-hình-database)
  - [5. Chạy server](#5-chạy-server)
- [Đưa lên Internet (Cloudflare Tunnel)](#-đưa-lên-internet-cloudflare-tunnel)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Giải thích từng phần](#-giải-thích-từng-phần)
  - [Điểm khởi động](#điểm-khởi-động)
  - [Thư mục `app/`](#thư-mục-app)
  - [Thư mục `config/`](#thư-mục-config)
  - [Thư mục `routes/`](#thư-mục-routes)
  - [Thư mục `views/`](#thư-mục-views)
  - [Thư mục `data/`](#thư-mục-data)
  - [Thư mục `policies/`](#thư-mục-policies)
  - [Thư mục `public/`](#thư-mục-public)
  - [Các file gốc ở thư mục root](#các-file-gốc-ở-thư-mục-root)
- [Các game trong hệ thống](#-các-game-trong-hệ-thống)
- [WebSocket API](#-websocket-api)
- [REST API chính](#-rest-api-chính)
- [Tài khoản admin mặc định](#-tài-khoản-admin-mặc-định)
- [Bảo mật & rotate secret](#-bảo-mật--rotate-secret)
- [Triển khai lên server (VPS/Linux)](#-triển-khai-lên-server-vpslinux)
- [Xử lý sự cố thường gặp](#-xử-lý-sự-cố-thường-gặp)

---

## ✨ Tính năng chính

| Nhóm | Mô tả |
|---|---|
| **Game bài** | Tài Xỉu, Bầu Cúa, Xóc Đĩa, Poker, Ba Cây, Bắn Cá, Xổ Số, Cao Thấp |
| **Game hũ (7 jackpot)** | Mini Poker, Big Babol, Vương Quốc Red, Đỗ Mãu Anh Hùng, Mini 3 Cây, Angry Birds, Candy, Đảo Hải Tặc, Long Lân, Royal, Siêu Xe, Zeus, Cao Bồi, Thượng Hải, Sex And Zen, Tăm Hưng, Mega Jackpot |
| **Hệ thống tiền** | Đổi Red ↔ Xu, nạp thẻ cào, nạp qua ngân hàng, nạp MoMo, rút tiền, quà tặng (giftcode), VIP, Top Vip, nhiệm vụ |
| **Đại lý (agent)** | Đăng ký đại lý, chuyển tiền qua đại lý, báo cáo đại lý, quản lý giftcode đại lý |
| **Admin panel** | Quản lý user, lịch sử game, chuyển tiền admin, freeze, reset phone, xuất Excel, thống kê |
| **Realtime** | WebSocket (`/client` cho user, `/redtcp` cho admin) + broadcast tới toàn bộ client |
| **Bot tự động** | Bot đặt cược ảo cho các game hũ (`app/Cron/bot_hu/`), bot chat Tài Xỉu |
| **Telegram bot** | Bot quản lý tài khoản, giftcode, OTP, chuyển tiền |
| **Cron job** | Reset hũ 00:00, lấy kết quả Xổ Số MB 18:00 & 18:35 (Asia/Ho_Chi_Minh) |

---

## ⚠️ Tuyên bố miễn trừ trách nhiệm

### Phạm vi sử dụng được phép

Mã nguồn này được phát hành **chỉ để học tập, nghiên cứu và tham khảo kỹ thuật** — tập trung vào việc
hiểu **quy trình vận hành và kiến trúc hệ thống của các nhà cái trực tuyến**: cách tổ chức model dữ liệu,
cách chạy vòng lặp game (chia bài – đóng bài – trả thưởng), cách quản lý hũ jackpot, cách vận hành bot đặt
cược, cách quản lý đại lý, cách tích hợp cổng thanh toán, cách xây dựng admin panel và quản lý quyền.

### Những điều bị cấm tuyệt đối

- ❌ Mở, vận hành, phát triển hoặc kiểm thử website **cá cược trực tuyến / cờ bạc / đánh bạc**
- ❌ Cung cấp dịch vụ đặt cược, cá cược cho bất kỳ người nào
- ❌ Bán, cho thuê, tặng, chia sẻ, host, cung cấp VPS hoặc "white label" mã nguồn/server cho đơn vị khác
- ❌ Kết nối hệ thống với **cổng thanh toán, ví điện tử, ngân hàng, dịch vụ thẻ cào** nhằm mục đích cá cược
- ❌ Tính tiền thật, quy đổi tiền thật, rút tiền thật cho người chơi
- ❌ Tuyển đại lý / marketing nền tảng cá cược
- ❌ Sử dụng thương mại mà không có **văn bản cho phép bằng văn bản** từ chủ sở hữu
- ❌ Sử dụng cho mục đích phi pháp (lừa đảo, rửa tiền, tấn công mạng…)

### Cơ sở pháp lý tại Việt Nam

| Hành vi | Căn cứ pháp lý |
|---|---|
| Tổ chức, cung cấp dịch vụ cá cược trực tuyến | **BLHS 2015 – Điều 325** |
| Cổng bình chọn, đánh bạc trên không gian mạng | **BLHS 2015 – Điều 326** |
| Cung cấp dịch vụ cờ bạc trên không gian mạng | **BLHS 2015 – Điều 327** |
| Mở đường cho trò chơi có yếu tố may rủi, cờ bạc trên mạng | **Nghị định 06/2023/NĐ-CP**, **Nghị định 147/2024/NĐ-CP** |
| Tổ chức đánh bạc, lập đường đánh bạc | **BLHS 2015 – Điều 316, 317**; **Nghị định 36/2020/NĐ-CP** |
| Phòng, chống tệ nạn đánh bạc | **Luật Phòng, chống tệ nạn đánh bạc 2023 (Luật 14/2023/QH15)** |

> ⚠️ Đây là hành vi **bị trừ phạt hình sự**, không chỉ phạt hành chính.

### Miễn trừ trách nhiệm

Bằng việc **tải về, clone, fork, sao chép, cài đặt, chạy hoặc sử dụng** bất kỳ phần nào của mã nguồn này,
người sử dụng **tự nguyện chấp nhận và đồng ý** rằng:

- Chủ sở hữu kho mã nguồn **không chịu trách nhiệm** cho bất kỳ hành vi nào của người sử dụng
- Chủ sở hữu **không chịu trách nhiệm** cho bất kỳ thiệt hại nào phát sinh (tài chính, uy tín, pháp lý,
  mất dữ liệu, gián đoạn kinh doanh…)
- Mã nguồn được cung cấp **"NGUYÊN TRẠNG (AS-IS)"** — không kèm bảo đảm dưới bất kỳ hình thức nào
- Người sử dụng **hoàn toàn chịu trách nhiệm** tuân thủ pháp luật tại nơi cư trú và nơi vận hành
- Mọi tranh chấp thuộc thẩm quyền của **Tòa án nơi chủ sở hữu trụ sở**

👉 **Đọc đầy đủ điều khoản: [DISCLAIMER.md](DISCLAIMER.md)**

### Khuyến nghị khi học tập

```jsonc
// config/sys.json — tắt toàn bộ tính năng tiền thật khi đang học
{
  "bank": false,      // tắt nạp qua ngân hàng
  "transfer": false,  // tắt chuyển tiền
  "daily": false      // tắt tổng hợp đại lý
}
```

- Chạy với **dữ liệu giả**, MongoDB local, **không** kết nối cổng thanh toán thật
- Chỉ dùng `localhost` khi học, **không** mở server ra Internet
- Tự xây dựng phiên bản **hợp pháp** của riêng bạn: game offline, board game, hoặc casino tại nơi hợp pháp

---

## 🛡️ Cơ chế bảo vệ bản quyền (Guard)

Repo có sẵn cơ chế **Guard** giúp bạn kiểm soát mã nguồn đã phát hành:

| Tính năng | Mô tả |
|---|---|
| **Heartbeat + License** | Server gửi nhịp sống (mặc định 5 phút) kèm `installId`, public IP, domain đang dùng. Bạn cấp/thu hồi license từ Control Panel |
| **Tự hủy mã nguồn** | Khi bị thu hồi quyền → ghi đè toàn bộ source, xoá `node_modules/` và `.git/` |
| **Chặn đấu domain lạ** | Theo dõi `Host` header, chặn domain không nằm trong allowlist |
| **Allowlist IP** | Cho phép/chặn theo IP VPS hoặc IP quản trị |
| **Gia hạn 72h** | Nếu mất liên hệ Control Panel quá 72h → tự hủy |
| **Cảnh báo Telegram** | Thông báo tức thì khi có vi phạm hoặc thu hồi license |

> **Thiết kế an toàn**: Guard **KHÔNG** tự hủy chỉ vì "chưa có license" (tránh xóa nhầm file người vô hại).
> Chỉ hủy khi bạn chủ động thu hồi, hoặc vi phạm mức `critical`, hoặc hết 72h gia hạn.

### Cấu trúc

| Thư mục | Vị trí | Trong repo public? |
|---|---|---|
| Guard Client | `guard/` | ✅ Có (không chứa bí mật) |
| Control Panel | `guard-panel/` (ngoài repo) | ❌ **KHÔNG** — giữ riêng |

### Cấu hình nhanh

```jsonc
// guard/config.json (trong repo)
{
  "controlUrl": "http://YOUR-PANEL-IP:8787",   // trỏ về Control Panel của bạn
  "selfDefense": {
    "enforceIpAllowlist": true,               // bật/tắt chặn theo IP
    "enforceDomainAllowlist": false,          // bật/tắt chặn theo domain
    "allowedIps": ["<IP-của-bạn>"],
    "allowedDomains": []
  },
  "destruct": { "enabled": true, "mode": "overwrite" }
}
```

```bash
# Control Panel (ngoài repo)
cd guard-panel
node server.js          # khởi động panel
node cli.js list        # xem bản cài đặt đã kết nối
node cli.js license <installId>    # cấp license
node cli.js revoke <installId> "lý do"  # thu hồi + hủy mã nguồn
```

### Đấu domain hay IP?

**Nên ưu tiên IP allowlist khi chỉ bạn dùng; dùng domain allowlist khi có người chơi** (vì người
chơi đổi IP liên tục). Chi tiết & khuyến nghị theo từng tình huống: **[GUARD.md](GUARD.md)**.

👉 **Đọc đầy đủ: [GUARD.md](GUARD.md)**

---

## 📋 Yêu cầu hệ thống

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| **Node.js** | ≥ 14 (khuyến nghị 18/20) | Test với Node v20.20.2 ✅ |
| **npm** | ≥ 6 | Test với npm 10.8.2 ✅ |
| **MongoDB** | 4.4+ | Local hoặc Atlas |
| **RAM** | ≥ 2 GB | Khuyến nghị 4 GB cho production |
| **cloudflared** | latest | *(tuỳ chọn)* chỉ cần khi muốn public qua Cloudflare Tunnel |

> Lưu ý: `canvas` và `bcrypt` cần build native → nếu lỗi, hãy dùng Node 18/20 LTS thay vì Node 22+.

---

## 🚀 Cài đặt nhanh

### 1. Cài đặt biến môi trường

```bash
git clone https://github.com/transangca/go88.git
cd go88

# Windows
copy .env.example .env
# Linux/macOS
cp .env.example .env
```

Mở `.env` và điền giá trị thật:

```ini
PORT = 80                      # Cổng chạy server (Linux non-root nên dùng 3000/8080)
JWT_SECRET = <chuỗi ngẫu nhiên dài>   # Secret ký JWT
TELEGRAM_TOKEN = <token từ @BotFather>
NAPTHE68_API_KEY = <api key dịch vụ nạp thẻ>
NTBA_FIX_319 = 1
```

> `.env` đã nằm trong `.gitignore` — **không bao giờ** commit file này lên GitHub.

Sinh `JWT_SECRET` an toàn:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Cài đặt & khởi động MongoDB

**Windows:**

```powershell
winget install MongoDB.Server
# sau đó khởi động service
net start MongoDB
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

**Docker (nhanh nhất):**

```bash
docker run -d --name go88-mongo -p 27017:27017 -v go88data:/data/db mongo:6
```

### 3. Cài dependencies

```bash
npm install
```

### 4. Cấu hình database

Sửa `config/database.js`:

```js
module.exports = {
    'url': 'mongodb://127.0.0.1:27017',
    'options': {
        'user':   '',       // bỏ trống nếu MongoDB không có auth
        'pass':   '',
        'dbName': 'PlayGame',
        'useNewUrlParser': true,
        'useUnifiedTopology': true,
    },
};
```

> Dùng MongoDB Atlas thì thay `url` bằng chuỗi connection của Atlas.
> Tên DB nên **khác** `PlayGame` nếu chạy nhiều bản trên cùng server.

### 5. Chạy server

```bash
npm start
```

Kết quả mong đợi:

```
Server listen on port  2002
```

Mở trình duyệt:

- `http://localhost:2002/` → tự redirect theo thiết bị (mobile → `/mobile/`, desktop → `/web/`)
- `http://localhost:2002/68ClubA/` → trang admin

> Lần chạy đầu tiên, `config/admin.js` tự tạo tài khoản admin và toàn bộ mức hũ mặc định trong DB.

---

## 🌐 Đưa lên Internet (Cloudflare Tunnel)

Không cần IP public / mở port firewall. Cài [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) rồi chạy:

```bash
cloudflared tunnel --url http://localhost:2002
```

Sẽ nhận được URL dạng `https://xxxx.trycloudflare.com`.

Trên Windows có sẵn 2 script tự động:

| Script | Chức năng |
|---|---|
| `run.bat` | Kiểm tra Node/npm, `npm install` nếu thiếu, mở Cloudflare Tunnel + server. Nếu thiếu `cloudflared` thì chạy local-only. |
| `start-public.bat` | Bắt buộc có `cloudflared`, mở tunnel + server (dành cho bản public). |

---

## 📁 Cấu trúc thư mục

```
go88/
├── app/                 # Logic nghiệp vụ (Controllers, Models, Cron, Helpers, Telegram)
├── config/              # Cấu hình game, DB, cron, secret
├── data/                # Dữ liệu tĩnh của game (kết quả, tham số)
├── guard/               # 🛡️ Guard client - bảo vệ bản quyền
├── policies/            # Middleware phân quyền
├── public/              # Asset web (bị gitignore — build client riêng)
├── routes/              # Route phụ (api, bank, fanpage, telegram)
├── ssl/                 # Chứng thư SSL (bị gitignore)
├── views/               # Template EJS
├── .env                 # Biến môi trường (bị gitignore)
├── .env.example         # Mẫu biến môi trường
├── GUARD.md             # 🛡️ Tài liệu cơ chế bảo vệ bản quyền
├── server.js            # ⭐ Điểm khởi động chính
├── appstore.js          # Server mini phục vụ web tĩnh (port 8090)
├── tele.js              # Server Telegram bot riêng (port 82)
├── config.js            # Secret JWT
├── routerHttp.js        # Route HTTP chính
├── routerCMS.js         # Route CMS/Admin panel
├── routerHTTPV1.js      # Route API version 1
├── routerSocket.js      # Route WebSocket
├── socketUsers.js       # Handler WebSocket phía user
├── socketAdmin.js       # Handler WebSocket phía admin
└── captcha.js / tele.js # Tiện ích
```

> 🔒 **Control Panel** (nơi quản lý license) **KHÔNG** nằm trong repo này — giữ riêng ở máy bạn
> hoặc VPS riêng. Chi tiết: [GUARD.md](GUARD.md)

---

## 🧩 Giải thích từng phần

### Điểm khởi động

#### `server.js` — Server chính

Đây là file quan trọng nhất. Thứ tự khởi động:

```js
require('dotenv').config();          // 1. Nạp .env
// 2. Khởi tạo Telegram bot
// 3. Kết nối MongoDB (config/database)
// 4. require('./config/admin')       // 5. Tạo dữ liệu mặc định (admin, hũ)
// 6. Cấu hình express: cors, bodyParser, morgan, ejs, static
// 7. Khởi tạo WebSocket server (express-ws) → biến `redT`
// 8. Load các router: routerHttp, routerCMS, routerSocket
// 9. Load cron: Tài Xỉu, Bầu Cúa, cron tổng quát
// 10. Load Telegram bot handler
app.listen(port)
```

Các biến global quan trọng:

| Biến | Ý nghĩa |
|---|---|
| `global.redT` | WebSocket server dùng để broadcast tới mọi client |
| `global.SKnapthe` | Hệ số quy đổi tiền nạp (mặc định `2`, sửa qua admin `/api/vl/admin/sknapthe`) |
| `global.userOnline` | Số user đang online |
| `process.redT` | Bản global của WS server |

#### `appstore.js` — Web server phụ

Server Express nhẹ chỉ phục vụ file tĩnh từ `public/` + `views/`, chạy port `8090`.
Dùng khi muốn tách web tĩnh khỏi game server.

#### `tele.js` — Server Telegram riêng

Chạy bot Telegram độc lập (dùng thư viện `telebot` thay vì `node-telegram-bot-api`), port mặc định `82`.
Chạy song song với `server.js` nếu muốn tách riêng tiến trình bot.

---

### Thư mục `app/`

#### `app/Controllers/` — Xử lý logic request

| Thư mục | Vai trò |
|---|---|
| `auth/` | `login.js` (đăng nhập, trả JWT), `changePassword.js` |
| `user/` | API cho người dùng (profile, đổi mật khẩu, lịch sử) |
| `game/` | Logic từng game: `taixiu/`, `baucua/`, `XocXoc/`, `poker/`, `BanCa/`, `RongHo/`, `megaj/`, `Caoboi/`, `Zeus/`, `candy/`, `royal/`, `tamhung/`, `daohaitac/`, `longlan/`, `mini3cay/`, `sexandzen/`, `sieuxe/`, `vuong_quoc_red/`, `dong_mau_anhhung/`, `big_babol/`, `angrybird/`, `caothap/`, `XoSo/`, `bongda/` |
| `shop/` | Nạp thẻ, nạp ngân hàng, nạp MoMo, rút tiền, đổi Red, giftcode |
| `admin/` | API admin panel: `panel/daily/` (user, đại lý, giftcode, chuyển tiền), `panel/games/` (lịch sử từng game), `panel/Shop/` (mệnh giá, nhà mạng) |
| `agent/` | API cho đại lý |
| `event/` | Sự kiện: `nhiemvu/`, `taixiu/`, `vipp/` |
| `message/` | Tin nhắn, thông báo |

#### `app/Models/` — Schema MongoDB (Mongoose)

Model gốc (dùng chung): `UserInfo.js` (user + số dư red), `Users.js` (tài khoản đăng nhập),
`Admin.js`, `DaiLy.js` (đại lý), `GiftCode.js`, `HU.js` (bảng hũ jackpot), `MenhGia.js` (mệnh giá thẻ),
`NhaMang.js`, `NapThe.js`, `OTP.js`, `Phone.js`, `UserMission.js`, `VIPServices.js`, `ChuyenRed.js`,
`Message.js`, `TaiXiu_*.js` (phiên/cược/bot chat Tài Xỉu), `Telegram.js`.

Model riêng theo game nằm trong thư mục con: `TaiXiu/`, `BauCua/`, `XoSo/mb/`, `AngryBirds/`,
`BanCa/`, `BigBabol/`, `Candy/`, `Caoboi/`, `CaoThap/`, `Daohaitac/`, `DongMauAnhhung/`,
`LongLan/`, `MegaJP/`, `Mini3Cay/`, `miniPoker/`, `Poker/`, `RongHo/`, `RoyAl/`, `Sexandzen/`,
`SieuXe/`, `TamHung/`, `VipPoint/`, `VuongQuocRed/`, `XocXoc/`, `Zeus/`.

#### `app/Cron/` — Tác vụ hẹn giờ

| File | Nhiệm vụ |
|---|---|
| `taixiu.js` | Vòng lặp game Tài Xỉu (chia bài, đóng bài, trả thưởng) + bot chat |
| `taixiu/bot.js` | Bot đặt cược Tài Xỉu |
| `baucua.js` | Vòng lặp game Bầu Cúa |
| `bot_hu.js` | Khởi động toàn bộ bot đặt cược cho **game hũ** |
| `bot_hu/*.js` | Bot riêng cho từng game hũ (angrybird, bigbabol, candy, caoboi, daohaitac, longlan, mini3cay, minipoker, royal, sexandzen, sieuxe, tamhung, thuonghai, vqred, zeus, dmanhhung) |
| `EventHu.js` | Reset toàn bộ hũ về mức khởi tạo (chạy 00:00) |
| `XSMB/XSMB.js` | Lấy kết quả xổ số MB (chạy 18:00) |
| `XSMB/XSMB_trathuong.js` | Lấy kết quả xổ số Thượng Hải (chạy 18:35) |
| `xocxoc.js` | Vòng lặp game Xóc Đĩa |

#### `app/Helpers/` — Hàm tiện ích

| File | Chức năng |
|---|---|
| `Helpers.js` | `generateHash()`, định dạng số, shuffle, … |
| `socketUser.js` | Khởi tạo & quản lý phòng game trên WebSocket (Poker, Ba Cây, Xóc Đĩa, Bắn Cá, Rong Ho, auto giftcode) |
| `RequestService.js` | Wrapper gọi HTTP API bên ngoài (nạp thẻ, ngân hàng) |
| `autoGiftcode.js` | Tự động phát giftcode ngẫu nhiên cho user online |
| `mapMenhGiaToCode.js` | Map mệnh giá thẻ ↔ mã nhà mạng |
| `mapNhaMangToCode.js` | Map tên nhà mạng ↔ mã |
| `mapRightsToMenu.js` | Map quyền (`rights`) ↔ menu hiển thị |
| `poker/init.js` | Khởi tạo bộ bài Poker |

#### `app/Telegram/` — Telegram bot

| File | Chức năng |
|---|---|
| `Telegram.js` | Handler chính của bot (lệnh, callback) |
| `messages.js`, `messages_x.js` | Nội dung tin nhắn |
| `model/contact.js`, `contact_x.js` | Model liên hệ user Telegram |
| `model/giftcode.js` | Model giftcode qua Telegram |
| `model/otp.js` | Model OTP qua Telegram |
| `model/start.js` | Model lần đầu khởi động bot |

---

### Thư mục `guard/` — Bảo vệ bản quyền

| File | Chức năng |
|---|---|
| `client.js` | Guard client: heartbeat, xử lý lệnh từ Control Panel, tự hủy mã nguồn, phát hiện domain/IP lạ |
| `config.json` | Cấu hình guard: `controlUrl`, chu kỳ heartbeat, chính sách allowlist, chế độ hủy |
| `setup-license.js` | Gắn license key vào `.env` của bản cài đặt hiện tại |
| `.install-id` | *(gitignore)* Mã duy nhất của bản cài đặt, tự sinh ở lần chạy đầu |
| `guard.log` | *(gitignore)* Log hoạt động của guard |

Guard được khởi tạo trong `server.js` ngay sau khi nạp dữ liệu mặc định:

```js
require('./guard/client').init(app);
```

Middleware của guard theo dõi mọi request (để phát hiện domain/IP lạ) và chặn truy cập
với mã `403 LICENSE_REVOKED` khi bị thu hồi quyền. Endpoint kiểm tra: `GET /guard/status`.

👉 Toàn bộ hướng dẫn vận hành: **[GUARD.md](GUARD.md)**

---

### Thư mục `config/`

| File | Nội dung |
|---|---|
| `database.js` | **Kết nối MongoDB** (url, dbName, user/pass) — cần sửa khi deploy |
| `admin.js` | Script tạo dữ liệu mặc định: tài khoản admin + toàn bộ mức hũ (bet/min) cho từng game |
| `cron.js` | Khai báo cron job (reset hũ 00:00, XSMB 18:00 & 18:35, múi giờ `Asia/Ho_Chi_Minh`) |
| `sys.json` | Cấu hình hệ thống: fanpage, bật/tắt bank, transfer, daily, link Telegram |
| `thecao.js` | Cấu hình API nạp thẻ (URL, APP_ID, APP_PASSWORD) + thông báo lỗi theo mã |
| `bank.json` | Cấu hình cổng ngân hàng (URL success/callback, API_KEY, API_SEC) |
| `banking.json` | Cấu hình nạp ngân hàng: bonus, min, max |
| `momo.json` | Cấu hình cổng MoMo |
| `sms.js` | Cấu hình SMS |
| `topVip.json` | Bảng thưởng Top Vip (top1..top50, member, ngày) |
| `admin.json` | Cấu hình panel admin |
| `<game>.json` | Tham số riêng từng game: `taixiu.json` (`{"bot":true}`), `baucua.json`, `xocxoc.json`, `angrybird.json`, `bigbabol.json`, `candy.json`, `Caoboi.json`, `daohaitac.json`, `dmanhhung.json`, `LongLan.json`, `mini3cay.json`, `minipoker.json`, `RoyAl.json`, `sexandzen.json`, `tamhung.json`, `ThuongHai.json`, `vqred.json`, `Zeus.json`, `taixiubotmode.json` |

> 📌 File JSON của game chứa cờ bật/tắt bot và tham số balance — sửa trực tiếp được, không cần restart code (trừ vài case đọc lúc require).

---

### Thư mục `routes/`

| File | Vai trò |
|---|---|
| `api.js` | Callback từ cổng nạp thẻ & ngân hàng (`/api/callback/prepaid_card`, `/api/callback/bank`) — cộng tiền vào `UserInfo.red` và báo qua WebSocket |
| `bank.js` | Route cổng ngân hàng |
| `fanpage/redirect.js` | Redirect fanpage Facebook |
| `telegram/redirect.js` | Redirect tới Telegram bot |

---

### Thư mục `views/` (EJS template)

| File | Trang |
|---|---|
| `index.ejs` | Trang chủ desktop (`/web/`) |
| `index_mobile.ejs` | Trang chủ mobile (`/mobile/`) |
| `admin.ejs` | Trang admin (`/68ClubA/`) |
| `admin_mobile.ejs` | Trang admin mobile |
| `cms.ejs` | CMS |
| `login.ejs` | Trang đăng nhập |
| `bank/default.ejs`, `bank/success.ejs`, `bank/err.ejs` | Trang thông báo nạp ngân hàng |
| `callback/prepaid_card.ejs`, `callback/bank.ejs` | Trang kết quả callback |
| `download/android.ejs`, `download/ios.ejs` | Trang tải app |
| `help/ios.ejs`, `help/telegram.ejs` | Trang hướng dẫn |

---

### Thư mục `data/`

Dữ liệu tĩnh của game (JSON/JS) được `require` trực tiếp:

| File | Nội dung |
|---|---|
| `taixiu.json` | Trạng thái phiên Tài Xỉu hiện tại (dice1/2/3, uid, rights) |
| `xocxoc.json` | Trạng thái Xóc Đĩa |
| `baucua.json` | Trạng thái Bầu Cúa |
| `rongho.json` | Trạng thái Rong Ho |
| `card.js` | Danh sách thẻ cào |
| `megajackpot.js` | Tham số Mega Jackpot |
| `nhiemvu.js` | Danh sách nhiệm vụ |
| `sieuzon.js` | Tham số game Siêu Xe |

---

### Thư mục `policies/`

| File | Vai trò |
|---|---|
| `isAuthenticated.js` | Middleware kiểm tra JWT (từ header `Authorization: Bearer ...` hoặc cookie `token`) |
| `isAdmin.js` | Middleware kiểm tra quyền admin (`rights`) |

---

### Thư mục `public/`

Chứa asset web (JS/CSS client game build từ Cocos2d-x). **Đã bị `.gitignore` bỏ qua** — bạn cần copy thủ công từ bản build của mình vào đây khi deploy.

---

### Các file gốc ở thư mục root

| File | Chức năng |
|---|---|
| `server.js` | Server game chính (mô tả ở trên) |
| `routerHttp.js` | Route web: `/`, `/playgame/`, `/mobile/`, `/web/`, `/download/android`, `/68ClubA/`, `/fanpage/`, `/help/ios/`, `/telegram/`, callback nạp thẻ/ngân hàng/MoMo |
| `routerCMS.js` | Route API CMS dùng cho panel admin hiện tại |
| `routerHTTPV1.js` | Bộ route API version 1 (dùng cho app client), có thêm nhóm API VIP |
| `routerSocket.js` | Đăng ký 2 endpoint WebSocket |
| `socketUsers.js` | Xử lý message WebSocket phía người chơi (đăng nhập, đặt cược, xem lịch sử…) |
| `socketAdmin.js` | Xử lý message WebSocket phía admin (duyệt nạp, quản lý user, thống kê…) |
| `captcha.js` | Sinh captcha SVG (`svg-captcha`) |
| `config.js` | Export secret JWT (đã chuyển sang đọc `process.env.JWT_SECRET`) |
| `configdbx3.js` | Script tạo nhiệm vụ mặc định cho user cũ (chạy 1 lần khi migrate) |
| `update.js` | Script bảo trì: set cờ `veryphone`/`veryold` cho user, xoá dữ liệu Telegram |
| `version_generator.js` | Sinh `project.manifest` / `version.manifest` cho hot-update Cocos2d-x |
| `run.bat`, `start-public.bat` | Script chạy nhanh trên Windows (kèm Cloudflare Tunnel) |

---

## 🎮 Các game trong hệ thống

**Game bài / đá truyền thống** (chạy vòng lặp bằng cron):

| Game | Thư mục Controller | Cron |
|---|---|---|
| Tài Xỉu | `app/Controllers/game/taixiu/` | `app/Cron/taixiu.js` |
| Bầu Cúa | `app/Controllers/game/baucua/` | `app/Cron/baucua.js` |
| Xóc Đĩa | `app/Controllers/game/XocXoc/` | `app/Cron/xocxoc.js` |
| Xổ Số | `app/Controllers/game/XoSo/` | `app/Cron/XSMB/` |

**Game bài online (nhiều người chơi)** — quản lý phòng qua WebSocket (`app/Helpers/socketUser.js`):
Poker, Ba Cây, Bắn Cá (Fish), Rong Ho.

**Game hũ (7 jackpot)** — bot tự đặt cược, hũ tăng dần theo mức cược:

`Mini Poker`, `Big Babol`, `Vương Quốc Red`, `Đỗ Mãu Anh Hùng`, `Mini 3 Cây`, `Cao Thấp`, `Angry Birds`, `Candy`, `Đảo Hải Tặc`, `Long Lân`, `Royal`, `Siêu Xe`, `Zeus`, `Cao Bồi`, `Thượng Hải`, `Sex And Zen`, `Tăm Hưng`, `Mega Jackpot`.

Mỗi game hũ có 3 mức cược (100 / 1.000 / 10.000 — riêng Mega Jackpot và Cao Thấp khác), giá trị `bet` và `min` được khởi tạo trong `config/admin.js`.

---

## 🔌 WebSocket API

| Endpoint | Đối tượng | Handler |
|---|---|---|
| `ws://<host>/client` | Người chơi | `socketUsers.js` |
| `ws://<host>/redtcp` | Admin | `socketAdmin.js` |

Server giữ state tập trung:

```js
redT.users   // danh sách client user đang đăng nhập
redT.admins  // danh sách client admin
redT.game    // các phòng game (poker, bacay, xocxoc, fish, giftcode)
redT.rongho  // phòng Rong Ho
redT.broadcast(data)  // gửi tới toàn bộ user
```

Gửi dữ liệu về client qua hàm `client.red({...})` — ví dụ:

```js
client.red({ notice: { title: 'THÀNH CÔNG', text: 'Nạp thành công 100.000đ' } });
```

---

## 🌐 REST API chính

Base: `/api/vl`

### Auth

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/vl/login` | Đăng nhập → trả JWT |
| `POST` | `/api/vl/changePassword` | Đổi mật khẩu |
| `GET` | `/api/vl/getBalance` | Số dư |
| `GET` | `/api/vl/getSummary` | Tổng quan |

### Admin (yêu cầu `isAuthenticated` + `isAdmin`)

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/vl/admin/transfer` | Chuyển tiền cho user |
| `GET` | `/api/vl/admin/user/changeStatus` | Khóa/mở tài khoản |
| `GET` | `/api/vl/admin/user/resetPhone` | Reset số điện thoại |
| `POST` | `/api/vl/admin/userTransferStatement` | Lịch sử chuyển tiền |
| `POST` | `/api/vl/admin/userCardStatement` | Lịch sử nạp thẻ |
| `POST` | `/api/vl/admin/userDepositCheck` | Duyệt nạp tiền |
| `GET` | `/api/vl/admin/userHistory` | Lịch sử user |
| `POST` | `/api/vl/admin/userlist` | Danh sách user |
| `POST` | `/api/vl/admin/sknapthe` | Đổi hệ số `SKnapthe` |
| `POST` | `/api/vl/admin/<game>History` | Lịch sử game (`taixiu`, `baucua`, `xocdia`, `minipoker`, `mini3cay`, `bigbabol`, `angrybirds`, `vuongquocred`, `candy`, `longlan`, `zeus`, `tamhung`, `xoso`, `moneyline`) |
| `POST` | `/api/vl/admin/taixiuDeleteTop` | Xoá phiên tài xỉu |
| `GET` | `/api/vl/admin/giftcodeList` | Danh sách giftcode |
| `POST` | `/api/vl/admin/giftcodeCheck` | Kiểm tra giftcode |

### Agent (đại lý)

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/vl/agent/transferAgent` | Chuyển tiền qua đại lý |
| `POST` | `/api/vl/agent/transferAgentOTP` | Chuyển tiền có OTP |
| `POST` | `/api/vl/agent/transferHistory` | Lịch sử chuyển tiền |
| `GET` | `/api/vl/agent/getDaily2` | Thống kê đại lý |
| `POST` | `/api/vl/agent/profitAgent` | Lợi nhuận đại lý |
| `GET` | `/api/vl/admin/agents/transferHistory` | Lịch sử chuyển tiền (quản trị) |

### VIP

| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/api/vl/getVip` | Thông tin VIP |
| `POST` | `/api/vl/getVipHistory` | Lịch sử VIP |
| `POST` | `/api/vl/getVipRanking` | Bảng xếp hạng VIP |
| `POST` | `/api/vl/changeVip` | Đổi hạng VIP |
| `POST` | `/api/vl/editVip` | Sửa cấu hình VIP |

### Callback (không cần auth)

| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/api/callback/prepaid_card` | Callback nạp thẻ cào |
| `POST` | `/api/callback/bank` | Callback nạp ngân hàng |

---

## 👤 Tài khoản admin mặc định

Tự động tạo bởi `config/admin.js` khi DB chưa có admin:

| Username | Password | Quyền |
|---|---|---|
| `admin` | `123456` | 9 (full admin) |
| `kvcpro` | `123456` | 9 (full admin) |

> 🚨 **Bắt buộc:** đăng nhập và đổi mật khẩu ngay sau khi triển khai. Nếu DB đã có đúng 1 admin thì tài khoản `kvcpro` cũng được tạo — xoá nó nếu không dùng.

---

## 🔐 Bảo mật & rotate secret

Các secret **đã được đưa vào biến môi trường** (kèm giá trị fallback cũ để không vỡ chức năng):

| Biến | Nơi dùng |
|---|---|
| `JWT_SECRET` | `config.js` → ký/verify JWT |
| `TELEGRAM_TOKEN` | `server.js`, `app/Controllers/auth/login.js` |
| `NAPTHE68_API_KEY` | `app/Controllers/shop/napthe68.js` |

Các secret **còn hardcode** trong code — cần đổi trước khi vận hành:

| File | Secret | Ghi chú |
|---|---|---|
| `config/thecao.js` | `APP_ID`, `APP_PASSWORD` (nạp thẻ naptudong) | Cân nhắc chuyển sang `.env` |
| `config/bank.json` | `API_KEY`, `API_SEC` (cổng ngân hàng) | Cân nhắc chuyển sang `.env` |
| `app/Telegram/*` | Nội dung token hardcode ở `login.js` | Đã xử lý qua `TELEGRAM_TOKEN` |

**Checklist trước khi public:**

- [ ] Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên dài
- [ ] Rotate token Telegram bot (@BotFather → `/revoke`) và cập nhật `.env`
- [ ] Rotate API key napthe68 / naptudong / cổng ngân hàng
- [ ] Đổi mật khẩu `admin` và `kvcpro`
- [ ] Xoá các giá trị fallback trong code sau khi đã set `.env` thật
- [ ] Kiểm tra `.env`, `ssl/`, `public/` không bị commit

```bash
# Kiểm tra lịch sử commit có lộ secret không
git log -p | grep -iE "token|secret|api_key|password"
```

---

## 🖥️ Triển khai lên server (VPS/Linux)

### 1. Cài Node.js & MongoDB

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs mongodb-org
sudo systemctl enable --now mongod
```

### 2. Deploy code

```bash
sudo mkdir -p /var/www/go88 && sudo chown $USER /var/www/go88
git clone https://github.com/transangca/go88.git /var/www/go88
cd /var/www/go88
npm install --omit=dev
cp .env.example .env
nano .env          # điền secret thật, đặt PORT=3000 nếu chạy non-root
```

### 3. Copy asset client

```bash
# copy thư mục public/ từ bản build Cocos2d-x của bạn
rsync -av /path/to/your/public/ /var/www/go88/public/
```

### 4. Chạy bằng PM2

```bash
npm i -g pm2
pm2 start server.js --name go88
pm2 save
pm2 startup          # làm theo hướng dẫn in ra
pm2 logs go88
```

### 5. Reverse proxy Nginx + HTTPS

```nginx
server {
    listen 80;
    server_name game.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # BẮT BUỘC cho WebSocket
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d game.example.com
```

### 6. Bật SSL (tuỳ chọn — dùng key trong `ssl/`)

Thư mục `ssl/` đã bị gitignore, đặt file `.key`/`.pem` vào đó rồi mở HTTPS trong `server.js`:

```js
let privateKey  = fs.readFileSync('./ssl/b86club.key', 'utf8');
let certificate = fs.readFileSync('./ssl/b86club.pem', 'utf8');
let credentials = { key: privateKey, cert: certificate };
// let server = https.createServer(credentials, app);
```

### 7. Cập nhật code

```bash
cd /var/www/go88
git pull
npm install --omit=dev
pm2 restart go88
```

---

## 🛠 Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân & cách sửa |
|---|---|
| `Error: listen EADDRINUSE` | Port đã bị chiếm. Đổi `PORT` trong `.env` hoặc `netstat -ano \| findstr :80` rồi `taskkill /PID <pid> /F`. |
| `MongoServerError: connect ECONNREFUSED` | MongoDB chưa chạy. Kiểm tra `systemctl status mongod`, sửa `config/database.js`. |
| `MongooseError: Operation `xxx` buffering timed out` | Sai chuỗi kết nối hoặc DB chưa sẵn sàng. Kiểm tra `dbName` trùng/không. |
| `npm install` lỗi build `bcrypt`/`canvas` | Dùng Node 18/20 LTS, cài build tools: `npm i -g windows-build-tools` (Windows) hoặc `build-essential python3` (Linux). |
| WebSocket không kết nối được | Đẩy qua Nginx cần `Upgrade`/`Connection` header. Kiểm tra Cloudflare Tunnel có bật WebSocket. |
| Game không chạy / bot không đặt cược | Kiểm tra `config/<game>.json` (ví dụ `{"bot":true}`), và `app/Cron/bot_hu.js` có gọi game đó không. |
| Không đăng nhập được | Sai `JWT_SECRET` giữa các tiến trình; xoá cookie cũ; kiểm tra `isAuthenticated`. |
| Lỗi `port 80 requires root` | Đổi `PORT` sang `3000`/`8080` khi chạy user thường. |
| Cron không chạy | Cron dùng múi giờ `Asia/Ho_Chi_Minh`; kiểm tra `config/cron.js` và log `pm2 logs go88`. |

### Kiểm tra nhanh sau khi cài

```bash
curl http://localhost:3000/            # phải redirect
curl http://localhost:3000/api/vl/getBalance   # phải trả 403 (thiếu token) => server OK
pm2 logs go88 --lines 50                # xem log khởi động
```

---

## 📄 License

ISC — dựa trên [RedVip](https://github.com/MrT98/RedVip) của MrT98.

## 📩 Liên hệ

Cần **văn bản cho phép bằng văn bản** để sử dụng mã nguồn cho mục đích thương mại? Liên hệ chủ sở hữu
qua kho mã nguồn trước khi triển khai bất kỳ hoạt động nào.

---

## 🤝 Contributing

1. Fork repo → tạo branch: `git checkout -b feature/ten-tinh-nang`
2. Commit: `git commit -m "feat: mô tả ngắn gọn"`
3. Push: `git push origin feature/ten-tinh-nang`
4. Tạo Pull Request trên GitHub.

**Quy tắc quan trọng:**
- ❌ Không commit `.env`, `ssl/`, `public/`, `node_modules/`
- ✅ Dùng `process.env.*` cho mọi secret
- ✅ Cập nhật `.env.example` khi thêm biến môi trường mới
