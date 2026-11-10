#!/usr/bin/env bash
# Persiapan awal VPS Ubuntu: Docker, firewall, sqlite3 (untuk backup).
# Jalankan sebagai root / sudo:  sudo bash deploy/setup-vps.sh
set -euo pipefail

# Pengaman: jangan jalankan di server yang sudah memakai Docker/port web (mis. Dokploy).
# ufw --force enable di bawah bisa memutus layanan lain.
if command -v docker >/dev/null && [ -n "$(docker ps -q 2>/dev/null)" ] && [ "${FORCE:-}" != "1" ]; then
  echo "BERHENTI: server ini sudah menjalankan container Docker (mungkin Dokploy)." >&2
  echo "Skrip ini mengaktifkan firewall dan bisa memutus layanan yang ada." >&2
  echo "Pakai deploy lewat Dokploy (lihat README), atau jalankan dengan FORCE=1 kalau yakin." >&2
  exit 1
fi
apt-get update
apt-get install -y ca-certificates curl ufw sqlite3 git
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "Selesai. Lanjut: salin project, buat .env (DOMAIN=...), lalu 'docker compose up -d --build'."
