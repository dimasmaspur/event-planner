import { ReactNode } from 'react';
import { Row, useRows, useSettings } from '../api';
import { Badge, Card, daysUntil, fmtDate, Progress, rp, rpShort, todayStr } from '../ui';

const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const eff = (b: Row) => b.actual ?? b.estimate ?? 0;

function Countdown({ label, date, tone, place }: { label: string; date?: string; tone: 'lam' | 'wed'; place?: string }) {
  const d = daysUntil(date);
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <Badge tone={tone}>{label}</Badge>
        <span className="text-xs text-muted">{date ? fmtDate(date) : 'Tanggal belum diisi'}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {d == null ? (
          <a href="#pengaturan" className="text-sm text-accent underline">Atur tanggal di Pengaturan</a>
        ) : d > 0 ? (
          <><span className="tnum font-display text-5xl font-semibold">{d}</span><span className="text-muted">hari lagi</span></>
        ) : d === 0 ? (
          <span className="font-display text-3xl font-semibold">Hari ini!</span>
        ) : (
          <span className="text-muted">Sudah lewat {Math.abs(d)} hari</span>
        )}
      </div>
      {place && <div className="mt-1 truncate text-xs text-muted">{place}</div>}
    </Card>
  );
}

function ProgressCard({ title, done, total, href, unit = 'selesai' }: { title: string; done: number; total: number; href: string; unit?: string }) {
  const p = pct(done, total);
  return (
    <a href={href} className="block rounded-xl border border-line bg-surface p-4 hover:border-accent">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="tnum text-sm text-muted">{done}/{total}</span>
      </div>
      <div className="tnum mt-1 text-2xl font-semibold">{Math.round(p)}%<span className="ml-1.5 text-xs font-normal text-muted">{unit}</span></div>
      <div className="mt-2"><Progress value={p} tone={p >= 100 ? 'good' : 'accent'} /></div>
    </a>
  );
}

