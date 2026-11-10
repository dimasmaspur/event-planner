type T = 'text' | 'int' | 'real';
const c = (type: T, label: string): [T, string] => [type, label];

export const TABLES = {
  budget_items: {
    category: c('text', 'Kategori'), item: c('text', 'Item'), event: c('text', 'Acara'),
    estimate: c('int', 'Estimasi'), actual: c('int', 'Realisasi'), paid: c('int', 'Sudah dibayar'),
    due_date: c('text', 'Jatuh tempo'), source: c('text', 'Sumber dana'),
    origin: c('text', 'Asal'), note: c('text', 'Catatan'),
  },
  tasks: {
    title: c('text', 'Tugas'), event: c('text', 'Acara'), due_date: c('text', 'Deadline'),
    owner: c('text', 'PIC'), status: c('text', 'Status'), note: c('text', 'Catatan'),
  },
  vendors: {
    category: c('text', 'Kategori'), name: c('text', 'Nama'), contact: c('text', 'Kontak'),
    package: c('text', 'Paket'), price: c('int', 'Harga'), event: c('text', 'Acara'),
    status: c('text', 'Status'), origin: c('text', 'Asal'), note: c('text', 'Catatan'),
  },
  items: {
    name: c('text', 'Barang'), event: c('text', 'Acara'), qty: c('int', 'Jumlah'),
    unit_price: c('int', 'Harga satuan'), store: c('text', 'Toko'), link: c('text', 'Link'),
    status: c('text', 'Status'), origin: c('text', 'Asal'), note: c('text', 'Catatan'),
  },
  seserahan: {
    name: c('text', 'Item'), event: c('text', 'Acara'), for_whom: c('text', 'Untuk'),
    estimate: c('int', 'Estimasi'), status: c('text', 'Status'), note: c('text', 'Catatan'),
  },
  documents: {
    name: c('text', 'Berkas'), for_whom: c('text', 'Untuk'), status: c('text', 'Status'), note: c('text', 'Catatan'),
  },
  rundown: {
    event: c('text', 'Acara'), start_time: c('text', 'Mulai'), end_time: c('text', 'Selesai'),
    activity: c('text', 'Kegiatan'), pic: c('text', 'PIC'), location: c('text', 'Lokasi'), note: c('text', 'Catatan'),
  },
  guests: {
    name: c('text', 'Nama'), phone: c('text', 'No. HP'), side: c('text', 'Pihak'),
    category: c('text', 'Kategori'), invited_to: c('text', 'Diundang ke'),
    invitation_type: c('text', 'Jenis undangan'), sent: c('int', 'Terkirim'),
    rsvp: c('text', 'RSVP'), pax: c('int', 'Pax'), note: c('text', 'Catatan'),
  },
  notes: {
    title: c('text', 'Judul'), body: c('text', 'Isi'), category: c('text', 'Kategori'), link: c('text', 'Link'),
  },
  palette: { name: c('text', 'Nama'), hex: c('text', 'Kode warna') },
  moodboard: {
    title: c('text', 'Judul'), category: c('text', 'Kategori'), event: c('text', 'Acara'),
    note: c('text', 'Catatan'), link: c('text', 'Link'), favorite: c('int', 'Favorit'),
    file: c('text', 'File'), thumb: c('text', 'Thumbnail'), candidate_id: c('int', 'Kandidat'),
  },
  compare_needs: {
    kind: c('text', 'Jenis'), title: c('text', 'Kebutuhan'), category: c('text', 'Kategori'),
    event: c('text', 'Acara'), note: c('text', 'Catatan'),
  },
  compare_candidates: {
    need_id: c('int', 'Kebutuhan'), name: c('text', 'Nama'), price: c('int', 'Harga'),
    details: c('text', 'Paket / detail'), rating: c('real', 'Rating'), contact: c('text', 'Kontak'),
    pros: c('text', 'Kelebihan'), cons: c('text', 'Kekurangan'), link: c('text', 'Link'),
    note: c('text', 'Catatan'), chosen: c('int', 'Dipilih'),
    made_vendor_id: c('int', 'v'), made_item_id: c('int', 'i'), made_budget_id: c('int', 'b'),
  },
  concepts: {
    name: c('text', 'Konsep'), cost: c('int', 'Estimasi biaya'), guests: c('int', 'Tamu'),
    location: c('text', 'Lokasi'), duration: c('text', 'Durasi'), pros: c('text', 'Kelebihan'),
    cons: c('text', 'Kekurangan'), chosen: c('int', 'Dipilih'), note: c('text', 'Catatan'),
  },
} as const;

export type TableName = keyof typeof TABLES;
export const isTable = (n: string): n is TableName => Object.prototype.hasOwnProperty.call(TABLES, n);
