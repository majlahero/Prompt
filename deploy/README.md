# Auto-deploy qua GitHub webhook

Khi có commit push lên nhánh `master`, GitHub gọi webhook → listener trên máy
server tự `git reset --hard origin/master` → `docker compose build app` → `up -d`.

## Thành phần
- `webhook.py` — HTTP listener (Python stdlib), xác thực HMAC-SHA256, cổng 9000.
- `deploy.sh` — script pull + rebuild, chạy tuần tự nhờ `flock`.
- `prompt-webhook.service` — systemd unit chạy listener dưới user `hoa`.
- `webhook.env` — chứa `WEBHOOK_SECRET` (KHÔNG commit, đã gitignore).

## Cài lại trên máy mới
```bash
# 1. user chạy được docker
sudo usermod -aG docker $USER   # đăng nhập lại sau lệnh này

# 2. tạo secret
openssl rand -hex 32   # dán vào deploy/webhook.env: WEBHOOK_SECRET=...
printf 'WEBHOOK_SECRET=<secret>\nPORT=9000\nBRANCH=master\n' > deploy/webhook.env
chmod 600 deploy/webhook.env
chmod +x deploy/deploy.sh deploy/webhook.py

# 3. systemd
sudo cp deploy/prompt-webhook.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now prompt-webhook.service

# 4. Cloudflare Tunnel: thêm Public Hostname trên Zero Trust dashboard
#    hook.<domain> -> http://host.docker.internal:9000

# 5. GitHub webhook: Settings > Webhooks > Add webhook
#    URL = https://hook.<domain>, Content-Type = application/json,
#    Secret = <secret>, chỉ event "push".
```

## Xem log
```bash
tail -f deploy/deploy.log              # log của mỗi lần deploy
sudo journalctl -u prompt-webhook -f   # log listener
```