export function Home() {
  const { data: s = {} } = useSettings();
  const budget = useRows('budget_items').data ?? [];
  const tasks = useRows('tasks').data ?? [];
  const docs = useRows('documents').data ?? [];
  const items = useRows('items').data ?? [];
  const sereh = useRows('seserahan').data ?? [];
  const guests = useRows('guests').data ?? [];
  const needs = useRows('compare_needs').data ?? [];
  const cands = useRows('compare_candidates').data ?? [];

  const today = todayStr();
  const evBudget = (ev: string, target?: string) => {
    const rows = budget.filter(b => b.event === ev);
    return {
      plan: rows.reduce((a, b) => a + (b.estimate ?? 0), 0),
      real: rows.reduce((a, b) => a + eff(b), 0),
      paid: rows.reduce((a, b) => a + (b.paid ?? 0), 0),
      target: target ? Number(target) : 0,
    };
  };
  const bl = evBudget('lamaran', s.budget_lamaran);
  const bw = evBudget('wedding', s.budget_wedding);

  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today);
  const dueSoon = budget.filter(b => {
    const d = daysUntil(b.due_date);
    return d != null && d <= 14 && eff(b) - (b.paid ?? 0) > 0;
  });
  const undecided = needs.filter(n => !cands.some(c => c.need_id === n.id && c.chosen));
  const attention: { key: string; node: ReactNode }[] = [
    ...overdue.map(t => ({ key: 't' + t.id, node: <><Badge tone="bad">Lewat deadline</Badge> {t.title} <span className="text-muted">· {fmtDate(t.due_date)}</span></> })),
    ...dueSoon.map(b => ({ key: 'b' + b.id, node: <><Badge tone="warn">Jatuh tempo</Badge> {b.item} <span className="text-muted">· sisa {rp(eff(b) - (b.paid ?? 0))} · {fmtDate(b.due_date)}</span></> })),
    ...undecided.map(n => ({ key: 'n' + n.id, node: <><Badge tone="muted">Belum diputuskan</Badge> {n.title} <a href="#komparasi" className="text-accent underline">lihat komparasi</a></> })),
  ];

  const bought = items.filter(i => i.status !== 'belum').length + sereh.filter(i => i.status !== 'belum').length;
  const hadir = guests.filter(g => g.rsvp === 'hadir');
  const paxAll = guests.reduce((a, g) => a + (g.pax ?? 1), 0);
  const paxHadir = hadir.reduce((a, g) => a + (g.pax ?? 1), 0);

  const BudgetBox = ({ title, tone, b }: { title: string; tone: 'lam' | 'wed'; b: ReturnType<typeof evBudget> }) => {
    const limit = b.target || b.plan;
    const over = b.target > 0 && b.real > b.target;
    return (
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between"><Badge tone={tone}>{title}</Badge><a href="#budget" className="text-xs text-accent underline">Rincian</a></div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-xs text-muted">Rencana</div><div className="tnum text-lg font-semibold">{rpShort(b.plan)}</div></div>
          <div><div className="text-xs text-muted">Realisasi</div><div className={`tnum text-lg font-semibold ${over ? 'text-bad' : ''}`}>{rpShort(b.real)}</div></div>
          <div><div className="text-xs text-muted">Sudah bayar</div><div className="tnum text-lg font-semibold">{rpShort(b.paid)}</div></div>
        </div>
        <div className="mt-3"><Progress value={pct(b.paid, limit)} tone={over ? 'bad' : 'accent'} /></div>
        <div className="mt-1.5 text-xs text-muted">
          {b.target > 0 ? <>Target {rpShort(b.target)} · {over ? `lebih ${rpShort(b.real - b.target)}` : `sisa ${rpShort(b.target - b.real)}`}</> : <>Target budget belum diisi (<a href="#pengaturan" className="underline">Pengaturan</a>)</>}
        </div>
      </Card>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl" style={{ textWrap: 'balance' }}>
          {s.groom_name && s.bride_name ? `${s.groom_name} & ${s.bride_name}` : 'Rencana lamaran & pernikahan'}
        </h1>
        <p className="mt-1 text-sm text-muted">Ringkasan persiapan. Data diperbarui otomatis saat halaman dibuka.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Countdown label="Lamaran" tone="lam" date={s.date_lamaran} place={s.loc_lamaran} />
        <Countdown label="Akad nikah" tone="wed" date={s.date_akad} place={s.loc_akad} />
      </div>

      <h2 className="mb-2 mt-8 text-sm font-semibold text-muted">Kemajuan persiapan</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressCard title="To-do" done={tasks.filter(t => t.status === 'done').length} total={tasks.length} href="#kebutuhan" />
        <ProgressCard title="Dokumen KUA" done={docs.filter(d => d.status === 'selesai').length} total={docs.length} href="#kebutuhan" />
        <ProgressCard title="Barang & seserahan" done={bought} total={items.length + sereh.length} href="#kebutuhan" unit="dibeli" />
        <ProgressCard title="Undangan terkirim" done={guests.filter(g => g.sent).length} total={guests.length} href="#tamu" unit="terkirim" />
      </div>

      <h2 className="mb-2 mt-8 text-sm font-semibold text-muted">Budget</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <BudgetBox title="Lamaran" tone="lam" b={bl} />
        <BudgetBox title="Wedding" tone="wed" b={bw} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Perlu perhatian</h2>
          {attention.length === 0 ? <p className="text-sm text-muted">Tidak ada yang mendesak.</p> : (
            <ul className="flex flex-col gap-2 text-sm">
              {attention.slice(0, 8).map(a => <li key={a.key}>{a.node}</li>)}
              {attention.length > 8 && <li className="text-muted">+{attention.length - 8} lainnya</li>}
            </ul>
          )}
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Tamu</h2><a href="#tamu" className="text-xs text-accent underline">Kelola</a></div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div><div className="text-xs text-muted">Diundang</div><div className="tnum text-xl font-semibold">{guests.length}</div><div className="tnum text-xs text-muted">{paxAll} pax</div></div>
            <div><div className="text-xs text-muted">Hadir</div><div className="tnum text-xl font-semibold text-good">{hadir.length}</div><div className="tnum text-xs text-muted">{paxHadir} pax</div></div>
            <div><div className="text-xs text-muted">Belum jawab</div><div className="tnum text-xl font-semibold">{guests.filter(g => g.rsvp === 'belum' || !g.rsvp).length}</div></div>
          </div>
          {s.guests_wedding && <p className="mt-3 text-xs text-muted">Target tamu wedding {s.guests_wedding} orang{s.guests_lamaran ? `, lamaran ${s.guests_lamaran} orang` : ''}.</p>}
        </Card>
      </div>
    </div>
  );
}
