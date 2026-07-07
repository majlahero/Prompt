#!/usr/bin/env python3
"""GitHub webhook listener -> kích hoạt auto-deploy khi push lên master.

Chỉ dùng thư viện chuẩn (không cần cài thêm). Xác thực HMAC-SHA256 bằng
WEBHOOK_SECRET. Trả 200 ngay rồi chạy deploy ở tiến trình nền để GitHub
không bị timeout.
"""
import hashlib
import hmac
import json
import os
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = os.environ["WEBHOOK_SECRET"].encode()
DEPLOY = os.environ.get("DEPLOY_SCRIPT", "/home/hoa/Prompt/deploy/deploy.sh")
BRANCH = os.environ.get("BRANCH", "master")
PORT = int(os.environ.get("PORT", "9000"))


class Handler(BaseHTTPRequestHandler):
    def _reply(self, code, msg):
        self.send_response(code)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(msg.encode())

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        sig = self.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(SECRET, body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return self._reply(403, "bad signature")

        event = self.headers.get("X-GitHub-Event", "")
        if event == "ping":
            return self._reply(200, "pong")
        if event != "push":
            return self._reply(200, "ignored event: " + event)

        try:
            payload = json.loads(body)
        except ValueError:
            return self._reply(400, "bad json")

        if payload.get("ref") != "refs/heads/" + BRANCH:
            return self._reply(200, "not target branch")

        # Trả lời ngay, deploy chạy nền.
        self._reply(200, "deploying")
        subprocess.Popen(
            ["/usr/bin/env", "bash", DEPLOY],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    def log_message(self, *args):
        pass  # tắt log mặc định cho gọn


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
