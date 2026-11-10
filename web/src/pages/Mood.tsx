import { DragEvent, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Row, useRows, useTable } from '../api';
import { EVENTS, MOOD_CATS, NOTE_CATS } from '../constants';
import { DataTable, FieldDef, RowForm } from '../DataTable';
import { askConfirm, Badge, Button, Card, Empty, ExampleTag, Modal, PageHeader, SelectInput, Tabs } from '../ui';

const makePhotoFields = (candOptions: { value: string; label: string }[]): FieldDef[] => [
  { key: 'title', label: 'Judul', required: true },
  { key: 'category', label: 'Kategori', type: 'select', options: MOOD_CATS.map(v => ({ value: v, label: v })) },
  { key: 'event', label: 'Acara', type: 'select', options: EVENTS },
  { key: 'candidate_id', label: 'Tautkan ke kandidat komparasi (opsional)', type: 'select', options: candOptions },
  { key: 'link', label: 'Link sumber', type: 'url' },
  { key: 'note', label: 'Catatan', type: 'textarea' },
  { key: 'favorite', label: 'Favorit', type: 'bool' },
];
const paletteFields: FieldDef[] = [
  { key: 'name', label: 'Nama warna', required: true },
  { key: 'hex', label: 'Kode warna', type: 'color', required: true },
];
const noteFields: FieldDef[] = [
  { key: 'title', label: 'Judul', required: true },
  { key: 'category', label: 'Kategori', type: 'select', options: NOTE_CATS.map(v => ({ value: v, label: v })) },
  { key: 'body', label: 'Isi', type: 'textarea' },
  { key: 'link', label: 'Link', type: 'url' },
];

