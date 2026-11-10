import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { db, clean, insert, update, UPLOAD_DIR, getSetting, setSetting } from './db.js';
import { TABLES, isTable } from './schema.js';
import { createSession, destroySession, userFromToken, verifyPassword, tooManyAttempts, recordFail, clearFails, SESSION_MS } from './auth.js';
import { seedIfNeeded, clearExamples } from './seed.js';

seedIfNeeded();

const app = new Hono<{ Variables: { user: { id: number; name: string } } }>();
const SECURE = (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true';
const WEB_DIR = process.env.WEB_DIR || path.resolve(process.cwd(), '../web/dist');
const BLOCKED = new Set(['settings', 'login', 'logout', 'me', 'upload', 'examples', 'compare', 'export', 'health']);

app.get('/api/health', c => c.json({ ok: true }));

// ---------- auth ----------
app.post('/api/login', async c => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() || 'local';
  if (tooManyAttempts(ip)) return c.json({ error: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.' }, 429);
  const { name, password } = await c.req.json().catch(() => ({}));
  const u = db.prepare('SELECT id,name,password FROM users WHERE name=?').get(String(name || '')) as
    | { id: number; name: string; password: string } | undefined;
  if (!u || !verifyPassword(String(password || ''), u.password)) {
    recordFail(ip);
    return c.json({ error: 'Nama atau password salah.' }, 401);
  }
  clearFails(ip);
  const token = createSession(u.id);
  setCookie(c, 'sid', token, { httpOnly: true, sameSite: 'Lax', secure: SECURE, path: '/', maxAge: SESSION_MS / 1000 });
  return c.json({ id: u.id, name: u.name });
});

app.post('/api/logout', c => {
  destroySession(getCookie(c, 'sid'));
  deleteCookie(c, 'sid', { path: '/' });
  return c.json({ ok: true });
});

app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/login' || c.req.path === '/api/health' || c.req.path === '/api/logout') return next();
  const user = userFromToken(getCookie(c, 'sid'));
  if (!user) return c.json({ error: 'Belum login' }, 401);
  c.set('user', user);
  return next();
});

app.get('/api/me', c => c.json(c.get('user')));

// ---------- settings ----------
app.get('/api/settings', c => {
  const rows = db.prepare("SELECT key,value FROM settings WHERE key<>'seeded'").all() as { key: string; value: string }[];
  return c.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});
app.put('/api/settings', async c => {
  const body = (await c.req.json()) as Record<string, unknown>;
  db.transaction(() => {
    for (const [k, v] of Object.entries(body)) {
      if (!/^[a-z_]{1,40}$/.test(k) || k === 'seeded') continue;
      setSetting(k, v == null ? '' : String(v));
    }
  })();
  return c.json({ ok: true });
});

app.delete('/api/examples', c => {
  clearExamples();
  setSetting('examples_cleared', '1');
  return c.json({ ok: true });
});

// ---------- komparasi: pilih pemenang ----------
type Cand = {
  id: number; need_id: number; name: string; price: number | null; details: string | null; contact: string | null;
  link: string | null; chosen: number; made_vendor_id: number | null; made_item_id: number | null; made_budget_id: number | null;
};
type Need = { id: number; kind: string; title: string; category: string | null; event: string | null };

function unchoose(candId: number) {
  const cand = db.prepare('SELECT * FROM compare_candidates WHERE id=?').get(candId) as Cand | undefined;
  if (!cand) return;
  if (cand.made_vendor_id) db.prepare('DELETE FROM vendors WHERE id=?').run(cand.made_vendor_id);
  if (cand.made_item_id) db.prepare('DELETE FROM items WHERE id=?').run(cand.made_item_id);
  if (cand.made_budget_id) {
    const b = db.prepare('SELECT origin FROM budget_items WHERE id=?').get(cand.made_budget_id) as { origin: string | null } | undefined;
    if (b?.origin === 'komparasi') db.prepare('DELETE FROM budget_items WHERE id=?').run(cand.made_budget_id);
    else if (b) db.prepare('UPDATE budget_items SET actual=NULL WHERE id=?').run(cand.made_budget_id);
  }
  db.prepare('UPDATE compare_candidates SET chosen=0, made_vendor_id=NULL, made_item_id=NULL, made_budget_id=NULL WHERE id=?').run(candId);
}

