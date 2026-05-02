#!/usr/bin/env sh
set -eu

detect_lan_ip() {
  if command -v ip >/dev/null 2>&1; then
    ip route get 1.1.1.1 2>/dev/null | awk '
      {
        for (i = 1; i <= NF; i++) {
          if ($i == "src") {
            print $(i + 1)
            exit
          }
        }
      }
    '
  fi
}

LAN_IP="${LAN_IP:-${1:-}}"

if [ -z "$LAN_IP" ]; then
  LAN_IP="$(detect_lan_ip)"
fi

if [ -z "$LAN_IP" ]; then
  cat >&2 <<'EOF'
Could not detect a LAN IP.

Run with one explicitly, for example:
  LAN_IP=192.168.1.42 pnpm dev:lan
  pnpm dev:lan -- 192.168.1.42
EOF
  exit 1
fi

export HOST=0.0.0.0
export VITE_API_BASE_URL="http://${LAN_IP}:3000"
export VITE_SOCKET_URL="$VITE_API_BASE_URL"

LAN_IP_LOWER="$(printf '%s' "$LAN_IP" | tr '[:upper:]' '[:lower:]')"
DEFAULT_CORS_ORIGIN="http://localhost:5173,http://${LAN_IP}:5173"
if [ "$LAN_IP_LOWER" != "$LAN_IP" ]; then
  DEFAULT_CORS_ORIGIN="${DEFAULT_CORS_ORIGIN},http://${LAN_IP_LOWER}:5173"
fi
export CORS_ORIGIN="${CORS_ORIGIN:-$DEFAULT_CORS_ORIGIN}"

echo "Starting Waifu Panel for LAN access"
echo "  Web:     http://${LAN_IP}:5173"
echo "  Backend: http://${LAN_IP}:3000"
echo "  Control: http://${LAN_IP}:5173/control"
echo

pnpm db:deploy
pnpm -r --parallel --filter @waifu-panel/server --filter @waifu-panel/web dev
