# Rencana Project: Planner Lamaran & Wedding

Status: **sudah dibangun (lihat README.md untuk cara menjalankan & deploy)**. Terakhir diperbarui 9 Nov 2026.

## 1. Gambaran umum

| Aspek | Keputusan |
|---|---|
| Format | Web app self-hosted di VPS Ubuntu milik sendiri, diakses lewat browser di HP & laptop |
| Pengguna | Kamu + pasangan, login masing-masing, edit data yang sama |
| Acara | **Lamaran** dan **Wedding** (akad nikah + resepsi) |
| Konsep | Nasional/modern, prosesi Islam (KUA) |
| Tanggal, budget, jumlah tamu | Belum ditentukan, diisi nanti lewat halaman Pengaturan |
| Isi awal | Template contoh (bisa diedit/dihapus), ditandai sebagai "contoh" |
| Bahasa | Indonesia, format Rupiah (Rp 1.250.000) dan tanggal lokal |

## 2. Struktur halaman

### 2.1 Beranda
- Countdown ke Lamaran dan Wedding (muncul setelah tanggal diisi)
- Progress: % to-do selesai, % dokumen KUA lengkap, % barang/seserahan terbeli
- Budget: total rencana vs realisasi vs sudah dibayar, per acara
- Tamu: jumlah undangan, terkirim, RSVP hadir, total pax
- "Perlu perhatian": to-do lewat deadline, pembayaran vendor jatuh tempo ≤14 hari, kandidat vendor yang belum diputuskan

### 2.2 Budget
- Filter acara: Lamaran / Wedding / Semua
- Kolom: kategori, item, acara, estimasi, realisasi, selisih, DP, sisa bayar, jatuh tempo, status (Belum bayar / DP / Lunas), sumber dana, vendor terkait
- Ringkasan per kategori dan per sumber dana (pribadi, ortu pria, ortu wanita, lainnya)
- Item yang berasal dari kandidat pemenang di Komparasi otomatis masuk ke sini

### 2.3 Kebutuhan Acara (tab)
1. **To-do** — tugas, acara, deadline, PIC (Saya / Pasangan / Keluarga / WO), status
2. **Vendor** — kategori, nama, kontak, paket, harga, status booking, link ke budget
3. **Barang yang dibeli** — item, acara, jumlah, harga satuan, total, toko/link, status beli
4. **Seserahan & Mahar** — item, acara, untuk siapa, estimasi harga, status beli
5. **Dokumen KUA** — daftar berkas, untuk siapa (pria/wanita), status, catatan

### 2.4 Komparasi (baru)
Tiga tab dengan pola yang sama: **Kebutuhan → Kandidat → Pilih pemenang**.

1. **Vendor** — contoh kebutuhan: Venue, Katering, MUA, Dekorasi, Foto & Video, WO.
   - Per kandidat: nama, harga, isi paket, kapasitas, rating, kontak, pro, kontra, catatan, link
   - Tabel side-by-side, harga termurah & rating tertinggi ditandai
   - Tombol **Pilih** → kandidat masuk ke daftar Vendor + baris Budget; kandidat lain tetap tersimpan sebagai arsip
2. **Barang** — contoh: Cincin, Baju akad, Souvenir, Undangan cetak.
   - Per kandidat: nama/model, toko, harga, kualitas, estimasi sampai, pro/kontra, link
   - Tombol **Pilih** → masuk ke Barang yang dibeli (atau Seserahan) + Budget
3. **Acara**
   - **Opsi konsep acara**: bandingkan 2–4 opsi (misal "Resepsi gedung 500 tamu" vs "Garden party 200 tamu") dari estimasi biaya, jumlah tamu, lokasi, durasi, pro/kontra. Tandai opsi terpilih.
   - **Lamaran vs Wedding**: ringkasan berdampingan otomatis (budget, realisasi, tamu, pax, progress to-do, vendor terbooking)

### 2.5 Rundown
- Pilih acara: Lamaran / Akad / Resepsi
- Dua tampilan dari data yang sama:
  - **Tabel**: jam mulai, jam selesai, kegiatan, PIC, lokasi, catatan
  - **Timeline visual**: garis waktu vertikal, durasi tergambar proporsional
- Urut otomatis berdasarkan jam

### 2.6 Daftar Tamu
- Kolom: nama, no. HP, pihak (Pria/Wanita), kategori (Keluarga/Teman/Kantor/Tetangga/VIP), diundang ke (Lamaran / Wedding / Keduanya), jenis undangan (Fisik/Digital), terkirim, RSVP (Belum/Hadir/Tidak), pax, catatan
- Pencarian, filter, total per pihak & kategori

### 2.7 Moodboard & Catatan
- **Moodboard foto**: upload foto inspirasi dari HP/laptop (bisa banyak sekaligus, drag & drop di laptop)
  - Tampil sebagai grid ala Pinterest (tinggi foto mengikuti rasio asli)
  - Per foto: judul, kategori (Dekorasi, Busana Akad, Busana Resepsi, MUA & Hijab, Venue, Undangan, Souvenir, Seserahan, Lainnya), acara (Lamaran/Wedding), catatan, link sumber
  - Filter per kategori & acara, klik foto untuk lihat besar
  - Tandai **Favorit** ❤ untuk foto yang paling disukai
  - Foto bisa ditautkan ke kandidat di Komparasi (misal contoh dekor dari vendor A)
- **Palet warna**: simpan kode warna tema, tampil sebagai swatch di atas moodboard
- **Kartu catatan**: judul, isi, kategori (Tema/Warna/Inspirasi/Lainnya), link

