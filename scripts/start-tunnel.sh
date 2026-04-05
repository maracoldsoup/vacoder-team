#!/bin/bash
export PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin

BOT_TOKEN="8704449665:AAEFiMbTHH5jQUAjaITWpyxxuBcKTT9hLVY"
LOG=/tmp/vacoder-cloudflared.log

# 서버 준비될 때까지 대기 (최대 30초)
for i in $(seq 1 30); do
  if curl -sf http://localhost:3000/api/telegram > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# cloudflared 시작
/opt/homebrew/bin/cloudflared tunnel --url http://localhost:3000 > "$LOG" 2>&1 &
CF_PID=$!

# URL 나타날 때까지 대기 (최대 30초)
for i in $(seq 1 30); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" 2>/dev/null | head -1)
  if [ -n "$URL" ]; then
    # 텔레그램 웹훅 자동 등록
    curl -sf "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${URL}/api/telegram" > /dev/null
    echo "[vacoder-tunnel] Webhook registered: ${URL}/api/telegram"
    break
  fi
  sleep 1
done

# cloudflared 프로세스가 살아있는 동안 유지
wait $CF_PID
