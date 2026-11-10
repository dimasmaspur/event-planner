import { db, getSetting, setSetting, insert } from './db.js';
import { TableName } from './schema.js';

const ex = (table: TableName, rows: Record<string, unknown>[]) => {
  for (const r of rows) insert(table, { ...r, is_example: 1 });
};

export function seedIfNeeded() {
  if (getSetting('seeded')) return;
  db.transaction(() => {
    const W = 'wedding', L = 'lamaran';
    ex('budget_items', [
      { category: 'Venue', item: 'Sewa gedung / venue resepsi', event: W, estimate: 40000000 },
      { category: 'Venue', item: 'Tempat acara lamaran', event: L, estimate: 3000000 },
      { category: 'Katering', item: 'Katering resepsi', event: W, estimate: 60000000 },
      { category: 'Katering', item: 'Katering lamaran', event: L, estimate: 7500000 },
      { category: 'Dekorasi', item: 'Dekorasi pelaminan & ruangan', event: W, estimate: 20000000 },
      { category: 'Dekorasi', item: 'Dekorasi lamaran', event: L, estimate: 3000000 },
      { category: 'MUA & Busana', item: 'MUA akad & resepsi', event: W, estimate: 8000000 },
      { category: 'MUA & Busana', item: 'Busana akad', event: W, estimate: 6000000 },
      { category: 'MUA & Busana', item: 'Busana resepsi', event: W, estimate: 8000000 },
      { category: 'MUA & Busana', item: 'MUA & busana lamaran', event: L, estimate: 2500000 },
      { category: 'Foto & Video', item: 'Foto & video pernikahan', event: W, estimate: 12000000 },
      { category: 'Foto & Video', item: 'Dokumentasi lamaran', event: L, estimate: 2000000 },
      { category: 'Undangan', item: 'Cetak undangan', event: W, estimate: 3000000 },
      { category: 'Undangan', item: 'Undangan digital', event: W, estimate: 500000 },
      { category: 'Souvenir', item: 'Souvenir tamu', event: W, estimate: 6000000 },
      { category: 'Mahar & Seserahan', item: 'Mahar', event: W, estimate: 5000000 },
      { category: 'Mahar & Seserahan', item: 'Seserahan', event: W, estimate: 8000000 },
      { category: 'Mahar & Seserahan', item: 'Hantaran lamaran', event: L, estimate: 4000000 },
      { category: 'Cincin', item: 'Cincin pernikahan', event: W, estimate: 7000000 },
      { category: 'Hiburan', item: 'MC & musik', event: W, estimate: 5000000 },
      { category: 'Administrasi', item: 'Biaya KUA & administrasi', event: W, estimate: 600000 },
      { category: 'Lain-lain', item: 'Dana tak terduga', event: W, estimate: 5000000 },
    ]);

    const t = (title: string, event: string, when: string, owner = 'Berdua') => ({ title, event, owner, status: 'todo', note: when });
    ex('tasks', [
      t('Diskusi budget & sumber dana dengan keluarga', W, 'H-12 bulan'),
      t('Tentukan tanggal lamaran & pernikahan', W, 'H-12 bulan', 'Keluarga'),
      t('Susun daftar tamu awal (perkiraan jumlah)', W, 'H-12 bulan'),
      t('Survey & booking venue resepsi', W, 'H-10 bulan'),
      t('Survey & pilih katering', W, 'H-9 bulan'),
      t('Pilih WO / koordinator acara (opsional)', W, 'H-9 bulan'),
      t('Pilih fotografer & videografer', W, 'H-8 bulan'),
      t('Pilih MUA & busana pengantin', W, 'H-8 bulan'),
      t('Tentukan tema & palet warna', W, 'H-8 bulan'),
      t('Booking dekorasi / pelaminan', W, 'H-7 bulan'),
      t('Beli cincin & tentukan mahar', W, 'H-6 bulan'),
      t('Susun daftar seserahan & mulai belanja', W, 'H-6 bulan'),
      t('Fitting busana (tahap 1)', W, 'H-5 bulan'),
      t('Desain & cetak undangan', W, 'H-4 bulan'),
      t('Urus surat pengantar RT/RW & N1–N4 di kelurahan', W, 'H-3 bulan'),
      t('Daftar nikah di KUA (SIMKAH)', W, 'H-2 bulan'),
      t('Bimbingan pranikah / kursus calon pengantin', W, 'H-2 bulan'),
      t('Sebar undangan', W, 'H-6 minggu'),
      t('Fitting busana final', W, 'H-1 bulan'),
      t('Finalisasi rundown dengan MC & vendor', W, 'H-3 minggu'),
      t('Konfirmasi RSVP & jumlah tamu final ke katering', W, 'H-2 minggu'),
      t('Lunasi vendor', W, 'H-1 minggu'),
      t('Briefing keluarga & penerima tamu', W, 'H-3 hari'),
      t('Siapkan amplop vendor & dana tak terduga', W, 'H-3 hari'),
      t('Tentukan tanggal & tempat lamaran', L, 'H-3 bulan', 'Keluarga'),
      t('Siapkan hantaran lamaran', L, 'H-1 bulan'),
      t('Undang keluarga inti untuk lamaran', L, 'H-3 minggu', 'Keluarga'),
      t('Pesan konsumsi lamaran', L, 'H-2 minggu'),
      t('Susun rundown & tunjuk juru bicara lamaran', L, 'H-1 minggu', 'Keluarga'),
    ]);

    ex('items', [
      { name: 'Undangan cetak', event: W, qty: 300, unit_price: 10000, status: 'belum' },
      { name: 'Souvenir', event: W, qty: 300, unit_price: 20000, status: 'belum' },
      { name: 'Buket bunga pengantin', event: W, qty: 1, unit_price: 350000, status: 'belum' },
    ]);

    const s = (name: string, event: string, estimate: number, for_whom = 'Pengantin wanita') => ({ name, event, for_whom, estimate, status: 'belum' });
    ex('seserahan', [
      s('Alat sholat (mukena & sajadah)', W, 600000),
      s("Al-Qur'an", W, 300000),
      s('Perhiasan', W, 2500000),
      s('Pakaian', W, 1000000),
      s('Sepatu & tas', W, 1200000),
      s('Skincare & make up', W, 1000000),
      s('Kue & buah', W, 800000),
      s('Hantaran buah', L, 500000),
      s('Hantaran kue', L, 600000),
    ]);

    const d = (name: string, for_whom: string, note = '') => ({ name, for_whom, status: 'belum', note });
    ex('documents', [
      d('Surat pengantar RT/RW', 'Pria', 'Dari RT/RW tempat tinggal'),
      d('Surat pengantar RT/RW', 'Wanita'),
      d('Formulir N1–N4 (dari kelurahan)', 'Pria'),
      d('Formulir N1–N4 (dari kelurahan)', 'Wanita'),
      d('Fotokopi KTP', 'Pria'),
      d('Fotokopi KTP', 'Wanita'),
      d('Fotokopi Kartu Keluarga', 'Pria'),
      d('Fotokopi Kartu Keluarga', 'Wanita'),
      d('Fotokopi akta kelahiran', 'Pria'),
      d('Fotokopi akta kelahiran', 'Wanita'),
      d('Fotokopi ijazah terakhir', 'Pria'),
      d('Fotokopi ijazah terakhir', 'Wanita'),
      d('Pas foto (2x3, 3x4, 4x6) latar biru', 'Pria', 'Cek jumlah yang diminta KUA'),
      d('Pas foto (2x3, 3x4, 4x6) latar biru', 'Wanita'),
      d('Surat izin orang tua (jika usia <21 tahun)', 'Wanita'),
      d('Imunisasi TT / surat keterangan kesehatan', 'Wanita', 'Biasanya di puskesmas'),
      d('Pendaftaran nikah online (SIMKAH)', 'Berdua', 'Daftar minimal 10 hari kerja sebelum akad'),
      d('Sertifikat / bimbingan pranikah', 'Berdua'),
    ]);

    const r = (event: string, start_time: string, end_time: string, activity: string, pic = '') => ({ event, start_time, end_time, activity, pic });
    ex('rundown', [
      r('lamaran', '10:00', '10:15', 'Tamu & keluarga tiba, registrasi', 'Penerima tamu'),
      r('lamaran', '10:15', '10:20', 'Pembukaan oleh MC', 'MC'),
      r('lamaran', '10:20', '10:30', "Pembacaan ayat suci Al-Qur'an", 'Qari'),
      r('lamaran', '10:30', '10:40', 'Sambutan keluarga pihak pria', 'Juru bicara pria'),
      r('lamaran', '10:40', '10:50', 'Sambutan keluarga pihak wanita', 'Juru bicara wanita'),
      r('lamaran', '10:50', '11:05', 'Penyampaian maksud lamaran & jawaban', 'Juru bicara'),
      r('lamaran', '11:05', '11:15', 'Doa', 'Pemuka agama'),
      r('lamaran', '11:15', '11:30', 'Penyerahan hantaran & tukar cincin', 'Keluarga'),
      r('lamaran', '11:30', '11:45', 'Foto bersama', 'Fotografer'),
      r('lamaran', '11:45', '13:00', 'Makan bersama & ramah tamah', 'Semua'),
      r('akad', '07:00', '08:30', 'Persiapan & rias pengantin', 'MUA'),
      r('akad', '08:30', '09:00', 'Keluarga & saksi tiba', 'Penerima tamu'),
      r('akad', '09:00', '09:10', 'Pembukaan', 'MC'),
      r('akad', '09:10', '09:20', "Pembacaan ayat suci Al-Qur'an", 'Qari'),
      r('akad', '09:20', '09:35', 'Khutbah nikah', 'Penghulu'),
      r('akad', '09:35', '09:45', 'Ijab kabul', 'Penghulu'),
      r('akad', '09:45', '10:00', 'Tanda tangan buku nikah & penyerahan mahar', 'Penghulu'),
      r('akad', '10:00', '10:10', 'Tukar cincin & sungkem orang tua', 'Pengantin'),
      r('akad', '10:10', '10:20', 'Doa penutup', 'Pemuka agama'),
      r('akad', '10:20', '10:40', 'Foto keluarga', 'Fotografer'),
      r('resepsi', '10:30', '11:00', 'Tamu mulai datang', 'Penerima tamu'),
      r('resepsi', '11:00', '11:15', 'Prosesi masuk pengantin', 'MC'),
      r('resepsi', '11:15', '11:30', 'Sambutan keluarga', 'Keluarga'),
      r('resepsi', '11:30', '11:40', 'Doa', 'Pemuka agama'),
      r('resepsi', '11:40', '12:00', 'Foto bersama keluarga & tamu', 'Fotografer'),
      r('resepsi', '12:00', '13:30', 'Makan siang & salam tamu', 'Semua'),
      r('resepsi', '13:30', '14:30', 'Hiburan musik', 'Penyanyi / band'),
      r('resepsi', '14:30', '15:00', 'Penutupan acara', 'MC'),
    ]);

    ex('guests', [
      { name: 'Contoh: Keluarga Bapak Ahmad', phone: '0812xxxxxxx', side: 'Pria', category: 'Keluarga', invited_to: 'keduanya', invitation_type: 'Fisik', sent: 0, rsvp: 'belum', pax: 4 },
      { name: 'Contoh: Rina (sahabat)', phone: '0813xxxxxxx', side: 'Wanita', category: 'Teman', invited_to: 'wedding', invitation_type: 'Digital', sent: 1, rsvp: 'hadir', pax: 2 },
      { name: 'Contoh: Pak Budi (kantor)', phone: '', side: 'Pria', category: 'Kantor', invited_to: 'wedding', invitation_type: 'Digital', sent: 0, rsvp: 'belum', pax: 1 },
    ]);

    ex('notes', [
      { title: 'Tema acara', body: 'Tulis ide tema, suasana, dan hal yang ingin dihindari.', category: 'Tema' },
    ]);
    ex('palette', [
      { name: 'Contoh: Hijau sage', hex: '#9caf88' },
      { name: 'Contoh: Putih gading', hex: '#f5f1e8' },
      { name: 'Contoh: Emas lembut', hex: '#c9a96e' },
    ]);

    const kat = insert('compare_needs', { kind: 'vendor', title: 'Katering resepsi', category: 'Katering', event: W, is_example: 1 });
    ex('compare_candidates', [
      { need_id: kat, name: 'Contoh: Katering A', price: 65000000, details: '300 porsi, prasmanan, 8 menu, 4 stall', rating: 4.6, pros: 'Rasa konsisten, banyak review bagus', cons: 'Harga paling tinggi', chosen: 0 },
      { need_id: kat, name: 'Contoh: Katering B', price: 52000000, details: '300 porsi, prasmanan, 6 menu, 2 stall', rating: 4.2, pros: 'Lebih hemat, bisa tester', cons: 'Pilihan menu lebih sedikit', chosen: 0 },
    ]);
    const cin = insert('compare_needs', { kind: 'item', title: 'Cincin pernikahan', category: 'Cincin', event: W, is_example: 1 });
    ex('compare_candidates', [
      { need_id: cin, name: 'Contoh: Cincin emas 18K', price: 8500000, details: 'Toko perhiasan X, bisa custom ukir', rating: 4.8, pros: 'Nilai jual kembali tinggi', cons: 'Pengerjaan 2 minggu', chosen: 0 },
      { need_id: cin, name: 'Contoh: Cincin perak + batu', price: 3200000, details: 'Toko Y, siap ambil', rating: 4.0, pros: 'Hemat', cons: 'Lebih mudah kusam', chosen: 0 },
    ]);

    ex('concepts', [
      { name: 'Contoh: Resepsi gedung 500 tamu', cost: 150000000, guests: 500, location: 'Gedung serbaguna', duration: '4 jam', pros: 'Nyaman, parkir luas, AC', cons: 'Biaya sewa tinggi' },
      { name: 'Contoh: Garden party 200 tamu', cost: 90000000, guests: 200, location: 'Taman / halaman rumah', duration: '3 jam', pros: 'Lebih intim & hemat', cons: 'Bergantung cuaca' },
    ]);

    setSetting('seeded', '1');
  })();
}

export function clearExamples() {
  db.transaction(() => {
    for (const t of ['budget_items','tasks','vendors','items','seserahan','documents','rundown','guests','notes','palette','moodboard','compare_needs','concepts','compare_candidates']) {
      db.prepare(`DELETE FROM ${t} WHERE is_example=1`).run();
    }
    db.prepare('DELETE FROM compare_candidates WHERE need_id NOT IN (SELECT id FROM compare_needs)').run();
  })();
}
