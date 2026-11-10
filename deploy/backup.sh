#!/usr/bin/env bash
# Backup harian: database (konsisten) + foto. Simpan 14 hari terakhir.
# Cron contoh (jam 02:30):  30 2 * * * /opt/wedding/deploy/backup.sh >> /var/log/wedding-backup.log 2>&1
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${BACKUP_DIR:-$APP_DIR/deploy/backups}"
STAMP="$(date +%F_%H%M)"
mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# .backup aman dipakai saat aplikasi berjalan
sqlite3 "$APP_DIR/data/wedding.db" ".backup '$TMP/wedding.db'"
cp -r "$APP_DIR/data/uploads" "$TMP/uploads"
tar -czf "$OUT/wedding-$STAMP.tar.gz" -C "$TMP" .
find "$OUT" -name 'wedding-*.tar.gz' -mtime +14 -delete
echo "[$(date -Is)] backup ok: wedding-$STAMP.tar.gz"
