import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Row, useRows, useTable } from '../api';
import { BUDGET_CATS, EVENTS } from '../constants';
import { DataTable, FieldDef, RowForm } from '../DataTable';
import { askConfirm, Badge, Button, Card, Empty, ExampleTag, Modal, PageHeader, rp, Tabs } from '../ui';

const needFields: FieldDef[] = [
  { key: 'title', label: 'Kebutuhan (misal: Katering resepsi)', required: true },
  { key: 'category', label: 'Kategori budget', suggestions: BUDGET_CATS },
  { key: 'event', label: 'Acara', type: 'select', options: EVENTS },
  { key: 'note', label: 'Catatan', type: 'textarea' },
];
const candFields: FieldDef[] = [
  { key: 'name', label: 'Nama kandidat', required: true },
  { key: 'price', label: 'Harga', type: 'money' },
  { key: 'rating', label: 'Rating (0–5)', type: 'real' },
  { key: 'details', label: 'Paket / detail', type: 'textarea' },
  { key: 'contact', label: 'Kontak' },
  { key: 'link', label: 'Link', type: 'url' },
  { key: 'pros', label: 'Kelebihan', type: 'textarea' },
  { key: 'cons', label: 'Kekurangan', type: 'textarea' },
  { key: 'note', label: 'Catatan', type: 'textarea' },
];
const ROWS: { key: string; label: string; fmt?: (c: Row) => React.ReactNode }[] = [
  { key: 'price', label: 'Harga', fmt: c => (c.price == null ? '–' : rp(c.price)) },
  { key: 'rating', label: 'Rating', fmt: c => (c.rating == null ? '–' : `★ ${c.rating}`) },
  { key: 'details', label: 'Paket / detail' },
  { key: 'pros', label: 'Kelebihan' },
  { key: 'cons', label: 'Kekurangan' },
  { key: 'contact', label: 'Kontak' },
  { key: 'link', label: 'Link', fmt: c => (c.link ? <a className="text-accent underline" href={c.link} target="_blank" rel="noreferrer noopener">Buka</a> : '–') },
  { key: 'note', label: 'Catatan' },
];

