#!/usr/bin/env bash
# Kirim project ke VPS lalu build & jalankan ulang. Jalankan dari laptop:
#   ./deploy/deploy.sh USER@IP-VPS            -> deploy/update (folder tujuan /opt/wedding)
#   ./deploy/deploy.sh USER@IP-VPS --setup    -> pertama kali: pasang Docker + firewall dulu
# Folder tujuan lain:  REMOTE_DIR=/home/user/wedding ./deploy/deploy.sh USER@IP-VPS
set -euo pipefail

TARGET="${1:-}"
FLAG="${2:-}"
REMOTE_DIR="${REMOTE_DIR:-/opt/wedding}"

if [[ -z "$TARGET" ]]; then
  echo "Pakai: $0 USER@IP-VPS [--setup]" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

echo "==> Menyiapkan folder $REMOTE_DIR di VPS"
ssh "$TARGET" "sudo mkdir -p '$REMOTE_DIR' && sudo chown \"\$(id -un)\":\"\$(id -gn)\" '$REMOTE_DIR'"

echo "==> Mengirim file (data, .env, dan backup di VPS tidak disentuh)"
rsync -az --delete --info=stats1 \
  --exclude node_modules --exclude dist --exclude .git --exclude .claude \
  --exclude data --exclude .env --exclude 'deploy/backups' --exclude '*.md' \
  --exclude 'server/test' \
  ./ "$TARGET:$REMOTE_DIR/"

# README/PLAN tidak dikirim di atas; kirim README saja agar ada panduan di server
rsync -az README.md "$TARGET:$REMOTE_DIR/README.md"

if [[ "$FLAG" == "--setup" ]]; then
  echo "==> Setup VPS (Docker, firewall, sqlite3)"
  ssh -t "$TARGET" "cd '$REMOTE_DIR' && sudo bash deploy/setup-vps.sh"
fi

echo "==> Memeriksa file .env di VPS"
if ! ssh "$TARGET" "test -f '$REMOTE_DIR/.env'"; then
  echo ""
  echo "File .env belum ada di VPS. Buat dulu (ganti domain), lalu jalankan skrip ini lagi:"
  echo "  ssh $TARGET \"echo 'DOMAIN=wedding.contoh.com' > $REMOTE_DIR/.env\""
  exit 2
fi

echo "==> Build & jalankan (pertama kali bisa 2-5 menit)"
ssh -t "$TARGET" "cd '$REMOTE_DIR' && sudo docker compose up -d --build && sudo docker compose ps"

echo ""
echo "Selesai. Cek: ssh $TARGET \"cd $REMOTE_DIR && sudo docker compose logs --tail 30\""
echo "Akun pertama kali dibuat dengan:"
echo "  ssh -t $TARGET \"cd $REMOTE_DIR && sudo docker compose exec app node dist/cli.js create-user NAMA 'PASSWORD-MIN-8'\""