function Palette() {
  const rows = useRows('palette').data ?? [];
  const t = useTable('palette');
  const [editing, setEditing] = useState<Row | null>(null);
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Palet warna tema</h2>
        <Button size="sm" onClick={() => setEditing({ id: 0, hex: '#6f8fb0' })}>＋ Warna</Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Belum ada warna. Simpan warna tema supaya vendor dan keluarga punya acuan yang sama.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {rows.map(r => (
            <button key={r.id} onClick={() => setEditing(r)} className="group w-28 text-left" aria-label={`Ubah warna ${r.name}`}>
              <span className="block h-14 rounded-lg border border-line" style={{ background: r.hex }} />
              <span className="mt-1 block truncate text-xs font-medium">{r.name}{r.is_example ? <ExampleTag /> : null}</span>
              <span className="block text-xs text-muted">{r.hex}</span>
            </button>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Ubah warna' : 'Tambah warna'}>
        {editing && (
          <RowForm
            key={editing.id} fields={paletteFields} initial={editing} onCancel={() => setEditing(null)}
            onSubmit={v => {
              const { id, ...r } = v;
              if (id) t.edit.mutate({ id, ...r }, { onSuccess: () => setEditing(null) });
              else t.add.mutate(r, { onSuccess: () => setEditing(null) });
            }}
            onDelete={editing.id ? () => t.remove.mutate(editing.id, { onSuccess: () => setEditing(null) }) : undefined}
          />
        )}
      </Modal>
    </section>
  );
}

function Moodboard() {
  const qc = useQueryClient();
  const q = useRows('moodboard');
  const t = useTable('moodboard');
  const photos = q.data ?? [];
  const needs = useRows('compare_needs').data ?? [];
  const cands = useRows('compare_candidates').data ?? [];
  const candLabel = (id: unknown) => {
    const c = cands.find(x => x.id === Number(id));
    if (!c) return null;
    return `${needs.find(n => n.id === c.need_id)?.title ?? ''} · ${c.name}`.replace(/^ · /, '');
  };
  const photoFields = useMemo(
    () => makePhotoFields(cands.map(c => ({ value: String(c.id), label: candLabel(c.id) ?? c.name }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cands, needs]
  );
  const input = useRef<HTMLInputElement>(null);
  const [cat, setCat] = useState('');
  const [ev, setEv] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [upCat, setUpCat] = useState('Dekorasi');
  const [upEv, setUpEv] = useState('wedding');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [drag, setDrag] = useState(false);
  const [view, setView] = useState<Row | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);

  const list = photos.filter(p => (!cat || p.category === cat) && (!ev || p.event === ev) && (!favOnly || p.favorite));

  const upload = async (files: FileList | File[]) => {
    const imgs = [...files].filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { setMsg('Pilih file gambar (JPG, PNG, WebP, HEIC).'); return; }
    setBusy(true); setMsg('');
    let ok = 0, fail = 0;
    for (const f of imgs) {
      const fd = new FormData();
      fd.append('file', f); fd.append('category', upCat); fd.append('event', upEv);
      try {
        const res = await fetch('/api/upload/moodboard', { method: 'POST', body: fd, credentials: 'same-origin' });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
    }
    setBusy(false);
    setMsg(`${ok} foto terunggah${fail ? `, ${fail} gagal (file terlalu besar atau bukan gambar)` : ''}.`);
    qc.invalidateQueries({ queryKey: ['moodboard'] });
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); };

  return (
    <section>
      <Card
        className={`mb-4 border-dashed p-4 ${drag ? 'border-accent bg-accent-soft' : ''}`}
      >
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[10rem]">
            <span className="mb-1 block text-xs font-medium text-muted">Kategori foto</span>
            <SelectInput id="upcat" value={upCat} onChange={setUpCat} options={MOOD_CATS.map(v => ({ value: v, label: v }))} blank="Lainnya" />
          </div>
          <div className="min-w-[10rem]">
            <span className="mb-1 block text-xs font-medium text-muted">Acara</span>
            <SelectInput id="upev" value={upEv} onChange={setUpEv} options={EVENTS} blank="Keduanya" />
          </div>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files) upload(e.target.files); e.target.value = ''; }} />
          <Button variant="primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Mengunggah…' : '⬆ Unggah foto'}</Button>
          <span className="text-xs text-muted">Bisa pilih banyak sekaligus{' '}atau seret foto ke sini. Foto diperkecil otomatis.</span>
        </div>
        {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
      </Card>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select aria-label="Kategori" className="field w-auto" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">Kategori: semua</option>
          {MOOD_CATS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Acara" className="field w-auto" value={ev} onChange={e => setEv(e.target.value)}>
          <option value="">Acara: semua</option>
          {EVENTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="size-4 accent-[var(--color-accent)]" checked={favOnly} onChange={e => setFavOnly(e.target.checked)} /> Favorit saja</label>
        <span className="text-sm text-muted">{list.length} foto</span>
      </div>

      {q.isLoading ? <Empty title="Memuat…" /> : list.length === 0 ? (
        <Card><Empty title={photos.length ? 'Tidak ada foto yang cocok' : 'Moodboard masih kosong'} hint={photos.length ? 'Ubah filter di atas.' : 'Unggah foto inspirasi dekorasi, busana, venue, dan lainnya.'} /></Card>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {list.map(p => (
            <figure key={p.id} className="relative mb-3 break-inside-avoid overflow-hidden rounded-xl border border-line bg-surface">
              <button onClick={() => setView(p)} className="block w-full" aria-label={`Buka ${p.title}`}>
                <img src={`/uploads/${p.thumb}`} alt={p.title} loading="lazy" className="block w-full" />
              </button>
              <button
                onClick={() => t.edit.mutate({ id: p.id, favorite: p.favorite ? 0 : 1 })}
                aria-label={p.favorite ? 'Hapus dari favorit' : 'Tandai favorit'} aria-pressed={!!p.favorite}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/45 text-lg text-white backdrop-blur hover:bg-black/65"
              >{p.favorite ? '♥' : '♡'}</button>
              <figcaption className="px-2.5 py-2">
                <div className="truncate text-sm font-medium">{p.title}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.category && <Badge>{p.category}</Badge>}
                  {EVENTS.filter(e => e.value === p.event).map(e => <Badge key={e.value} tone={e.tone}>{e.label}</Badge>)}
                </div>
                {candLabel(p.candidate_id) && (
                  <a href="#komparasi" className="mt-1.5 block truncate text-xs text-accent underline" title="Lihat di Komparasi">⇄ {candLabel(p.candidate_id)}</a>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} title={view?.title ?? ''} wide>
        {view && (
          <div>
            <img src={`/uploads/${view.file}`} alt={view.title} className="mx-auto max-h-[60vh] w-auto max-w-full rounded-lg" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {view.category && <Badge>{view.category}</Badge>}
              {EVENTS.filter(e => e.value === view.event).map(e => <Badge key={e.value} tone={e.tone}>{e.label}</Badge>)}
              {candLabel(view.candidate_id) && <a href="#komparasi" className="text-sm text-accent underline">⇄ {candLabel(view.candidate_id)}</a>}
              {view.link && <a href={view.link} target="_blank" rel="noreferrer noopener" className="text-sm text-accent underline">Sumber</a>}
            </div>
            {view.note && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{view.note}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={() => { setEditing(view); setView(null); }}>Ubah info</Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Ubah foto">
        {editing && (
          <RowForm
            key={editing.id} fields={photoFields} initial={editing} onCancel={() => setEditing(null)}
            onSubmit={v => { const { id, ...r } = v; t.edit.mutate({ id, ...r }, { onSuccess: () => setEditing(null) }); }}
            onDelete={() => { askConfirm('Hapus foto ini? Tindakan ini tidak bisa dibatalkan.').then(ok => { if (ok) t.remove.mutate(editing.id, { onSuccess: () => setEditing(null) }); }); }}
          />
        )}
      </Modal>
    </section>
  );
}

export function Mood() {
  const [tab, setTab] = useState('foto');
  const notes = useRows('notes');
  return (
    <div>
      <PageHeader title="Moodboard & catatan" sub="Kumpulkan foto inspirasi, warna tema, dan catatan ide." />
      <Palette />
      <Tabs tabs={[{ value: 'foto', label: 'Moodboard foto' }, { value: 'catatan', label: 'Catatan & ide', count: notes.data?.length }]} value={tab} onChange={setTab} />
      {tab === 'foto' ? <Moodboard /> : (
        <DataTable
          table="notes" fields={noteFields} rows={notes.data ?? []} loading={notes.isLoading} entity="catatan" addLabel="Tambah catatan"
          emptyTitle="Belum ada catatan" emptyHint="Tulis ide tema, daftar hal yang dihindari, atau link inspirasi."
        />
      )}
    </div>
  );
}
