import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, useSettings } from './api';
import { Button, ConfirmHost, ThemeToggle } from './ui';
import { Home } from './pages/Home';
import { Budget } from './pages/Budget';
import { Needs } from './pages/Needs';
import { Compare } from './pages/Compare';
import { Rundown } from './pages/Rundown';
import { Guests } from './pages/Guests';
import { Mood } from './pages/Mood';
import { SettingsPage } from './pages/SettingsPage';

const NAV: { id: string; label: string; icon: string; page: () => ReactNode }[] = [
  { id: 'beranda', label: 'Beranda', icon: '◧', page: () => <Home /> },
  { id: 'budget', label: 'Budget', icon: '◨', page: () => <Budget /> },
  { id: 'kebutuhan', label: 'Kebutuhan acara', icon: '☰', page: () => <Needs /> },
  { id: 'komparasi', label: 'Komparasi', icon: '⇄', page: () => <Compare /> },
  { id: 'rundown', label: 'Rundown', icon: '◷', page: () => <Rundown /> },
  { id: 'tamu', label: 'Daftar tamu', icon: '☺', page: () => <Guests /> },
  { id: 'moodboard', label: 'Moodboard & catatan', icon: '▦', page: () => <Mood /> },
  { id: 'pengaturan', label: 'Pengaturan', icon: '⚙', page: () => <SettingsPage /> },
];

function useHash() {
  const get = () => location.hash.replace('#', '') || 'beranda';
  const [h, setH] = useState(get);
  useEffect(() => {
    const f = () => { setH(get()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return h;
}

function Login({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await api('/api/login', { method: 'POST', body: { name, password } }); onDone(); }
    catch (x) { setErr(x instanceof Error ? x.message : 'Gagal masuk'); }
    finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-full place-items-center px-4 py-10">
      <div className="fixed right-4 top-4"><ThemeToggle /></div>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Event Planner</h1>
        <p className="mt-1 text-sm text-muted">Masuk untuk membuka rencana lamaran & pernikahan.</p>
        <label className="mt-5 block text-xs font-medium text-muted" htmlFor="u">Nama</label>
        <input id="u" className="field mt-1" autoComplete="username" value={name} onChange={e => setName(e.target.value)} autoFocus />
        <label className="mt-3 block text-xs font-medium text-muted" htmlFor="p">Password</label>
        <input id="p" type="password" className="field mt-1" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
        {err && <p role="alert" className="mt-3 text-sm text-bad">{err}</p>}
        <Button type="submit" variant="primary" className="mt-5 w-full" disabled={busy || !name || !password}>{busy ? 'Masuk…' : 'Masuk'}</Button>
      </form>
    </div>
  );
}

function Shell({ user }: { user: { name: string } }) {
  const hash = useHash();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: s } = useSettings();
  const current = NAV.find(n => n.id === hash) ?? NAV[0];
  const title = 'Event Planner';
  useEffect(() => { setOpen(false); }, [hash]);
  useEffect(() => { document.title = `${current.label} · ${title}`; }, [current, title]);
  const logout = async () => {
    try { await api('/api/logout', { method: 'POST' }); } finally { qc.clear(); location.replace('/'); }
  };

  const nav = (
    <nav aria-label="Menu utama" className="flex flex-col gap-0.5">
      {NAV.map(n => (
        <a
          key={n.id} href={`#${n.id}`} aria-current={n.id === current.id ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${n.id === current.id ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-sunken hover:text-ink'}`}
        >
          <span aria-hidden className="w-4 text-center">{n.icon}</span>{n.label}
        </a>
      ))}
    </nav>
  );

  return (
    <div className="min-h-full md:grid md:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-line bg-surface p-4 md:flex">
        <div>
          <div className="mb-6 px-3 pt-2 font-display text-xl font-semibold tracking-tight leading-tight">{title}</div>
          {nav}
        </div>
        <div className="px-3 text-xs text-muted">
          <ThemeToggle className="mb-3" />
          <div className="mb-1">Masuk sebagai <b className="text-ink">{user.name}</b></div>
          <button onClick={logout} className="underline hover:text-ink">Keluar</button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface px-4 py-2.5 md:hidden" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
        <div className="truncate font-display text-lg font-semibold tracking-tight">{title}</div>
        <Button size="sm" onClick={() => setOpen(true)} aria-label="Buka menu" aria-expanded={open}>☰ Menu</Button>
      </header>
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col justify-between bg-surface p-4">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg font-semibold tracking-tight">Menu</span>
                <button onClick={() => setOpen(false)} aria-label="Tutup menu" className="rounded-lg p-1 text-muted hover:bg-sunken">✕</button>
              </div>
              {nav}
            </div>
            <div className="text-xs text-muted">
              <ThemeToggle className="mb-3" />
              <div className="mb-1">Masuk sebagai <b className="text-ink">{user.name}</b></div>
              <button onClick={logout} className="underline">Keluar</button>
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10" style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto max-w-6xl">{current.page()}</div>
      </main>
    </div>
  );
}

export function App() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try { return await api<{ id: number; name: string }>('/api/me'); }
      catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
    },
  });
  const qc = useQueryClient();
  if (me.isLoading) return <div className="grid min-h-full place-items-center text-muted">Memuat…</div>;
  if (me.isError) return <div className="grid min-h-full place-items-center px-4 text-center text-bad">Tidak bisa terhubung ke server. Muat ulang halaman.</div>;
  if (!me.data) return <Login onDone={() => qc.invalidateQueries({ queryKey: ['me'] })} />;
  return <><Shell user={me.data} /><ConfirmHost /></>;
}