app.post('/api/compare/candidates/:id/choose', c => {
  const id = Number(c.req.param('id'));
  const cand = db.prepare('SELECT * FROM compare_candidates WHERE id=?').get(id) as Cand | undefined;
  if (!cand) return c.json({ error: 'Tidak ditemukan' }, 404);
  const need = db.prepare('SELECT * FROM compare_needs WHERE id=?').get(cand.need_id) as Need;
  db.transaction(() => {
    const others = db.prepare('SELECT id FROM compare_candidates WHERE need_id=?').all(need.id) as { id: number }[];
    for (const o of others) unchoose(o.id);
    const category = need.category || need.title;
    let vendorId: number | null = null, itemId: number | null = null;
    if (need.kind === 'vendor') {
      vendorId = insert('vendors', {
        category, name: cand.name, contact: cand.contact, package: cand.details, price: cand.price,
        event: need.event, status: 'dipilih', origin: 'komparasi',
      });
    } else {
      itemId = insert('items', {
        name: `${need.title} – ${cand.name}`, event: need.event, qty: 1, unit_price: cand.price,
        store: cand.details, link: cand.link, status: 'belum', origin: 'komparasi',
      });
    }
    const match = db
      .prepare('SELECT id FROM budget_items WHERE lower(item)=lower(?) AND event IS ? LIMIT 1')
      .get(need.title, need.event) as { id: number } | undefined;
    let budgetId: number;
    if (match) {
      budgetId = match.id;
      db.prepare('UPDATE budget_items SET actual=? WHERE id=?').run(cand.price, budgetId);
    } else {
      budgetId = insert('budget_items', {
        category, item: `${need.title} – ${cand.name}`, event: need.event,
        estimate: cand.price, actual: cand.price, origin: 'komparasi',
      });
    }
    db.prepare('UPDATE compare_candidates SET chosen=1, made_vendor_id=?, made_item_id=?, made_budget_id=? WHERE id=?').run(vendorId, itemId, budgetId, id);
  })();
  return c.json({ ok: true });
});

app.delete('/api/compare/candidates/:id/choose', c => {
  db.transaction(() => unchoose(Number(c.req.param('id'))))();
  return c.json({ ok: true });
});

// ---------- moodboard upload & file ----------
app.post('/api/upload/moodboard', async c => {
  const body = await c.req.parseBody({ all: true });
  const files = ([] as unknown[]).concat(body['file'] ?? []).filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return c.json({ error: 'Tidak ada file' }, 400);
  const ids: number[] = [];
  for (const f of files) {
    if (!f.type.startsWith('image/')) continue;
    if (f.size > 25 * 1024 * 1024) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const name = crypto.randomUUID();
    try {
      const base = sharp(buf, { failOn: 'none' }).rotate();
      await base.clone().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(UPLOAD_DIR, `${name}.webp`));
      await base.clone().resize(480, 480, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toFile(path.join(UPLOAD_DIR, `${name}.t.webp`));
    } catch {
      continue;
    }
    ids.push(insert('moodboard', {
      title: String(body['title'] || f.name.replace(/\.[^.]+$/, '')).slice(0, 120),
      category: String(body['category'] || 'Lainnya'),
      event: body['event'] ? String(body['event']) : null,
      favorite: 0, file: `${name}.webp`, thumb: `${name}.t.webp`,
    }));
  }
  if (!ids.length) return c.json({ error: 'File bukan gambar yang valid' }, 400);
  return c.json({ ids });
});

app.get('/uploads/:name', c => {
  if (!userFromToken(getCookie(c, 'sid'))) return c.text('Belum login', 401);
  const name = c.req.param('name');
  if (!/^[0-9a-f-]{36}(\.t)?\.webp$/.test(name)) return c.text('Not found', 404);
  const fp = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(fp)) return c.text('Not found', 404);
  return new Response(Readable.toWeb(fs.createReadStream(fp)) as ReadableStream, {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=31536000, immutable' },
  });
});

