import { ReactNode, useEffect, useRef, useState } from 'react';
import { Opt } from './constants';

export const rp = (n: number | null | undefined) =>
  n == null ? '–' : 'Rp ' + Math.round(n).toLocaleString('id-ID');
export const rpShort = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e9) return `Rp ${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  if (a >= 1e6) return `Rp ${(n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  return rp(n);
};
export const fmtDate = (s?: string | null) =>
  s ? new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–';
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const daysUntil = (s?: string | null) =>
  s ? Math.round((new Date(s + 'T00:00:00').getTime() - new Date(todayStr() + 'T00:00:00').getTime()) / 86400000) : null;

const TONES: Record<string, string> = {
  good: 'bg-good-soft text-good',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  muted: 'bg-sunken text-muted',
  lam: 'bg-lam-soft text-lam',
  wed: 'bg-wed-soft text-wed',
  accent: 'bg-accent-soft text-accent',
};

export function Badge({ tone = 'muted', children }: { tone?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone] ?? TONES.muted}`}>
      {children}
    </span>
  );
}

export function ExampleTag() {
  return <span className="ml-1.5 rounded bg-sunken px-1 py-px text-[10px] font-medium uppercase tracking-wide text-muted align-middle">contoh</span>;
}

export function Button({
  variant = 'default', size = 'md', className = '', ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'default' | 'ghost' | 'danger'; size?: 'sm' | 'md' }) {
  const v = {
    primary: 'bg-accent text-accent-fg hover:opacity-90',
    default: 'bg-surface border border-line hover:bg-sunken',
    ghost: 'hover:bg-sunken text-muted hover:text-ink',
    danger: 'bg-bad-soft text-bad hover:opacity-80',
  }[variant];
  const s = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm';
  return <button {...p} className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-opacity disabled:opacity-50 ${v} ${s} ${className}`} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface ${className}`}>{children}</div>;
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl" style={{ textWrap: 'balance' }}>{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: { value: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map(t => (
        <button
          key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${value === t.value ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink'}`}
        >
          {t.label}{t.count != null && <span className="ml-1.5 text-xs text-muted tnum">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Segmented({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
      {options.map(o => (
        <button
          key={o.value} onClick={() => onChange(o.value)} aria-pressed={value === o.value}
          className={`rounded-md px-3 py-1 text-sm ${value === o.value ? 'bg-accent text-accent-fg' : 'text-muted hover:text-ink'}`}
        >{o.label}</button>
      ))}
    </div>
  );
}

export function Progress({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'good' | 'warn' | 'bad' }) {
  const col = { accent: 'bg-accent', good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad' }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${col}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref} onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose(); }}
      className={`m-auto w-[calc(100%-1.5rem)] ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/50`}
    >
      {open && (
        <div className="flex max-h-[88vh] flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Tutup" className="rounded-lg p-1 text-muted hover:bg-sunken">✕</button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}

export function FieldWrap({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function MoneyInput({ value, onChange, id }: { value: number | null | undefined; onChange: (v: number | null) => void; id?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">Rp</span>
      <input
        id={id} inputMode="numeric" className="field tnum pl-9"
        value={value == null ? '' : value.toLocaleString('id-ID')}
        onChange={e => {
          const d = e.target.value.replace(/\D/g, '');
          onChange(d === '' ? null : Number(d));
        }}
      />
    </div>
  );
}

export function SelectInput({ value, onChange, options, id, blank = '— pilih —' }: { value: string | null | undefined; onChange: (v: string) => void; options: Opt[]; id?: string; blank?: string }) {
  return (
    <select id={id} className="field" value={value ?? ''} onChange={e => onChange(e.target.value)}>
      <option value="">{blank}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function ExportButton({ table }: { table: string }) {
  return (
    <a href={`/api/export/${table}.csv`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium hover:bg-sunken">
      ⬇ Export CSV
    </a>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`tnum mt-0.5 truncate text-xl font-semibold ${tone ? `text-${tone}` : ''}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

type ThemePref = 'system' | 'light' | 'dark';
const readTheme = (): ThemePref => {
  try { const t = localStorage.getItem('theme'); return t === 'light' || t === 'dark' ? t : 'system'; } catch { return 'system'; }
};
const applyTheme = (t: ThemePref) => {
  if (t === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  try { if (t === 'system') localStorage.removeItem('theme'); else localStorage.setItem('theme', t); } catch { /* abaikan */ }
};

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [t, setT] = useState<ThemePref>(readTheme);
  const opts: { v: ThemePref; label: string; icon: string }[] = [
    { v: 'light', label: 'Terang', icon: '☀' },
    { v: 'system', label: 'Otomatis', icon: '◐' },
    { v: 'dark', label: 'Gelap', icon: '☾' },
  ];
  return (
    <div role="group" aria-label="Tema tampilan" className={`inline-flex rounded-lg border border-line bg-surface p-0.5 ${className}`}>
      {opts.map(o => (
        <button
          key={o.v} type="button" aria-pressed={t === o.v} title={o.label} aria-label={o.label}
          onClick={() => { setT(o.v); applyTheme(o.v); }}
          className={`min-w-10 whitespace-nowrap rounded-md px-3 py-1 text-sm ${t === o.v ? 'bg-accent-soft font-semibold text-accent' : 'text-muted hover:text-ink'}`}
        ><span aria-hidden>{o.icon}</span></button>
      ))}
    </div>
  );
}

// ---- konfirmasi di dalam aplikasi (window.confirm sering diblokir di browser tertentu) ----
type Pending = { msg: string; resolve: (v: boolean) => void };
let pendingSetter: ((p: Pending | null) => void) | null = null;

export function askConfirm(msg: string): Promise<boolean> {
  return new Promise(resolve => {
    if (pendingSetter) pendingSetter({ msg, resolve });
    else resolve(window.confirm(msg));
  });
}

export function ConfirmHost() {
  const [p, setP] = useState<Pending | null>(null);
  useEffect(() => { pendingSetter = setP; return () => { pendingSetter = null; }; }, []);
  const close = (v: boolean) => { p?.resolve(v); setP(null); };
  return (
    <Modal open={!!p} onClose={() => close(false)} title="Konfirmasi">
      <p className="text-sm">{p?.msg}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={() => close(false)}>Batal</Button>
        <Button variant="danger" onClick={() => close(true)} autoFocus>Ya, hapus</Button>
      </div>
    </Modal>
  );
}
