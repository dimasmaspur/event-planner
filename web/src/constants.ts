export type Opt = { value: string; label: string; tone?: 'good' | 'warn' | 'bad' | 'muted' | 'lam' | 'wed' };

export const EVENTS: Opt[] = [
  { value: 'lamaran', label: 'Lamaran', tone: 'lam' },
  { value: 'wedding', label: 'Wedding', tone: 'wed' },
];
export const RUNDOWN_EVENTS: Opt[] = [
  { value: 'lamaran', label: 'Lamaran', tone: 'lam' },
  { value: 'akad', label: 'Akad nikah', tone: 'wed' },
  { value: 'resepsi', label: 'Resepsi', tone: 'wed' },
];
export const OWNERS: Opt[] = ['Berdua', 'Saya', 'Pasangan', 'Keluarga', 'WO'].map(v => ({ value: v, label: v }));
export const TASK_STATUS: Opt[] = [
  { value: 'todo', label: 'Belum', tone: 'muted' },
  { value: 'doing', label: 'Dikerjakan', tone: 'warn' },
  { value: 'done', label: 'Selesai', tone: 'good' },
];
export const VENDOR_STATUS: Opt[] = [
  { value: 'survey', label: 'Survey', tone: 'muted' },
  { value: 'negosiasi', label: 'Negosiasi', tone: 'warn' },
  { value: 'dipilih', label: 'Dipilih', tone: 'warn' },
  { value: 'dp', label: 'DP dibayar', tone: 'good' },
  { value: 'lunas', label: 'Lunas', tone: 'good' },
];
export const ITEM_STATUS: Opt[] = [
  { value: 'belum', label: 'Belum dibeli', tone: 'muted' },
  { value: 'dibeli', label: 'Sudah dibeli', tone: 'good' },
  { value: 'diterima', label: 'Sudah diterima', tone: 'good' },
];
export const DOC_STATUS: Opt[] = [
  { value: 'belum', label: 'Belum', tone: 'muted' },
  { value: 'proses', label: 'Proses', tone: 'warn' },
  { value: 'selesai', label: 'Selesai', tone: 'good' },
];
export const DOC_FOR: Opt[] = ['Pria', 'Wanita', 'Berdua'].map(v => ({ value: v, label: v }));
export const SEREH_FOR: Opt[] = ['Pengantin wanita', 'Pengantin pria', 'Keluarga'].map(v => ({ value: v, label: v }));
export const SIDES: Opt[] = ['Pria', 'Wanita'].map(v => ({ value: v, label: v }));
export const GUEST_CATS: Opt[] = ['Keluarga', 'Teman', 'Kantor', 'Tetangga', 'VIP'].map(v => ({ value: v, label: v }));
export const INVITED_TO: Opt[] = [
  { value: 'lamaran', label: 'Lamaran', tone: 'lam' },
  { value: 'wedding', label: 'Wedding', tone: 'wed' },
  { value: 'keduanya', label: 'Keduanya', tone: 'muted' },
];
export const INV_TYPES: Opt[] = ['Fisik', 'Digital'].map(v => ({ value: v, label: v }));
export const RSVP: Opt[] = [
  { value: 'belum', label: 'Belum', tone: 'muted' },
  { value: 'hadir', label: 'Hadir', tone: 'good' },
  { value: 'tidak', label: 'Tidak hadir', tone: 'bad' },
];
export const SOURCES: Opt[] = ['Pribadi', 'Orang tua pria', 'Orang tua wanita', 'Lainnya'].map(v => ({ value: v, label: v }));
export const BUDGET_CATS = [
  'Venue', 'Katering', 'Dekorasi', 'MUA & Busana', 'Foto & Video', 'Undangan', 'Souvenir',
  'Mahar & Seserahan', 'Cincin', 'Hiburan', 'Administrasi', 'Lain-lain',
];
export const MOOD_CATS = [
  'Dekorasi', 'Busana akad', 'Busana resepsi', 'MUA & hijab', 'Venue', 'Undangan', 'Souvenir', 'Seserahan', 'Lainnya',
];
export const NOTE_CATS = ['Tema', 'Warna', 'Inspirasi', 'Lainnya'];

export const label = (opts: Opt[], v: unknown) => opts.find(o => o.value === v)?.label ?? (v ? String(v) : '');