function PhotoPicker({ cand, photos, onClose }: { cand: Row | null; photos: Row[]; onClose: () => void }) {
  const t = useTable('moodboard');
  const needs = useRows('compare_needs').data ?? [];
  const allCands = useRows('compare_candidates').data ?? [];
  const nameOf = (id: number) => {
    const c = allCands.find(x => x.id === id);
    return c ? `${needs.find(n => n.id === c.need_id)?.title ?? ''} · ${c.name}` : '';
  };
  return (
    <Modal open={!!cand} onClose={onClose} title={cand ? `Foto untuk ${cand.name}` : ''} wide>
      {cand && (
        photos.length === 0 ? (
          <Empty title="Moodboard masih kosong" hint="Unggah foto dulu di menu Moodboard & catatan, lalu tautkan di sini." action={<a href="#moodboard" className="text-sm text-accent underline" onClick={onClose}>Buka Moodboard</a>} />
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">Klik foto untuk menautkan atau melepas. Satu foto hanya bisa ditautkan ke satu kandidat.</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {photos.map(p => {
                const mine = p.candidate_id === cand.id;
                const other = p.candidate_id && !mine ? nameOf(p.candidate_id) : '';
                return (
                  <button
                    key={p.id} type="button" aria-pressed={mine} disabled={t.edit.isPending}
                    onClick={() => t.edit.mutate({ id: p.id, candidate_id: mine ? null : cand.id })}
                    className={`relative overflow-hidden rounded-lg border-2 text-left ${mine ? 'border-accent' : 'border-line'}`}
                  >
                    <img src={`/uploads/${p.thumb}`} alt={p.title} loading="lazy" className="aspect-square w-full object-cover" />
                    {mine && <span className="absolute right-1 top-1 rounded-full bg-accent px-1.5 text-xs text-accent-fg">✓</span>}
                    <span className="block truncate px-1.5 py-1 text-xs">{p.title}</span>
                    {other && <span className="block truncate px-1.5 pb-1 text-[10px] text-muted">dipakai: {other}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )
      )}
      <div className="mt-4 flex justify-end"><Button variant="primary" onClick={onClose}>Selesai</Button></div>
    </Modal>
  );
}

function NeedCard({ need, cands }: { need: Row; cands: Row[] }) {
  const qc = useQueryClient();
  const photos = useRows('moodboard').data ?? [];
  const [pickFor, setPickFor] = useState<Row | null>(null);
  const [lightbox, setLightbox] = useState<Row | null>(null);
  const needT = useTable('compare_needs');
  const candT = useTable('compare_candidates');
  const [editNeed, setEditNeed] = useState(false);
  const [editCand, setEditCand] = useState<Row | null>(null);
  const refresh = () => qc.invalidateQueries();
  const choose = useMutation({ mutationFn: (id: number) => api(`/api/compare/candidates/${id}/choose`, { method: 'POST' }), onSuccess: refresh });
  const unchoose = useMutation({ mutationFn: (id: number) => api(`/api/compare/candidates/${id}/choose`, { method: 'DELETE' }), onSuccess: refresh });

  const prices = cands.map(c => c.price).filter((p): p is number => p != null);
  const ratings = cands.map(c => c.rating).filter((p): p is number => p != null);
  const minP = prices.length > 1 ? Math.min(...prices) : null;
  const maxR = ratings.length > 1 ? Math.max(...ratings) : null;
  const winner = cands.find(c => c.chosen);
  const ev = EVENTS.find(e => e.value === need.event);

  return (
    <Card className="mb-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-semibold">{need.title}{need.is_example ? <ExampleTag /> : null}</h2>
          {ev && <Badge tone={ev.tone}>{ev.label}</Badge>}
          {need.category && <Badge>{need.category}</Badge>}
          {winner ? <Badge tone="good">Terpilih: {winner.name}</Badge> : <Badge tone="warn">Belum diputuskan</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setEditCand({ id: 0, need_id: need.id })}>＋ Kandidat</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditNeed(true)}>Ubah</Button>
        </div>
      </div>

      {cands.length === 0 ? (
        <Empty title="Belum ada kandidat" hint="Tambahkan 2–5 kandidat untuk dibandingkan." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max table-fixed border-collapse text-left text-sm" style={{ minWidth: `${9 + cands.length * 14}rem` }}>
            <colgroup><col style={{ width: '8rem' }} />{cands.map(c => <col key={c.id} style={{ minWidth: '14rem' }} />)}</colgroup>
            <thead>
              <tr className="border-b border-line bg-sunken">
                <th className="px-3 py-2 text-xs font-medium text-muted">Kandidat</th>
                {cands.map(c => (
                  <th key={c.id} className={`px-3 py-2 align-top ${c.chosen ? 'bg-good-soft' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="break-words font-semibold">{c.name}{c.is_example ? <ExampleTag /> : null}</span>
                      <button className="shrink-0 text-xs font-normal text-muted underline" onClick={() => setEditCand(c)}>ubah</button>
                    </div>
                    <div className="mt-2">
                      {c.chosen ? (
                        <Button size="sm" variant="default" disabled={unchoose.isPending} onClick={() => unchoose.mutate(c.id)}>✓ Terpilih · batalkan</Button>
                      ) : (
                        <Button size="sm" variant="primary" disabled={choose.isPending} onClick={() => choose.mutate(c.id)}>Pilih ini</Button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <th scope="row" className="px-3 py-2 align-top text-xs font-medium text-muted">Foto inspirasi</th>
                {cands.map(c => {
                  const mine = photos.filter(p => p.candidate_id === c.id);
                  return (
                    <td key={c.id} className={`px-3 py-2 align-top ${c.chosen ? 'bg-good-soft/50' : ''}`}>
                      <div className="flex flex-wrap gap-1.5">
                        {mine.map(p => (
                          <button key={p.id} type="button" onClick={() => setLightbox(p)} aria-label={`Lihat foto ${p.title}`} className="overflow-hidden rounded-md border border-line">
                            <img src={`/uploads/${p.thumb}`} alt={p.title} loading="lazy" className="size-14 object-cover" />
                          </button>
                        ))}
                        <button type="button" onClick={() => setPickFor(c)} className="grid size-14 place-items-center rounded-md border border-dashed border-line text-xs text-muted hover:border-accent hover:text-accent">
                          {mine.length ? '＋' : <span className="px-1 text-center leading-tight">＋ foto</span>}
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
              {ROWS.map(r => (
                <tr key={r.key} className="border-b border-line last:border-0">
                  <th scope="row" className="px-3 py-2 align-top text-xs font-medium text-muted">{r.label}</th>
                  {cands.map(c => {
                    const best = (r.key === 'price' && minP != null && c.price === minP) || (r.key === 'rating' && maxR != null && c.rating === maxR);
                    return (
                      <td key={c.id} className={`px-3 py-2 align-top ${c.chosen ? 'bg-good-soft/50' : ''}`}>
                        <span className={`whitespace-pre-wrap break-words ${r.key === 'price' ? 'tnum font-semibold' : ''}`}>{r.fmt ? r.fmt(c) : (c[r.key] || '–')}</span>
                        {best && <span className="ml-1.5 align-middle"><Badge tone="good">{r.key === 'price' ? 'Termurah' : 'Tertinggi'}</Badge></span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {winner && <p className="border-t border-line bg-good-soft/40 px-4 py-2 text-xs text-muted">Pilihan ini sudah masuk ke {need.kind === 'vendor' ? 'daftar Vendor' : 'daftar Barang'} dan Budget. Membatalkan pilihan akan menghapus entri otomatis tersebut.</p>}

      <PhotoPicker cand={pickFor} photos={photos} onClose={() => setPickFor(null)} />
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title={lightbox?.title ?? ''} wide>
        {lightbox && (
          <div>
            <img src={`/uploads/${lightbox.file}`} alt={lightbox.title} className="mx-auto max-h-[65vh] w-auto max-w-full rounded-lg" />
            {lightbox.note && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{lightbox.note}</p>}
            {lightbox.link && <a href={lightbox.link} target="_blank" rel="noreferrer noopener" className="mt-2 inline-block text-sm text-accent underline">Sumber</a>}
          </div>
        )}
      </Modal>
      <Modal open={editNeed} onClose={() => setEditNeed(false)} title="Ubah kebutuhan">
        <RowForm
          key={need.id} fields={needFields} initial={need} onCancel={() => setEditNeed(false)}
          onSubmit={v => { const { id, ...r } = v; needT.edit.mutate({ id, ...r }, { onSuccess: () => setEditNeed(false) }); }}
          onDelete={() => { askConfirm(`Hapus "${need.title}" beserta semua kandidatnya?`).then(ok => { if (ok) needT.remove.mutate(need.id, { onSuccess: () => { setEditNeed(false); refresh(); } }); }); }}
        />
      </Modal>
      <Modal open={!!editCand} onClose={() => setEditCand(null)} title={editCand?.id ? 'Ubah kandidat' : 'Tambah kandidat'}>
        {editCand && (
          <RowForm
            key={editCand.id} fields={candFields} initial={editCand} onCancel={() => setEditCand(null)}
            onSubmit={v => {
              const { id, ...r } = v;
              const done = { onSuccess: () => { setEditCand(null); refresh(); } };
              // jika kandidat terpilih diubah (misal harga), sinkronkan ulang
              if (id) candT.edit.mutate({ id, ...r }, { onSuccess: () => { setEditCand(null); if (v.chosen) choose.mutate(id); else refresh(); } });
              else candT.add.mutate({ ...r, need_id: need.id, chosen: 0 }, done);
            }}
            onDelete={editCand.id ? () => { askConfirm('Hapus kandidat ini?').then(ok => { if (ok) candT.remove.mutate(editCand.id, { onSuccess: () => { setEditCand(null); refresh(); } }); }); } : undefined}
          />
        )}
      </Modal>
    </Card>
  );
}

function NeedBoard({ kind, hint, sample }: { kind: 'vendor' | 'item'; hint: string; sample: string }) {
  const needs = (useRows('compare_needs').data ?? []).filter(n => n.kind === kind);
  const cands = useRows('compare_candidates').data ?? [];
  const needT = useTable('compare_needs');
  const [adding, setAdding] = useState(false);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl text-sm text-muted">{hint}</p>
        <Button variant="primary" onClick={() => setAdding(true)}>＋ Kebutuhan baru</Button>
      </div>
      {needs.length === 0 && <Card><Empty title="Belum ada yang dibandingkan" hint={`Mulai dengan kebutuhan, misalnya "${sample}", lalu tambahkan kandidatnya.`} /></Card>}
      {needs.map(n => <NeedCard key={n.id} need={n} cands={cands.filter(c => c.need_id === n.id)} />)}
      <Modal open={adding} onClose={() => setAdding(false)} title="Kebutuhan baru">
        {adding && <RowForm fields={needFields} initial={{ id: 0, kind, event: 'wedding' }} onCancel={() => setAdding(false)} onSubmit={v => { const { id: _i, ...r } = v; needT.add.mutate({ ...r, kind }, { onSuccess: () => setAdding(false) }); }} />}
      </Modal>
    </div>
  );
}

const conceptFields: FieldDef[] = [
  { key: 'name', label: 'Opsi konsep', required: true },
  { key: 'cost', label: 'Estimasi biaya', type: 'money', align: 'right' },
  { key: 'guests', label: 'Jumlah tamu', type: 'int', align: 'right' },
  { key: 'per', label: 'Biaya / tamu', align: 'right', hideInForm: true, render: r => <span className="tnum">{r.cost && r.guests ? rp(r.cost / r.guests) : '–'}</span> },
  { key: 'location', label: 'Lokasi' },
  { key: 'duration', label: 'Durasi' },
  { key: 'pros', label: 'Kelebihan', type: 'textarea' },
  { key: 'cons', label: 'Kekurangan', type: 'textarea' },
  { key: 'chosen', label: 'Terpilih', type: 'bool' },
  { key: 'note', label: 'Catatan', type: 'textarea', hideInTable: true },
];

function EventCompare() {
  const concepts = useRows('concepts');
  const budget = useRows('budget_items').data ?? [];
  const tasks = useRows('tasks').data ?? [];
  const guests = useRows('guests').data ?? [];
  const vendors = useRows('vendors').data ?? [];
  const eff = (b: Row) => b.actual ?? b.estimate ?? 0;
  const col = (ev: 'lamaran' | 'wedding') => {
    const b = budget.filter(x => x.event === ev), t = tasks.filter(x => x.event === ev);
    const g = guests.filter(x => x.invited_to === ev || x.invited_to === 'keduanya');
    return {
      plan: b.reduce((a, x) => a + (x.estimate ?? 0), 0), real: b.reduce((a, x) => a + eff(x), 0), paid: b.reduce((a, x) => a + (x.paid ?? 0), 0),
      tasks: `${t.filter(x => x.status === 'done').length} / ${t.length}`,
      guests: g.length, pax: g.reduce((a, x) => a + (x.pax ?? 1), 0), hadir: g.filter(x => x.rsvp === 'hadir').reduce((a, x) => a + (x.pax ?? 1), 0),
      vendors: `${vendors.filter(v => v.event === ev && ['dp', 'lunas'].includes(v.status)).length} / ${vendors.filter(v => v.event === ev).length}`,
    };
  };
  const L = col('lamaran'), W = col('wedding');
  const rowsDef: [string, (c: ReturnType<typeof col>) => React.ReactNode][] = [
    ['Estimasi biaya', c => rp(c.plan)], ['Realisasi', c => rp(c.real)], ['Sudah dibayar', c => rp(c.paid)],
    ['To-do selesai', c => c.tasks], ['Vendor terbooking (DP/lunas)', c => c.vendors],
    ['Tamu diundang', c => c.guests], ['Total pax diundang', c => c.pax], ['Pax konfirmasi hadir', c => c.hadir],
  ];
  return (
    <div className="grid gap-6">
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold">Lamaran vs Wedding</h2>
        <p className="mb-3 text-sm text-muted">Ringkasan otomatis dari data Budget, To-do, Vendor, dan Tamu.</p>
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead><tr className="border-b border-line bg-sunken text-xs text-muted"><th className="px-3 py-2 font-medium" /><th className="px-3 py-2"><Badge tone="lam">Lamaran</Badge></th><th className="px-3 py-2"><Badge tone="wed">Wedding</Badge></th></tr></thead>
            <tbody>
              {rowsDef.map(([k, f]) => (
                <tr key={k} className="border-b border-line last:border-0"><th scope="row" className="px-3 py-2 text-xs font-medium text-muted">{k}</th><td className="tnum px-3 py-2">{f(L)}</td><td className="tnum px-3 py-2">{f(W)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="mb-1 font-display text-lg font-semibold">Opsi konsep acara</h2>
        <p className="mb-3 text-sm text-muted">Bandingkan beberapa gambaran acara (ukuran, tempat, biaya) sebelum memutuskan.</p>
        <DataTable
          table="concepts" fields={conceptFields} rows={concepts.data ?? []} loading={concepts.isLoading} entity="opsi konsep" addLabel="Tambah opsi"
          emptyTitle="Belum ada opsi konsep" emptyHint='Contoh: "Resepsi gedung 500 tamu" dan "Garden party 200 tamu".'
        />
      </section>
    </div>
  );
}

export function Compare() {
  const [tab, setTab] = useState('vendor');
  return (
    <div>
      <PageHeader title="Komparasi" sub="Bandingkan kandidat, pilih pemenang, dan hasilnya otomatis masuk ke daftar dan budget." />
      <Tabs tabs={[{ value: 'vendor', label: 'Vendor' }, { value: 'item', label: 'Barang' }, { value: 'acara', label: 'Acara' }]} value={tab} onChange={setTab} />
      {tab === 'vendor' && <NeedBoard kind="vendor" sample="Fotografer" hint="Masukkan beberapa vendor untuk satu kebutuhan. Saat dipilih, vendor masuk ke daftar Vendor dan harganya ke Budget." />}
      {tab === 'item' && <NeedBoard kind="item" sample="Souvenir" hint="Bandingkan barang dari beberapa toko atau model. Saat dipilih, barang masuk ke daftar Barang dan harganya ke Budget." />}
      {tab === 'acara' && <EventCompare />}
    </div>
  );
}
