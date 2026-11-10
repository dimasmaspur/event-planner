import { useState } from 'react';
import { Row, useRows, useTable } from '../api';
import { RUNDOWN_EVENTS } from '../constants';
import { DataTable, FieldDef, RowForm } from '../DataTable';
import { askConfirm, Badge, Button, Card, Empty, ExampleTag, ExportButton, Modal, PageHeader, Segmented } from '../ui';

const fields: FieldDef[] = [
  { key: 'event', label: 'Acara', type: 'select', options: RUNDOWN_EVENTS, required: true, hideInTable: true },
  { key: 'start_time', label: 'Mulai', type: 'time', required: true },
  { key: 'end_time', label: 'Selesai', type: 'time' },
  { key: 'activity', label: 'Kegiatan', required: true },
  { key: 'pic', label: 'PIC' },
  { key: 'location', label: 'Lokasi' },
  { key: 'note', label: 'Catatan', type: 'textarea' },
];

const mins = (t?: string | null) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : null);
const dur = (r: Row) => {
  const a = mins(r.start_time), b = mins(r.end_time);
  return a != null && b != null && b > a ? b - a : null;
};
const fmtDur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} j${m % 60 ? ` ${m % 60} m` : ''}` : `${m} menit`);

function Timeline({ rows, onEdit }: { rows: Row[]; onEdit: (r: Row) => void }) {
  return (
    <ol className="relative ml-1">
      {rows.map((r, i) => {
        const d = dur(r);
        const next = rows[i + 1];
        const e = mins(r.end_time), ns = next ? mins(next.start_time) : null;
        const clash = e != null && ns != null && e > ns;
        const h = Math.max(64, Math.min(180, (d ?? 15) * 1.6));
        return (
          <li key={r.id} className="grid grid-cols-[4.2rem_1.25rem_1fr] gap-x-2" style={{ minHeight: h }}>
            <div className="tnum pt-0.5 text-right text-sm font-semibold">
              {r.start_time}
              <div className="text-xs font-normal text-muted">{r.end_time ?? ''}</div>
            </div>
            <div className="relative flex justify-center">
              <span className="z-10 mt-1.5 size-3 rounded-full border-2 border-accent bg-surface" />
              {i < rows.length - 1 && <span className="absolute bottom-0 top-4 w-px bg-line" />}
            </div>
            <div className="pb-4">
              <button onClick={() => onEdit(r)} className="w-full rounded-lg border border-line bg-surface p-3 text-left hover:border-accent">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium">{r.activity}</span>
                  {r.is_example ? <ExampleTag /> : null}
                  {d && <Badge tone="accent">{fmtDur(d)}</Badge>}
                  {clash && <Badge tone="bad">Bertabrakan dengan kegiatan berikutnya</Badge>}
                </div>
                {(r.pic || r.location) && (
                  <div className="mt-1 text-xs text-muted">
                    {[r.pic && `PIC: ${r.pic}`, r.location && `Lokasi: ${r.location}`].filter(Boolean).join(' · ')}
                  </div>
                )}
                {r.note && <div className="mt-1 whitespace-pre-wrap text-xs text-muted">{r.note}</div>}
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Rundown() {
  const [ev, setEv] = useState('akad');
  const [view, setView] = useState('tabel');
  const [editing, setEditing] = useState<Row | null>(null);
  const q = useRows('rundown');
  const t = useTable('rundown');
  const rows = (q.data ?? [])
    .filter(r => r.event === ev)
    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '') || a.id - b.id);
  const first = rows[0]?.start_time;
  const last = rows.map(r => r.end_time || r.start_time || '').sort().at(-1);
  const total = mins(last) != null && mins(first) != null ? mins(last)! - mins(first)! : null;

  return (
    <div>
      <PageHeader
        title="Rundown"
        sub="Susun urutan acara per jam. Tabel dan timeline memakai data yang sama."
        actions={
          <>
            <ExportButton table="rundown" />
            <Segmented value={view} onChange={setView} options={[{ value: 'tabel', label: 'Tabel' }, { value: 'timeline', label: 'Timeline' }]} />
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={ev} onChange={setEv} options={RUNDOWN_EVENTS.map(e => ({ value: e.value, label: e.label }))} />
        {rows.length > 0 && (
          <span className="text-sm text-muted">
            {rows.length} kegiatan · {first}–{last}{total ? ` · total ${fmtDur(total)}` : ''}
          </span>
        )}
      </div>

      {view === 'tabel' ? (
        <DataTable
          table="rundown" fields={fields} rows={rows} loading={q.isLoading} entity="kegiatan" addLabel="Tambah kegiatan"
          defaults={{ event: ev }} emptyTitle="Belum ada kegiatan" emptyHint="Tambahkan kegiatan pertama beserta jamnya."
        />
      ) : (
        <>
          <div className="mb-3 flex justify-end">
            <Button variant="primary" onClick={() => setEditing({ id: 0, event: ev })}>＋ Tambah kegiatan</Button>
          </div>
          {rows.length === 0 ? (
            <Card><Empty title="Belum ada kegiatan" hint="Tambahkan kegiatan pertama beserta jamnya." /></Card>
          ) : (
            <Timeline rows={rows} onEdit={setEditing} />
          )}
        </>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Ubah kegiatan' : 'Tambah kegiatan'}>
        {editing && (
          <RowForm
            key={editing.id} fields={fields} initial={editing} onCancel={() => setEditing(null)}
            onSubmit={v => {
              const { id, ...r } = v;
              if (id) t.edit.mutate({ id, ...r }, { onSuccess: () => setEditing(null) });
              else t.add.mutate(r, { onSuccess: () => setEditing(null) });
            }}
            onDelete={editing.id ? () => { askConfirm('Hapus kegiatan ini?').then(ok => { if (ok) t.remove.mutate(editing.id, { onSuccess: () => setEditing(null) }); }); } : undefined}
          />
        )}
      </Modal>
    </div>
  );
}
