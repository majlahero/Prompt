# DEPLOY — Phá Prompt lên trochoi.id.vn

Deploy app lên server Ubuntu dùng Docker + Cloudflare Tunnel.
Không cần IP public, không cần mở port, không cần cài Certbot — Cloudflare lo hết SSL + bảo vệ DDoS.

Kiến trúc: App (Next.js standalone + SQLite) + cloudflared tunnel, chạy trong Docker.

---

## 0. Tạo Cloudflare Tunnel (làm 1 lần, trên web)

### 0.1 Thêm domain vào Cloudflare
1. Vào https://dash.cloudflare.com -> Add a site -> nhập `trochoi.id.vn`
2. Chọn plan **Free**
3. Cloudflare cho 2 nameserver (vd: `anna.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
4. Vào nhà cung cấp domain .id.vn, **đổi nameserver** sang 2 cái Cloudflare cho
5. Đợi 5-30 phút, Cloudflare báo "Active" là xong

### 0.2 Tạo Tunnel
1. Vào https://one.dash.cloudflare.com -> Networks -> Tunnels
2. Nhấn **Create a tunnel**
3. Chọn **Cloudflared** -> đặt tên tunnel (vd: `pha-prompt`)
4. Cloudflare hiện 1 đoạn lệnh chứa **token** dạng:
   ```
   cloudflared service install eyJhIjoiNGY1ZjQ2ZT...
   ```
   Copy phần token dài đó (bắt đầu bằng `eyJ...`) -> lát nữa dán vào .env

### 0.3 Cấu hình Public Hostname cho tunnel
1. Trong trang tunnel vừa tạo, tab **Public Hostname** -> Add a public hostname
2. Điền:
   - Subdomain: (để trống = root domain)
   - Domain: `trochoi.id.vn`
   - Service Type: **HTTP**
   - URL: **app:3000**
3. Save
4. (Tùy chọn) Thêm thêm 1 hostname cho `www.trochoi.id.vn` trỏ cùng `HTTP://app:3000`

---

## 1. Cài Docker trên Ubuntu (nếu chưa có)

    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    # đăng xuất / đăng nhập lại
    docker --version
    docker compose version

---

## 2. Lấy code về server

    git clone https://github.com/majlahero/Prompt.git
    cd Prompt

---

## 3. Cấu hình .env

    cp .env.example .env
    nano .env

Điền:
- `CLOUDFLARE_TUNNEL_TOKEN=eyJ...` — token từ bước 0.2
- `OPENAI_API_KEY=` — để trống = chat mock, điền key = dùng LLM thật
- `AUTH_SECRET=` — sinh bằng: `openssl rand -base64 32`
- `DATABASE_URL` và `AUTH_URL` — giữ nguyên

Lưu: Ctrl+O, Enter, Ctrl+X.

---

## 4. Chạy

    chmod +x docker-entrypoint.sh
    docker compose up -d

Lần đầu mất 3-5 phút để build image. Sau đó:
- App tự tạo bảng DB + seed 20 levels
- Cloudflared tự kết nối tunnel về Cloudflare

Kiểm tra:

    docker compose ps          # 2 service phải UP
    docker compose logs -f app # xem log app

Mở trình duyệt: **https://trochoi.id.vn**

---

## 5. Vận hành

Xem log:

    docker compose logs -f app
    docker compose logs -f tunnel

Khởi động / dừng:

    docker compose up -d
    docker compose down

Cập nhật code:

    git pull
    docker compose up -d --build app

Trạng thái:

    docker compose ps

---

## 6. Dữ liệu (SQLite)

DB trong Docker volume `db-data` (mount vào `/data/prod.db`), KHÔNG mất khi rebuild/restart.

- Lần đầu: container tự `prisma db push` + seed 20 levels.
- Các lần sau: bỏ qua seed để giữ data.
- Backup DB:

      docker compose cp app:/data/prod.db ./backup-$(date +%F).db

- Reset sạch:

      docker compose down
      docker volume rm prompt_db-data
      docker compose up -d

---

## 7. Xử lý sự cố

| Triệu chứng | Cách xử lý |
|---|---|
| Tunnel "connection refused" | Token sai hoặc hết hạn. Kiểm tra `docker compose logs tunnel`. Tạo token mới trên Cloudflare dashboard. |
| App 502 trên Cloudflare | Container app chưa ready. `docker compose logs app` xem lỗi. |
| Chat luôn trả câu mẫu | Chưa set `OPENAI_API_KEY` (đang chạy mock — bình thường). |
| "trochoi.id.vn refused to connect" | Nameserver chưa chuyển sang Cloudflare, hoặc tunnel chưa UP. |
| Đổi domain | Sửa Public Hostname trên Cloudflare dashboard + `AUTH_URL` trong `.env`. |

---

## Tóm tắt (server đã cài Docker + Cloudflare Tunnel đã tạo)

    git clone https://github.com/majlahero/Prompt.git && cd Prompt
    cp .env.example .env && nano .env       # dán CLOUDFLARE_TUNNEL_TOKEN
    chmod +x docker-entrypoint.sh
    docker compose up -d
    # -> https://trochoi.id.vn
