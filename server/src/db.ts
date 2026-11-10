import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { TABLES, TableName } from './schema.js';

export const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), '../data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'wedding.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
`);

const sqlType = { text: 'TEXT', int: 'INTEGER', real: 'REAL' } as const;
for (const [name, cols] of Object.entries(TABLES)) {
  const defs = Object.entries(cols).map(([k, [t]]) => `${k} ${sqlType[t]}`);
  db.exec(
    `CREATE TABLE IF NOT EXISTS ${name} (id INTEGER PRIMARY KEY AUTOINCREMENT, ${defs.join(', ')}, is_example INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`
  );
}

export function cols(table: TableName) {
  return Object.keys(TABLES[table]);
}

export function clean(table: TableName, body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, [t]] of Object.entries(TABLES[table])) {
    if (!(k in body)) continue;
    let v = body[k];
    if (v === '' || v === undefined) v = null;
    if (v !== null && t !== 'text') {
      const n = Number(v);
      v = Number.isFinite(n) ? n : null;
    } else if (v !== null) v = String(v);
    out[k] = v;
  }
  if ('is_example' in body) out.is_example = body.is_example ? 1 : 0;
  return out;
}

export function insert(table: TableName, data: Record<string, unknown>) {
  const keys = Object.keys(data);
  if (!keys.length) return Number(db.prepare(`INSERT INTO ${table} DEFAULT VALUES`).run().lastInsertRowid);
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(k => '@' + k).join(',')})`;
  return Number(db.prepare(sql).run(data).lastInsertRowid);
}

export function update(table: TableName, id: number, data: Record<string, unknown>) {
  const keys = Object.keys(data);
  if (!keys.length) return;
  db.prepare(`UPDATE ${table} SET ${keys.map(k => `${k}=@${k}`).join(',')} WHERE id=@__id`).run({ ...data, __id: id });
}

export function getSetting(key: string) {
  const r = db.prepare('SELECT value FROM settings WHERE key=?').get(key) as { value: string } | undefined;
  return r?.value ?? null;
}
export function setSetting(key: string, value: string) {
  db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value);
}
