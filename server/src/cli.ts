import { db } from './db.js';
import { hashPassword } from './auth.js';

const [cmd, name, password] = process.argv.slice(2);

if (cmd === 'create-user' || cmd === 'set-password') {
  if (!name || !password || password.length < 8) {
    console.error('Pakai: cli create-user <nama> <password min. 8 karakter>');
    process.exit(1);
  }
  const hash = hashPassword(password);
  db.prepare('INSERT INTO users(name,password) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET password=excluded.password').run(name, hash);
  console.log(`Pengguna "${name}" tersimpan.`);
} else if (cmd === 'list-users') {
  console.log(db.prepare('SELECT id,name FROM users').all());
} else {
  console.error('Perintah: create-user | set-password | list-users');
  process.exit(1);
}
