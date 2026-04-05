#!/bin/bash
export PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin

cd /Users/maracoldsoup/Desktop/vacoder-team

# 슬립 방지하면서 서버 실행
exec /usr/bin/caffeinate -si /opt/homebrew/bin/npm run dev
