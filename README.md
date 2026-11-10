# Event Planner (Lamaran & Wedding)

Web app self-hosted: Node.js + Hono + SQLite (server) dan React + Vite + Tailwind (web).
Fitur dan rencana lengkap ada di [PLAN.md](PLAN.md).

## Jalankan di laptop (development)

```bash
# terminal 1: server (http://127.0.0.1:3000)
cd server && npm install
npm run cli -- create-user dimas "password-kamu"
npm run cli -- create-user pasangan "password-pasangan"
npm run dev

# terminal 2: frontend (http://localhost:5173)
cd web && npm install && npm run dev
```

Data tersimpan di folder `data/` (database SQLite + foto moodboard).

## Deploy ke VPS Ubuntu

1. Arahkan domain/subdomain (A record) ke IP VPS.
2. Siapkan VPS (Docker, firewall 22/80/443, sqlite3):
   ```bash
   sudo bash deploy/setup-vps.sh
   ```
3. Salin project ke VPS (misal `/opt/wedding`) lewat `git clone` atau `rsync`, lalu buat `.env`:
   ```bash
   cp .env.example .env   # ubah DOMAIN
   ```
4. Build dan jalankan:
   ```bash
   docker compose up -d --build
   ```
5. Buat akun (2 orang), password minimal 8 karakter:
   ```bash
   docker compose exec app node dist/cli.js create-user dimas "password-kamu"
   docker compose exec app node dist/cli.js create-user pasangan "password-pasangan"
   ```
6. Buka `https://DOMAIN`. Sertifikat HTTPS diurus Caddy otomatis.

Ganti password: ulangi perintah `create-user` dengan nama yang sama dan password baru.

## Backup

```bash
chmod +x deploy/backup.sh
crontab -e   # tambahkan baris:
30 2 * * * /opt/wedding/deploy/backup.sh >> /var/log/wedding-backup.log 2>&1
```

Arsip `.tar.gz` (database + foto) disimpan di `deploy/backups/`, 14 hari terakhir.
Sebaiknya salin berkala ke tempat lain (laptop atau cloud storage).

Restore: hentikan app (`docker compose stop app`), ekstrak arsip ke folder `data/`
(`wedding.db` dan `uploads/`), lalu `docker compose start app`.

## Update aplikasi

```bash
git pull && docker compose up -d --build
```

## Tes otomatis (API)

Skrip `server/test/api-smoke.mjs` menguji login, CRUD semua tabel, komparasi, upload foto, export CSV, dan hak akses.
Jalankan terhadap server uji dengan data sementara, **bukan** data asli (tes ini mengosongkan data contoh):

```bash
cd server
rm -rf /tmp/wtest && mkdir /tmp/wtest
DATA_DIR=/tmp/wtest npx tsx src/cli.ts create-user penguji ujicoba-12345
DATA_DIR=/tmp/wtest PORT=3001 WEB_DIR=../web/dist npx tsx src/index.ts &
node test/api-smoke.mjs
```

## Deploy lewat Dokploy (VPS yang sudah memakai Dokploy)

Jangan pakai `docker-compose.yml` + Caddy di server yang port 80/443-nya sudah dipakai Dokploy/Traefik,
dan jangan jalankan `deploy/setup-vps.sh` (mengaktifkan firewall).

1. Taruh project di repository Git (private) lalu push.
2. Di Dokploy: **Create Project → Create Service → Compose**.
   - Provider: Git/GitHub, pilih repository dan branch.
   - Compose Path: `./docker-compose.dokploy.yml`
   - Compose Type: Docker Compose
3. Tab **Domains** → Add Domain: Host = domain kamu, Service Name = `app`, Container Port = `3000`, HTTPS aktif (Let's Encrypt).
4. Klik **Deploy**.
5. Buat akun lewat Terminal Dokploy (atau SSH):
   ```bash
   docker exec -it $(docker ps -qf name=wedding.*app) node dist/cli.js create-user dimas 'password-kamu'
   ```
