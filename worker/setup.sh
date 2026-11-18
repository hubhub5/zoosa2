#!/bin/bash
# 결제 확인 서버 처음 설치 (새 Cloudflare 계정으로 옮길 때). 먼저 npx -y wrangler@4.86.0 login
set -euo pipefail
cd "$(dirname "$0")"
W="npx -y wrangler@4.86.0"
if grep -q REPLACE_D1 wrangler.toml; then
  ID=$($W d1 create zoosa2-paid 2>&1 | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
  [ -n "$ID" ] || { echo "D1 만들기 실패"; exit 1; }
  sed -i '' "s/REPLACE_D1/$ID/" wrangler.toml
fi
$W d1 execute zoosa2-paid --remote --file=schema.sql -y >/dev/null
$W deploy
node -e "require('fs').writeFileSync('.shapes_key', require('crypto').randomBytes(12).toString('hex'))"
$W secret put SHAPES_KEY < .shapes_key
node -e "require('fs').writeFileSync('.pepper', require('crypto').randomBytes(24).toString('hex'))"
$W secret put HASH_PEPPER < .pepper && rm -f .pepper
echo "끝. 그로블 웹훅 키는: (키 복사한 상태로) pbpaste | $W secret put GROBLE_SECRET"