// ---------- export CSV ----------
app.get('/api/export/:file', c => {
  const table = c.req.param('file').replace(/\.csv$/, '');
  if (!isTable(table) || table === 'moodboard') return c.json({ error: 'Tabel tidak dikenal' }, 404);
  const defs = Object.entries(TABLES[table]).filter(([k]) => !k.startsWith('made_') && k !== 'origin');
  const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id`).all() as Record<string, unknown>[];
  const esc = (v: unknown) => {
    if (v == null) return '';
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = "'" + s; // cegah formula injection di Excel
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [defs.map(([, [, label]]) => esc(label)).join(',')]
    .concat(rows.map(r => defs.map(([k]) => esc(r[k])).join(','))).join('\r\n');
  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${table}.csv"`,
    },
  });
});

// ---------- CRUD generik ----------
app.get('/api/:table', c => {
  const t = c.req.param('table');
  if (BLOCKED.has(t) || !isTable(t)) return c.json({ error: 'Tidak ditemukan' }, 404);
  return c.json(db.prepare(`SELECT * FROM ${t} ORDER BY id`).all());
});

app.post('/api/:table', async c => {
  const t = c.req.param('table');
  if (BLOCKED.has(t) || !isTable(t) || t === 'moodboard') return c.json({ error: 'Tidak ditemukan' }, 404);
  const data = clean(t, await c.req.json());
  delete data.is_example;
  const id = insert(t, data);
  return c.json({ id });
});

app.put('/api/:table/:id', async c => {
  const t = c.req.param('table');
  if (BLOCKED.has(t) || !isTable(t)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const data = clean(t, await c.req.json());
  // contoh yang diedit dianggap data milik pengguna
  data.is_example = 0;
  if (t === 'moodboard') { delete data.file; delete data.thumb; }
  update(t, Number(c.req.param('id')), data);
  return c.json({ ok: true });
});

app.delete('/api/:table/:id', c => {
  const t = c.req.param('table');
  if (BLOCKED.has(t) || !isTable(t)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const id = Number(c.req.param('id'));
  db.transaction(() => {
    if (t === 'moodboard') {
      const r = db.prepare('SELECT file,thumb FROM moodboard WHERE id=?').get(id) as { file: string; thumb: string } | undefined;
      for (const f of [r?.file, r?.thumb]) if (f) fs.rmSync(path.join(UPLOAD_DIR, path.basename(f)), { force: true });
    }
    if (t === 'compare_needs') {
      const cs = db.prepare('SELECT id FROM compare_candidates WHERE need_id=?').all(id) as { id: number }[];
      for (const x of cs) {
        unchoose(x.id);
        db.prepare('UPDATE moodboard SET candidate_id=NULL WHERE candidate_id=?').run(x.id);
        db.prepare('DELETE FROM compare_candidates WHERE id=?').run(x.id);
      }
    }
    if (t === 'compare_candidates') {
      unchoose(id);
      db.prepare('UPDATE moodboard SET candidate_id=NULL WHERE candidate_id=?').run(id);
    }
    db.prepare(`DELETE FROM ${t} WHERE id=?`).run(id);
  })();
  return c.json({ ok: true });
});

// ---------- frontend statis ----------
app.use('/*', serveStatic({ root: path.relative(process.cwd(), WEB_DIR) || '.' }));
app.get('*', c => {
  const idx = path.join(WEB_DIR, 'index.html');
  if (!fs.existsSync(idx)) return c.text('Frontend belum di-build.', 404);
  return c.html(fs.readFileSync(idx, 'utf8'));
});

const port = Number(process.env.PORT || 3000);
serve({ fetch: app.fetch, port, hostname: process.env.HOST || '127.0.0.1' }, i => console.log(`Wedding planner jalan di http://${i.address}:${i.port}`));