### 2.8 Pengaturan
- Nama pasangan, tanggal & lokasi Lamaran/Akad/Resepsi, target budget per acara, target jumlah tamu

### 2.9 Export
- Tombol **Export CSV** di Tamu, Budget, Vendor, Barang, Rundown, Komparasi (bisa dibuka di Excel)

## 3. Template contoh awal

| Bagian | Isi contoh |
|---|---|
| Kategori budget | Venue, Katering, Dekorasi, MUA & Busana, Foto/Video, Undangan, Souvenir, Mahar & Seserahan, Cincin, Hiburan, Administrasi KUA, Lain-lain |
| To-do | ±25 tugas umum (cari venue, survey katering, fitting baju, daftar KUA, cetak undangan, dll.) dengan acuan waktu (H-12 bulan s/d H-1) |
| Dokumen KUA | N1–N4 (formulir dari kelurahan), surat pengantar RT/RW, fotokopi KTP & KK, akta kelahiran, ijazah terakhir, pas foto 2x3/3x4/4x6 latar biru, surat imunisasi TT (catin wanita), surat izin ortu (jika <21 th), daftar di SIMKAH |
| Seserahan | Alat sholat, Al-Qur'an, perhiasan, pakaian, sepatu/tas, skincare/makeup, makanan/kue |
| Rundown | Lamaran (±2 jam), Akad (±1,5 jam), Resepsi (±3 jam) versi standar |
| Komparasi | 1 contoh kebutuhan vendor (Katering) dengan 2 kandidat fiktif, 1 contoh barang, 2 opsi konsep acara — ditandai "contoh" |
| Tamu | 3 baris contoh, ditandai "contoh" |

## 4. Stack & deployment (VPS Ubuntu)

Prinsip: **ringan, satu proses, tanpa layanan eksternal**. Cukup untuk 2 pengguna di VPS kecil (1 vCPU / 1 GB RAM).

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Runtime | Node.js 22 LTS | Satu bahasa (TypeScript) untuk backend & frontend |
| Backend | Hono (atau Express) + TypeScript | Ringan, API REST JSON sederhana |
| Database | SQLite (`better-sqlite3`) + Drizzle ORM | Satu file, tanpa server DB, backup tinggal salin file |
| Frontend | React + Vite + Tailwind CSS, di-build jadi file statis dan disajikan oleh backend | Tampilan responsif HP, tema terang/gelap |
| Data fetching | TanStack Query | Refetch otomatis saat tab dibuka, sehingga data pasangan ikut ter-update |
| Upload foto | Disimpan di disk (`/var/lib/wedding/uploads`), diperkecil dengan `sharp` (maks. 1600 px + thumbnail) | Cepat dibuka di HP, hemat disk |
| Login | 2 akun (kamu & pasangan), password di-hash (argon2), sesi pakai cookie httpOnly | Data pribadi tidak terbuka ke publik |
| HTTPS & reverse proxy | Caddy (sertifikat Let's Encrypt otomatis) | Konfigurasi 3 baris, perlu domain/subdomain |
| Menjalankan | Docker Compose (app + Caddy), atau systemd tanpa Docker | Pilih sesuai kondisi VPS |
| Backup | Cron harian: `sqlite3 .backup` + salin folder uploads, simpan 14 hari terakhir | Data tidak hilang kalau VPS bermasalah |
| Export | CSV dibuat di backend (`/api/export/:tabel.csv`), UTF-8 dengan BOM agar rapi di Excel | Tanpa library tambahan di browser |

**Struktur folder (rencana):**
```
wedding/
  server/        # API, auth, upload, export, seed template
  web/           # React + Vite
  deploy/        # docker-compose.yml, Caddyfile, backup.sh
  PLAN.md
```

**Tabel database:** `users`, `settings`, `budget_items`, `tasks`, `vendors`, `items`, `seserahan`, `documents`, `rundown`, `guests`, `notes`, `palette`, `moodboard`, `compare_needs`, `compare_candidates`, `concepts`.

**Catatan penting:**
- Tidak ada sinkron real-time; data diambil ulang saat halaman dibuka/difokuskan dan setelah setiap simpan. Untuk 2 orang ini cukup.
- Template contoh diisi lewat skrip seed saat pertama kali dijalankan, bukan ditanam di kode tampilan.
- Port aplikasi tidak dibuka ke publik, hanya Caddy (80/443) yang terbuka; firewall `ufw` hanya mengizinkan SSH, 80, 443.
- Pengembangan dan uji dilakukan di laptop, lalu di-deploy ke VPS lewat `git pull` + `docker compose up -d --build` (atau `rsync`).


## 5. Tahapan pembangunan

1. Kerangka: navigasi, Pengaturan, Beranda (countdown & ringkasan)
2. Budget + Kebutuhan Acara (5 tab)
3. Komparasi vendor, barang, acara + alur "Pilih pemenang"
4. Rundown (tabel + timeline)
5. Daftar Tamu + Moodboard foto & Catatan
6. Export CSV, seed template contoh, uji di HP
7. Deploy ke VPS: Docker Compose + Caddy + HTTPS, login 2 akun, cron backup

## 6. Pertanyaan terbuka

- ~~Upload foto inspirasi~~ → ditambahkan sebagai Moodboard (2.7)
- Perlu fitur lain? (misal denah meja tamu)
- Domain/subdomain untuk HTTPS sudah ada? Docker sudah terpasang di VPS? Spesifikasi VPS (RAM/disk)?
- Nama untuk dashboard (misal "Dimas & ___ Wedding Planner")?
