// Smoke test API. Jalankan terhadap server UJI (data sementara), bukan data asli:
//   BASE=http://localhost:3001 USER_NAME=penguji USER_PASS=ujicoba-12345 node server/test/api-smoke.mjs
const BASE = process.env.BASE || 'http://localhost:3001';
const USER_NAME = process.env.USER_NAME || 'penguji';
const USER_PASS = process.env.USER_PASS || 'ujicoba-12345';

let pass = 0, fail = 0;
const failures = [];
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; failures.push(name); console.log(`  ✗ ${name} ${extra}`); }
};
const section = n => console.log(`\n# ${n}`);

let cookie = '';
async function call(method, path, body, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (cookie && !opts.noAuth) headers.cookie = cookie;
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) { headers['content-type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(BASE + path, { method, headers, body: payload, redirect: 'manual' });
  const raw = Buffer.from(await res.arrayBuffer());
  const text = raw.toString('utf8');
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, json, text, raw, headers: res.headers };
}
const get = (p, o) => call('GET', p, undefined, o);
const post = (p, b, o) => call('POST', p, b, o);
const put = (p, b, o) => call('PUT', p, b, o);
const del = (p, o) => call('DELETE', p, undefined, o);

// PNG kecil tanpa dependensi
import zlib from 'node:zlib';
function png(w, h, rgb) {
  const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  const crc = buf => { let c = -1; for (const b of buf) c = crcT[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(w).fill(rgb).flat())]);
  const raw = Buffer.concat(Array(h).fill(row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------- AUTH
section('Auth');
ok((await get('/api/budget_items', { noAuth: true })).status === 401, 'API tanpa login ditolak (401)');
ok((await get('/api/me', { noAuth: true })).status === 401, '/api/me tanpa login ditolak');
ok((await post('/api/login', { name: USER_NAME, password: 'salah-salah' })).status === 401, 'password salah ditolak');
ok((await post('/api/login', {})).status === 401, 'login tanpa isian ditolak');
{
  const r = await post('/api/login', { name: USER_NAME, password: USER_PASS });
  ok(r.status === 200 && r.json?.name === USER_NAME, 'login benar berhasil');
  const sc = r.headers.get('set-cookie') || '';
  ok(/HttpOnly/i.test(sc), 'cookie sesi HttpOnly');
  ok(/SameSite=Lax/i.test(sc), 'cookie sesi SameSite=Lax');
  cookie = sc.split(';')[0];
}
ok((await get('/api/me')).json?.name === USER_NAME, '/api/me mengembalikan pengguna');
{
  const ip = { 'x-forwarded-for': '203.0.113.77' };
  let last;
  for (let i = 0; i < 9; i++) last = await post('/api/login', { name: USER_NAME, password: 'x' + i }, { headers: ip, noAuth: true });
  ok(last.status === 429, 'login dibatasi setelah 8 kali gagal (429)', `status=${last.status}`);
  const good = await post('/api/login', { name: USER_NAME, password: USER_PASS }, { headers: ip, noAuth: true });
  ok(good.status === 429, 'password benar pun ditolak saat terkunci');
  const other = await post('/api/login', { name: USER_NAME, password: USER_PASS }, { headers: { 'x-forwarded-for': '203.0.113.78' }, noAuth: true });
  ok(other.status === 200, 'IP lain tidak ikut terkunci');
}

// ---------------------------------------------------------------- SETTINGS
section('Pengaturan');
{
  const r = await put('/api/settings', { groom_name: 'Dimas', bride_name: 'Ayu', date_akad: '2027-10-10', budget_wedding: '150000000', 'bad key!': 'x', seeded: '0' });
  ok(r.status === 200, 'simpan pengaturan');
  const s = (await get('/api/settings')).json;
  ok(s.groom_name === 'Dimas' && s.date_akad === '2027-10-10' && s.budget_wedding === '150000000', 'pengaturan terbaca kembali');
  ok(!('bad key!' in s), 'key tidak valid diabaikan');
  ok(!('seeded' in s), 'flag internal "seeded" tidak bocor / tidak bisa diubah');
  await put('/api/settings', { groom_name: '' });
  ok((await get('/api/settings')).json.groom_name === '', 'nilai kosong tersimpan');
}

// ---------------------------------------------------------------- SEED
section('Data contoh (seed)');
const counts = {};
for (const t of ['budget_items', 'tasks', 'documents', 'seserahan', 'rundown', 'guests', 'compare_needs', 'compare_candidates', 'concepts', 'palette', 'notes', 'items']) {
  const r = await get('/api/' + t);
  counts[t] = r.json?.length;
  ok(r.status === 200 && counts[t] > 0, `${t} terisi template (${counts[t]})`);
}
{
  const g = (await get('/api/guests')).json;
  ok(g.every(x => x.is_example === 1), 'semua baris seed ditandai contoh');
}

// ---------------------------------------------------------------- CRUD
section('CRUD generik');
const sample = {
  budget_items: { category: 'Uji', item: 'Item uji', event: 'wedding', estimate: 1000, actual: 900, paid: 100 },
  tasks: { title: 'Tugas uji', event: 'wedding', status: 'todo', owner: 'Saya', due_date: '2027-01-01' },
  vendors: { category: 'Uji', name: 'Vendor uji', price: 5000, status: 'survey' },
  items: { name: 'Barang uji', qty: 2, unit_price: 3000, status: 'belum' },
  seserahan: { name: 'Seserahan uji', estimate: 2000, status: 'belum' },
  documents: { name: 'Berkas uji', for_whom: 'Pria', status: 'belum' },
  rundown: { event: 'akad', start_time: '08:00', end_time: '08:30', activity: 'Uji' },
  guests: { name: 'Tamu uji', side: 'Pria', category: 'Teman', invited_to: 'wedding', sent: 0, rsvp: 'belum', pax: 2 },
  notes: { title: 'Catatan uji', body: 'isi' },
  palette: { name: 'Warna uji', hex: '#112233' },
  concepts: { name: 'Konsep uji', cost: 1000000, guests: 100 },
  compare_needs: { kind: 'vendor', title: 'Kebutuhan uji' },
};
for (const [t, body] of Object.entries(sample)) {
  const c = await post('/api/' + t, body);
  const id = c.json?.id;
  ok(c.status === 200 && id > 0, `${t}: tambah`);
  const row = (await get('/api/' + t)).json.find(r => r.id === id);
  ok(row && Object.entries(body).every(([k, v]) => row[k] === v), `${t}: data terbaca sama persis`, JSON.stringify(row));
  const key = Object.keys(body)[0];
  const u = await put(`/api/${t}/${id}`, { [key]: typeof body[key] === 'number' ? 777 : 'diubah' });
  const row2 = (await get('/api/' + t)).json.find(r => r.id === id);
  ok(u.status === 200 && row2[key] === (typeof body[key] === 'number' ? 777 : 'diubah'), `${t}: ubah`);
  ok((await del(`/api/${t}/${id}`)).status === 200 && !(await get('/api/' + t)).json.some(r => r.id === id), `${t}: hapus`);
}
{
  const id = (await post('/api/budget_items', { item: 'Angka', estimate: '1.234', paid: 'abc', actual: '' })).json.id;
  const r = (await get('/api/budget_items')).json.find(x => x.id === id);
  ok(r.estimate === 1.234 || r.estimate === 1, 'angka berupa string dikonversi', `estimate=${r.estimate}`);
  ok(r.paid === null, 'angka tidak valid menjadi null');
  ok(r.actual === null, 'string kosong menjadi null');
  await del('/api/budget_items/' + id);
}
{
  const id = (await post('/api/guests', { name: "O'Brien \"Quote\"; DROP TABLE guests;--", note: '<script>alert(1)</script>' })).json.id;
  const r = (await get('/api/guests')).json.find(x => x.id === id);
  ok(r.name.includes('DROP TABLE') && r.note.includes('<script>'), 'teks aneh/injeksi tersimpan sebagai teks biasa');
  ok((await get('/api/guests')).status === 200, 'tabel guests masih utuh');
  await del('/api/guests/' + id);
}
{
  const id = (await post('/api/guests', { name: 'Kolom asing', hack: 'x', is_example: 1, id: 99999 })).json.id;
  const r = (await get('/api/guests')).json.find(x => x.id === id);
  ok(!('hack' in r) && r.is_example === 0 && r.id === id, 'kolom asing, is_example, dan id dari klien diabaikan');
  await del('/api/guests/' + id);
}
ok((await get('/api/users')).status === 404, 'tabel users tidak bisa diakses lewat API');
ok((await get('/api/sessions')).status === 404, 'tabel sessions tidak bisa diakses');
ok((await get('/api/nonexistent')).status === 404, 'tabel tak dikenal 404');
ok((await get('/api/guests;DROP')).status === 404, 'nama tabel berbahaya 404');
ok((await post('/api/moodboard', { title: 'x' })).status === 404, 'moodboard hanya lewat upload (POST generik ditolak)');
ok((await put('/api/guests/abc', { name: 'x' })).status === 200, 'ID non-angka tidak membuat server crash');
ok((await get('/api/health', { noAuth: true })).status === 200, 'health check terbuka');

// edit contoh -> bukan contoh lagi
{
  const ex = (await get('/api/tasks')).json.find(t => t.is_example === 1);
  await put('/api/tasks/' + ex.id, { status: 'done' });
  const after = (await get('/api/tasks')).json.find(t => t.id === ex.id);
  ok(after.is_example === 0 && after.status === 'done', 'contoh yang diedit jadi data milik pengguna');
}

// ---------------------------------------------------------------- KOMPARASI
section('Komparasi: pilih pemenang');
{
  const needs = (await get('/api/compare_needs')).json;
  const kat = needs.find(n => n.title === 'Katering resepsi');
  let cands = (await get('/api/compare_candidates')).json.filter(c => c.need_id === kat.id);
  const [a, b] = cands;
  const budget0 = (await get('/api/budget_items')).json;
  const row0 = budget0.find(x => x.item === 'Katering resepsi');
  ok(row0 && row0.actual === null, 'sebelum dipilih: budget "Katering resepsi" belum ada realisasi');

  ok((await post(`/api/compare/candidates/${a.id}/choose`)).status === 200, 'pilih kandidat A');
  let bud = (await get('/api/budget_items')).json;
  let ven = (await get('/api/vendors')).json;
  ok(bud.find(x => x.id === row0.id).actual === a.price, 'budget yang cocok judulnya terisi realisasi = harga A');
  ok(bud.filter(x => x.item === 'Katering resepsi').length === 1, 'tidak membuat baris budget ganda');
  ok(ven.some(v => v.name === a.name && v.origin === 'komparasi' && v.price === a.price && v.status === 'dipilih'), 'vendor A masuk daftar Vendor');

  ok((await post(`/api/compare/candidates/${b.id}/choose`)).status === 200, 'ganti pemenang ke B');
  cands = (await get('/api/compare_candidates')).json.filter(c => c.need_id === kat.id);
  ok(cands.filter(c => c.chosen).length === 1 && cands.find(c => c.id === b.id).chosen === 1, 'hanya satu pemenang');
  ven = (await get('/api/vendors')).json;
  ok(!ven.some(v => v.name === a.name) && ven.some(v => v.name === b.name), 'vendor A dihapus, vendor B masuk');
  bud = (await get('/api/budget_items')).json;
  ok(bud.find(x => x.id === row0.id).actual === b.price, 'realisasi budget ikut berubah ke harga B');

  ok((await del(`/api/compare/candidates/${b.id}/choose`)).status === 200, 'batalkan pilihan');
  ven = (await get('/api/vendors')).json;
  bud = (await get('/api/budget_items')).json;
  ok(!ven.some(v => v.name === b.name), 'vendor hasil otomatis dihapus');
  ok(bud.find(x => x.id === row0.id).actual === null, 'realisasi budget dikembalikan kosong');
  ok(bud.find(x => x.id === row0.id) !== undefined, 'baris budget asli tidak ikut terhapus');

  // kebutuhan tanpa baris budget cocok -> buat baris baru bertanda komparasi
  const nid = (await post('/api/compare_needs', { kind: 'item', title: 'Gantungan kunci', category: 'Souvenir', event: 'wedding' })).json.id;
  const cid = (await post('/api/compare_candidates', { need_id: nid, name: 'Toko Z', price: 15000, chosen: 0 })).json.id;
  await post(`/api/compare/candidates/${cid}/choose`);
  bud = (await get('/api/budget_items')).json;
  const made = bud.find(x => x.origin === 'komparasi' && x.item.includes('Gantungan kunci'));
  ok(made && made.estimate === 15000 && made.actual === 15000 && made.category === 'Souvenir', 'baris budget baru dibuat dari kandidat');
  ok((await get('/api/items')).json.some(i => i.origin === 'komparasi' && i.unit_price === 15000 && i.name.includes('Toko Z')), 'kind=item: masuk daftar Barang');
  await del(`/api/compare/candidates/${cid}/choose`);
  ok(!(await get('/api/budget_items')).json.some(x => x.id === made.id), 'unchoose menghapus baris budget otomatis');

  // hapus kebutuhan -> kandidat ikut terhapus, hasil otomatis ikut bersih
  await post(`/api/compare/candidates/${cid}/choose`);
  ok((await del('/api/compare_needs/' + nid)).status === 200, 'hapus kebutuhan');
  ok(!(await get('/api/compare_candidates')).json.some(c => c.need_id === nid), 'kandidat ikut terhapus');
  ok(!(await get('/api/budget_items')).json.some(x => x.item.includes('Gantungan kunci')), 'budget otomatis ikut bersih');
  ok(!(await get('/api/items')).json.some(i => i.name.includes('Toko Z')), 'barang otomatis ikut bersih');
  ok((await post('/api/compare/candidates/99999/choose')).status === 404, 'pilih kandidat tak ada -> 404');
}

// ---------------------------------------------------------------- UPLOAD
section('Moodboard: upload & file');
let photo;
{
  const fd = new FormData();
  fd.append('file', new Blob([png(300, 400, [200, 100, 50])], { type: 'image/png' }), 'dekor.png');
  fd.append('file', new Blob([png(2400, 1800, [10, 100, 200])], { type: 'image/png' }), 'besar.png');
  fd.append('category', 'Dekorasi'); fd.append('event', 'wedding');
  const r = await post('/api/upload/moodboard', fd);
  ok(r.status === 200 && r.json.ids.length === 2, 'upload 2 foto sekaligus', r.text);
  const rows = (await get('/api/moodboard')).json;
  photo = rows.find(x => x.title === 'dekor');
  const big = rows.find(x => x.title === 'besar');
  ok(photo && photo.category === 'Dekorasi' && photo.event === 'wedding' && photo.file.endsWith('.webp'), 'metadata foto tersimpan, judul dari nama file');
  const full = await fetch(BASE + '/uploads/' + big.file, { headers: { cookie } });
  const buf = Buffer.from(await full.arrayBuffer());
  ok(full.status === 200 && full.headers.get('content-type') === 'image/webp', 'file bisa dibuka setelah login');
  const w = buf.readUInt16LE(26) & 0x3fff; // lebar VP8 (perkiraan)
  ok(buf.length < 200000, `foto besar 2400x1800 diperkecil (ukuran ${buf.length} byte)`);
  const th = await fetch(BASE + '/uploads/' + big.thumb, { headers: { cookie } });
  ok(th.status === 200, 'thumbnail tersedia');
  ok((await fetch(BASE + '/uploads/' + photo.file)).status === 401, 'file tanpa login ditolak (401)');
  ok((await fetch(BASE + '/uploads/..%2F..%2Fwedding.db', { headers: { cookie } })).status === 404, 'path traversal ditolak');
  ok((await fetch(BASE + '/uploads/abc.webp', { headers: { cookie } })).status === 404, 'nama file tidak valid 404');
  await del('/api/moodboard/' + big.id);
  ok((await fetch(BASE + '/uploads/' + big.file, { headers: { cookie } })).status === 404, 'hapus foto menghapus file dari disk');
}
{
  const fd = new FormData();
  fd.append('file', new Blob(['bukan gambar'], { type: 'text/plain' }), 'x.txt');
  ok((await post('/api/upload/moodboard', fd)).status === 400, 'file non-gambar ditolak');
  const fd2 = new FormData();
  fd2.append('file', new Blob(['halo'], { type: 'image/png' }), 'palsu.png');
  ok((await post('/api/upload/moodboard', fd2)).status === 400, 'file palsu berlabel image/png ditolak');
  ok((await post('/api/upload/moodboard', new FormData())).status === 400, 'upload tanpa file ditolak');
  const fd3 = new FormData(); fd3.append('file', new Blob([png(10, 10, [0, 0, 0])], { type: 'image/png' }), 'a.png');
  ok((await post('/api/upload/moodboard', fd3, { noAuth: true })).status === 401, 'upload tanpa login ditolak');
}
{
  const r = await put('/api/moodboard/' + photo.id, { title: 'Dekor baru', favorite: 1, file: 'jahat.webp', thumb: 'jahat.t.webp' });
  const row = (await get('/api/moodboard')).json.find(x => x.id === photo.id);
  ok(r.status === 200 && row.title === 'Dekor baru' && row.favorite === 1, 'ubah judul & favorit foto');
  ok(row.file === photo.file && row.thumb === photo.thumb, 'klien tidak bisa menimpa nama file');
  // tautan ke kandidat
  const cand = (await get('/api/compare_candidates')).json[0];
  await put('/api/moodboard/' + photo.id, { candidate_id: cand.id });
  ok((await get('/api/moodboard')).json.find(x => x.id === photo.id).candidate_id === cand.id, 'foto tertaut ke kandidat');
  await put('/api/moodboard/' + photo.id, { candidate_id: null });
  ok((await get('/api/moodboard')).json.find(x => x.id === photo.id).candidate_id === null, 'tautan bisa dilepas');
  await put('/api/moodboard/' + photo.id, { candidate_id: cand.id });
  await del('/api/compare_candidates/' + cand.id);
  ok((await get('/api/moodboard')).json.find(x => x.id === photo.id).candidate_id === null, 'hapus kandidat melepas tautan foto');
  await del('/api/moodboard/' + photo.id);
  ok((await get('/api/moodboard')).json.length === 0, 'semua foto uji bersih');
}

// ---------------------------------------------------------------- EXPORT
section('Export CSV');
for (const t of ['guests', 'budget_items', 'vendors', 'items', 'seserahan', 'documents', 'tasks', 'rundown', 'compare_candidates', 'concepts', 'notes', 'palette', 'compare_needs']) {
  const r = await get(`/api/export/${t}.csv`);
  ok(r.status === 200 && r.headers.get('content-type')?.includes('text/csv') && r.raw[0] === 0xef && r.raw[1] === 0xbb && r.raw[2] === 0xbf, `${t}.csv: BOM UTF-8 + header`);
}
{
  const r = await get('/api/export/guests.csv');
  const lines = r.text.replace('﻿', '').split('\r\n');
  ok(lines[0] === 'Nama,No. HP,Pihak,Kategori,Diundang ke,Jenis undangan,Terkirim,RSVP,Pax,Catatan', 'header CSV berbahasa Indonesia', lines[0]);
  const id = (await post('/api/guests', { name: '=HYPERLINK("http://jahat")', note: 'a,b\n"c"' })).json.id;
  const csv = (await get('/api/export/guests.csv')).text;
  ok(csv.includes("\"'=HYPERLINK(") || csv.includes("'=HYPERLINK("), 'sel berawalan = dinetralkan (anti formula injection)');
  ok(csv.includes('"a,b\n""c"""'), 'koma, baris baru, dan kutip di-escape benar');
  await del('/api/guests/' + id);
}
ok((await get('/api/export/moodboard.csv')).status === 404, 'export moodboard tidak tersedia');
ok((await get('/api/export/users.csv')).status === 404, 'export users tidak tersedia');
ok((await get('/api/export/guests.csv', { noAuth: true })).status === 401, 'export tanpa login ditolak');

// ---------------------------------------------------------------- CONTOH
section('Hapus data contoh');
{
  const before = (await get('/api/rundown')).json.length;
  const mine = (await post('/api/rundown', { event: 'akad', start_time: '12:00', activity: 'Milik saya' })).json.id;
  ok((await del('/api/examples')).status === 200, 'hapus semua contoh');
  const after = (await get('/api/rundown')).json;
  ok(after.length === 1 && after[0].id === mine, `data buatan sendiri aman (dari ${before} -> ${after.length})`);
  const tasks = (await get('/api/tasks')).json;
  ok(tasks.length === 1 && tasks[0].status === 'done', 'contoh yang sudah diedit (menjadi milik pengguna) tidak ikut terhapus');
  ok((await get('/api/compare_candidates')).json.every(c => c.need_id), 'tidak ada kandidat yatim');
  ok((await get('/api/guests')).json.length === 0, 'tamu contoh terhapus');
}

// ---------------------------------------------------------------- STATIS & LOGOUT
section('Statis & logout');
{
  const r = await get('/', { noAuth: true });
  ok(r.status === 200 && r.text.includes('<div id="root">'), 'halaman utama dilayani');
  ok((await get('/halaman-acak', { noAuth: true })).text.includes('<div id="root">'), 'fallback SPA');
  ok((await post('/api/logout')).status === 200, 'logout');
  ok((await get('/api/budget_items')).status === 401, 'setelah logout API ditolak (sesi dihapus di server)');
}

console.log(`\n==== ${pass} lulus, ${fail} gagal ====`);
if (fail) { console.log('Gagal:\n - ' + failures.join('\n - ')); process.exit(1); }
