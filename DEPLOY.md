# DEPLOY — Phá Prompt lên trochoi.id.vn

Hướng dẫn deploy app lên 1 server Ubuntu, domain `trochoi.id.vn`, chạy bằng Docker + Nginx + HTTPS (Let's Encrypt).

Kiến trúc: 1 container app (Next.js standalone + SQLite trên volume) đứng sau Nginx reverse proxy có TLS.

---

## 0. Chuẩn bị (làm 1 lần)

### DNS
Trỏ domain về IP server (ở trang quản lý tên miền .id.vn):

    A     trochoi.id.vn        ->  <IP_SERVER>
    A     www.trochoi.id.vn    ->  <IP_SERVER>

Kiểm tra đã trỏ đúng: `dig +short trochoi.id.vn` phải ra IP server.

### Mở firewall
    sudo ufw allow 22
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw enable

---

## 1. Cài Docker trên Ubuntu

    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    # đăng xuất / đăng nhập lại để nhóm docker có hiệu lực
    docker --version
    docker compose version

---

## 2. Lấy code về server

    git clone https://github.com/majlahero/Prompt.git
    cd Prompt

(Nếu code nằm trong thư mục con, cd vào đúng thư mục chứa Dockerfile.)

---

## 3. Cấu hình biến môi trường

    cp .env.example .env
    nano .env

- `OPENAI_API_KEY` — để trống thì chat chạy MOCK (vẫn demo được). Điền key thật để PIP dùng LLM.
- `AUTH_SECRET` — sinh bằng `openssl rand -base64 32` (chỉ cần khi bật đăng nhập).
- `DATABASE_URL` — giữ nguyên `file:/data/prod.db`.

---

## 4. Sửa email trong script cert

    nano init-letsencrypt.sh
    # đổi dòng EMAIL="admin@trochoi.id.vn" thành email thật của bạn
    # (khuyến nghị) đặt STAGING=1 để test lần đầu, thành công thì đổi lại =0 và chạy lại

---

## 5. Xin SSL + khởi động toàn bộ (làm 1 lần)

    chmod +x init-letsencrypt.sh docker-entrypoint.sh
    ./init-letsencrypt.sh

Script tự động:
1. Dựng nginx ở chế độ HTTP tạm.
2. Xin cert Let's Encrypt cho trochoi.id.vn + www.
3. Chuyển nginx sang HTTPS đầy đủ.
4. Bật certbot auto-renew (nền, tự gia hạn mỗi 12h).

Xong -> truy cập **https://trochoi.id.vn**

---

## 6. Vận hành hằng ngày

Xem log:

    docker compose logs -f app
    docker compose logs -f nginx

Khởi động / dừng:

    docker compose up -d
    docker compose down

Cập nhật code mới (deploy lại):

    git pull
    docker compose up -d --build app
    # nginx không cần build lại

Trạng thái:

    docker compose ps

---

## 7. Dữ liệu (SQLite)

DB nằm trong Docker volume `db-data` (mount vào `/data/prod.db` trong container), KHÔNG mất khi rebuild/restart.

- Container tự chạy `prisma db push` + seed 20 levels ở lần khởi động ĐẦU (khi DB rỗng). Các lần sau bỏ qua seed để giữ data.
- Backup DB:

      docker compose cp app:/data/prod.db ./backup-$(date +%F).db

- Reset sạch (XÓA HẾT data, seed lại từ đầu):

      docker compose down
      docker volume rm prompt_db-data   # tên volume = <thư_mục>_db-data, kiểm tra bằng: docker volume ls
      docker compose up -d

---

## 8. Xử lý sự cố

| Triệu chứng | Cách xử lý |
|---|---|
| Certbot báo "challenge failed" | DNS chưa trỏ đúng IP, hoặc port 80 bị chặn. Kiểm tra `dig` + `ufw`. |
| Trình duyệt "cert không hợp lệ" | Bạn để `STAGING=1`. Đổi `STAGING=0`, xóa `certbot/conf/live`, chạy lại `init-letsencrypt.sh`. |
| App 502 Bad Gateway | Container app chưa sẵn sàng. `docker compose logs app` xem lỗi. |
| Chat luôn trả câu mẫu | Chưa set `OPENAI_API_KEY` trong `.env` (đang chạy mock — bình thường). |
| Đổi domain | Sửa `nginx/conf.d/app.conf`, `init-letsencrypt.sh`, `AUTH_URL` trong `.env`, xin cert lại. |

---

## Tóm tắt lệnh (server đã cài Docker + DNS trỏ đúng)

    git clone https://github.com/majlahero/Prompt.git && cd Prompt
    cp .env.example .env && nano .env
    nano init-letsencrypt.sh          # đổi EMAIL
    chmod +x init-letsencrypt.sh docker-entrypoint.sh
    ./init-letsencrypt.sh
    # -> https://trochoi.id.vn
