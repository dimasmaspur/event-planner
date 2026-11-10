import { useMemo, useState } from 'react';
import { useRows } from '../api';
import { GUEST_CATS, INV_TYPES, INVITED_TO, RSVP, SIDES } from '../constants';
import { DataTable, FieldDef } from '../DataTable';
import { Card, ExportButton, PageHeader } from '../ui';

const fields: FieldDef[] = [
  { key: 'name', label: 'Nama', required: true },
  { key: 'phone', label: 'No. HP' },
  { key: 'side', label: 'Pihak', type: 'select', options: SIDES },
  { key: 'category', label: 'Kategori', type: 'select', options: GUEST_CATS },
  { key: 'invited_to', label: 'Diundang ke', type: 'select', options: INVITED_TO },
  { key: 'invitation_type', label: 'Jenis undangan', type: 'select', options: INV_TYPES },
  { key: 'sent', label: 'Terkirim', type: 'bool' },
  { key: 'rsvp', label: 'RSVP', type: 'select', options: RSVP },
  { key: 'pax', label: 'Pax', type: 'int', min: '1', align: 'right' },
  { key: 'note', label: 'Catatan', type: 'textarea', hideInTable: true },
];

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select aria-label={label} className="field w-auto" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{label}: semua</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Guests() {
  const q = useRows('guests');
  const all = q.data ?? [];
  const [search, setSearch] = useState('');
  const [f, setF] = useState({ side: '', category: '', invited_to: '', rsvp: '' });
  const rows = useMemo(() => all.filter(g =>
    (!search || `${g.name} ${g.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())) &&
    (!f.side || g.side === f.side) && (!f.category || g.category === f.category) &&
    (!f.rsvp || (g.rsvp ?? 'belum') === f.rsvp) &&
    (!f.invited_to || g.invited_to === f.invited_to || g.invited_to === 'keduanya')
  ), [all, search, f]);

  const pax = (r: typeof all) => r.reduce((a, g) => a + (g.pax ?? 1), 0);
  const forEv = (ev: string) => all.filter(g => g.invited_to === ev || g.invited_to === 'keduanya');
  const stats = [
    { label: 'Lamaran', g: forEv('lamaran') }, { label: 'Wedding', g: forEv('wedding') },
  ];
  const byCat = GUEST_CATS.map(c => ({ c: c.label, n: all.filter(g => g.category === c.value).length })).filter(x => x.n);

  return (
    <div>
      <PageHeader title="Daftar tamu" sub="Kelola undangan, status pengiriman, dan konfirmasi kehadiran." actions={<ExportButton table="guests" />} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label} className="p-4">
            <div className="text-xs text-muted">{s.label}</div>
            <div className="tnum text-2xl font-semibold">{s.g.length} <span className="text-sm font-normal text-muted">tamu · {pax(s.g)} pax</span></div>
            <div className="tnum mt-0.5 text-xs text-muted">Hadir {s.g.filter(g => g.rsvp === 'hadir').length} · terkirim {s.g.filter(g => g.sent).length}</div>
          </Card>
        ))}
        <Card className="p-4">
          <div className="text-xs text-muted">Pihak</div>
          <div className="tnum text-lg font-semibold">Pria {all.filter(g => g.side === 'Pria').length} · Wanita {all.filter(g => g.side === 'Wanita').length}</div>
          <div className="tnum mt-0.5 text-xs text-muted">{pax(all.filter(g => g.side === 'Pria'))} pax · {pax(all.filter(g => g.side === 'Wanita'))} pax</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted">Per kategori</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm">{byCat.length ? byCat.map(x => <span key={x.c}>{x.c} <b className="tnum">{x.n}</b></span>) : <span className="text-muted">–</span>}</div>
        </Card>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <input type="search" aria-label="Cari tamu" placeholder="Cari nama atau HP…" className="field min-w-0 flex-1 sm:max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
        <Filter label="Pihak" value={f.side} onChange={v => setF({ ...f, side: v })} options={SIDES} />
        <Filter label="Kategori" value={f.category} onChange={v => setF({ ...f, category: v })} options={GUEST_CATS} />
        <Filter label="Acara" value={f.invited_to} onChange={v => setF({ ...f, invited_to: v })} options={INVITED_TO.filter(o => o.value !== 'keduanya')} />
        <Filter label="RSVP" value={f.rsvp} onChange={v => setF({ ...f, rsvp: v })} options={RSVP} />
      </div>
      <DataTable
        table="guests" fields={fields} rows={rows} loading={q.isLoading} entity="tamu" addLabel="Tambah tamu"
        defaults={{ side: 'Pria', category: 'Keluarga', invited_to: 'wedding', invitation_type: 'Digital', sent: 0, rsvp: 'belum', pax: 1 }}
        title={`${rows.length} dari ${all.length} tamu · ${pax(rows)} pax`}
        emptyTitle={all.length ? 'Tidak ada tamu yang cocok' : 'Belum ada tamu'} emptyHint={all.length ? 'Ubah kata kunci atau filter.' : 'Tambahkan tamu pertama, atau mulai dari keluarga inti.'}
      />
    </div>
  );
}
