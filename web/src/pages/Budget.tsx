import { useState } from 'react';
import { Row, useRows, useSettings } from '../api';
import { BUDGET_CATS, EVENTS, SOURCES } from '../constants';
import { DataTable, FieldDef } from '../DataTable';
import { Badge, Card, ExportButton, PageHeader, Progress, rp, Segmented } from '../ui';

const eff = (b: Row) => b.actual ?? b.estimate ?? 0;

export function budgetStatus(b: Row) {
  const base = eff(b), paid = b.paid ?? 0;
  if (base > 0 && paid >= base) return { label: 'Lunas', tone: 'good' };
  if (paid > 0) return { label: 'DP', tone: 'warn' };
  return { label: 'Belum bayar', tone: 'muted' };
}

const fields: FieldDef[] = [
  { key: 'category', label: 'Kategori', suggestions: BUDGET_CATS, required: true },
  { key: 'item', label: 'Item', required: true },
  { key: 'event', label: 'Acara', type: 'select', options: EVENTS, required: true },
  { key: 'estimate', label: 'Estimasi', type: 'money', align: 'right' },
  { key: 'actual', label: 'Realisasi', type: 'money', align: 'right' },
  { key: 'paid', label: 'Sudah dibayar (DP/cicilan)', type: 'money', align: 'right' },
  { key: 'sisa', label: 'Sisa bayar', align: 'right', hideInForm: true, render: b => <span className="tnum">{rp(Math.max(0, eff(b) - (b.paid ?? 0)))}</span> },
  { key: 'due_date', label: 'Jatuh tempo', type: 'date' },
  { key: 'status', label: 'Status', hideInForm: true, render: b => { const s = budgetStatus(b); return <Badge tone={s.tone}>{s.label}</Badge>; } },
  { key: 'source', label: 'Sumber dana', type: 'select', options: SOURCES, inline: false },
  { key: 'note', label: 'Catatan', type: 'textarea', hideInTable: true },
];

function Breakdown({ title, rows, keyFn }: { title: string; rows: Row[]; keyFn: (r: Row) => string }) {
  const groups = new Map<string, { plan: number; real: number; paid: number }>();
  for (const r of rows) {
    const k = keyFn(r) || 'Belum diisi';
    const g = groups.get(k) ?? { plan: 0, real: 0, paid: 0 };
    g.plan += r.estimate ?? 0; g.real += eff(r); g.paid += r.paid ?? 0;
    groups.set(k, g);
  }
  const list = [...groups.entries()].sort((a, b) => b[1].real - a[1].real);
  const max = Math.max(1, ...list.map(([, g]) => Math.max(g.plan, g.real)));
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {list.length === 0 ? <p className="text-sm text-muted">Belum ada data.</p> : (
        <ul className="flex flex-col gap-3">
          {list.map(([k, g]) => (
            <li key={k}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">{k}</span>
                <span className="tnum shrink-0 text-xs text-muted">{rp(g.real)} <span className="opacity-60">/ rencana {rp(g.plan)}</span></span>
              </div>
              <div className="mt-1"><Progress value={(g.real / max) * 100} tone={g.real > g.plan && g.plan > 0 ? 'warn' : 'accent'} /></div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function Budget() {
  const [ev, setEv] = useState('semua');
  const q = useRows('budget_items');
  const { data: s = {} } = useSettings();
  const all = q.data ?? [];
  const rows = ev === 'semua' ? all : all.filter(r => r.event === ev);
  const sum = (f: (r: Row) => number) => rows.reduce((a, r) => a + f(r), 0);
  const plan = sum(r => r.estimate ?? 0), real = sum(eff), paid = sum(r => r.paid ?? 0);
  const target = ev === 'lamaran' ? Number(s.budget_lamaran || 0) : ev === 'wedding' ? Number(s.budget_wedding || 0) : Number(s.budget_lamaran || 0) + Number(s.budget_wedding || 0);

  return (
    <div>
      <PageHeader
        title="Budget" sub="Bandingkan estimasi dengan biaya sebenarnya, lalu catat DP dan pelunasan."
        actions={<><ExportButton table="budget_items" /><Segmented value={ev} onChange={setEv} options={[{ value: 'semua', label: 'Semua' }, ...EVENTS.map(e => ({ value: e.value, label: e.label }))]} /></>}
      />
      <Card className="mb-5 grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
        <div><div className="text-xs text-muted">Target budget</div><div className="tnum text-xl font-semibold">{target ? rp(target) : <a href="#pengaturan" className="text-sm font-normal text-accent underline">Isi di Pengaturan</a>}</div></div>
        <div><div className="text-xs text-muted">Estimasi total</div><div className="tnum text-xl font-semibold">{rp(plan)}</div></div>
        <div><div className="text-xs text-muted">Realisasi</div><div className={`tnum text-xl font-semibold ${target && real > target ? 'text-bad' : ''}`}>{rp(real)}</div><div className="text-xs text-muted">Item tanpa realisasi memakai estimasi</div></div>
        <div><div className="text-xs text-muted">Sudah dibayar</div><div className="tnum text-xl font-semibold">{rp(paid)}</div><div className="tnum text-xs text-muted">Sisa {rp(Math.max(0, real - paid))}</div></div>
      </Card>

      <DataTable
        table="budget_items" fields={fields} rows={rows} loading={q.isLoading} entity="item budget" addLabel="Tambah item"
        defaults={{ event: ev === 'semua' ? 'wedding' : ev }}
        emptyTitle="Belum ada item budget" emptyHint="Tambahkan item biaya pertama, misalnya sewa venue atau katering."
        footer={rows.length ? (
          <tfoot><tr className="border-t border-line bg-sunken font-semibold">
            <td className="px-3 py-2" colSpan={3}>Total ({rows.length} item)</td>
            <td className="tnum px-3 py-2 text-right">{rp(plan)}</td>
            <td className="tnum px-3 py-2 text-right">{rp(sum(r => r.actual ?? 0))}</td>
            <td className="tnum px-3 py-2 text-right">{rp(paid)}</td>
            <td className="tnum px-3 py-2 text-right">{rp(Math.max(0, real - paid))}</td>
            <td colSpan={4} />
          </tr></tfoot>) : null}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Breakdown title="Per kategori (realisasi)" rows={rows} keyFn={r => r.category} />
        <Breakdown title="Per sumber dana" rows={rows} keyFn={r => r.source} />
      </div>
    </div>
  );
}
