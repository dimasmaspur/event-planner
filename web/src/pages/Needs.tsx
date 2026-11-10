import { useState } from 'react';
import { Row, useRows } from '../api';
import { DOC_FOR, DOC_STATUS, EVENTS, ITEM_STATUS, OWNERS, SEREH_FOR, TASK_STATUS, VENDOR_STATUS, BUDGET_CATS } from '../constants';
import { DataTable, FieldDef } from '../DataTable';
import { Badge, ExportButton, PageHeader, rp, Segmented, Tabs, todayStr } from '../ui';

const taskFields: FieldDef[] = [
  { key: 'title', label: 'Tugas', required: true },
  { key: 'event', label: 'Acara', type: 'select', options: EVENTS, inline: false },
  { key: 'due_date', label: 'Deadline', type: 'date', hideInTable: true },
  { key: 'due_view', label: 'Deadline', hideInForm: true, render: r => {
    if (!r.due_date) return <span className="text-muted">{r.note?.startsWith('H-') ? r.note : '–'}</span>;
    const late = r.status !== 'done' && r.due_date < todayStr();
    return <span className={`whitespace-nowrap ${late ? 'font-medium text-bad' : ''}`}>{new Date(r.due_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}{late ? ' ⚠' : ''}</span>;
  } },
  { key: 'owner', label: 'PIC', type: 'select', options: OWNERS },
  { key: 'status', label: 'Status', type: 'select', options: TASK_STATUS },
  { key: 'note', label: 'Catatan / acuan waktu', type: 'textarea', hideInTable: true },
];
// kolom deadline di form tetap tipe date
const taskForm = taskFields;

const vendorFields: FieldDef[] = [
  { key: 'category', label: 'Kategori', suggestions: BUDGET_CATS, required: true },
  { key: 'name', label: 'Nama vendor', required: true },
  { key: 'event', label: 'Acara', type: 'select', options: EVENTS, inline: false },
  { key: 'package', label: 'Paket' },
  { key: 'price', label: 'Harga', type: 'money', align: 'right' },
  { key: 'contact', label: 'Kontak (HP / IG)' },
  { key: 'status', label: 'Status booking', type: 'select', options: VENDOR_STATUS },
  { key: 'note', label: 'Catatan', type: 'textarea', hideInTable: true },
];

const itemFields: FieldDef[] = [
  { key: 'name', label: 'Barang', required: true },
  { key: 'event', label: 'Acara', type: 'select', options: EVENTS, inline: false },
  { key: 'qty', label: 'Jumlah', type: 'int', min: '1', align: 'right' },
  { key: 'unit_price', label: 'Harga satuan', type: 'money', align: 'right' },
  { key: 'total', label: 'Total', align: 'right', hideInForm: true, render: r => <span className="tnum">{rp((r.qty ?? 1) * (r.unit_price ?? 0))}</span> },
  { key: 'store', label: 'Toko' },
  { key: 'link', label: 'Link', type: 'url' },
  { key: 'status', label: 'Status', type: 'select', options: ITEM_STATUS },
  { key: 'note', label: 'Catatan', type: 'textarea', hideInTable: true },
];

const serehFields: FieldDef[] = [
  { key: 'name', label: 'Item', required: true },
  { key: 'event', label: 'Acara', type: 'select', options: EVENTS, inline: false },
  { key: 'for_whom', label: 'Untuk', type: 'select', options: SEREH_FOR, inline: false },
  { key: 'estimate', label: 'Estimasi', type: 'money', align: 'right' },
  { key: 'status', label: 'Status', type: 'select', options: ITEM_STATUS },
  { key: 'note', label: 'Catatan', type: 'textarea', hideInTable: true },
];

const docFields: FieldDef[] = [
  { key: 'name', label: 'Berkas', required: true },
  { key: 'for_whom', label: 'Untuk', type: 'select', options: DOC_FOR, inline: false },
  { key: 'status', label: 'Status', type: 'select', options: DOC_STATUS },
  { key: 'note', label: 'Catatan', type: 'textarea' },
];

function Section({ table, fields, entity, addLabel, hint, evFilter = true, extra }: {
  table: string; fields: FieldDef[]; entity: string; addLabel: string; hint: string; evFilter?: boolean; extra?: (rows: Row[]) => React.ReactNode;
}) {
  const [ev, setEv] = useState('semua');
  const q = useRows(table);
  const all = q.data ?? [];
  const rows = ev === 'semua' || !evFilter ? all : all.filter(r => r.event === ev);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {evFilter ? <Segmented value={ev} onChange={setEv} options={[{ value: 'semua', label: 'Semua' }, ...EVENTS.map(e => ({ value: e.value, label: e.label }))]} /> : <span />}
        <ExportButton table={table} />
      </div>
      {extra?.(rows)}
      <DataTable
        table={table} fields={fields} rows={rows} loading={q.isLoading} entity={entity} addLabel={addLabel}
        defaults={evFilter && ev !== 'semua' ? { event: ev } : evFilter ? { event: 'wedding' } : {}}
        emptyTitle={`Belum ada ${entity}`} emptyHint={hint}
      />
    </div>
  );
}

export function Needs() {
  const [tab, setTab] = useState('todo');
  const counts = {
    todo: useRows('tasks').data, vendor: useRows('vendors').data, barang: useRows('items').data,
    sereh: useRows('seserahan').data, dok: useRows('documents').data,
  };
  const tabs = [
    { value: 'todo', label: 'To-do', count: counts.todo?.length },
    { value: 'vendor', label: 'Vendor', count: counts.vendor?.length },
    { value: 'barang', label: 'Barang', count: counts.barang?.length },
    { value: 'sereh', label: 'Seserahan & mahar', count: counts.sereh?.length },
    { value: 'dok', label: 'Dokumen KUA', count: counts.dok?.length },
  ];
  return (
    <div>
      <PageHeader title="Kebutuhan acara" sub="Tugas, vendor, barang belanjaan, seserahan, dan berkas administrasi." />
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'todo' && <Section table="tasks" fields={taskForm} entity="tugas" addLabel="Tambah tugas" hint="Tambahkan tugas persiapan beserta deadline dan penanggung jawabnya." />}
      {tab === 'vendor' && <Section table="vendors" fields={vendorFields} entity="vendor" addLabel="Tambah vendor" hint="Simpan vendor yang sudah dipilih. Kandidat yang masih dibandingkan ada di menu Komparasi." />}
      {tab === 'barang' && <Section table="items" fields={itemFields} entity="barang" addLabel="Tambah barang" hint="Catat barang yang perlu dibeli, misalnya undangan, souvenir, atau dekorasi kecil." />}
      {tab === 'sereh' && (
        <Section
          table="seserahan" fields={serehFields} entity="seserahan" addLabel="Tambah seserahan" hint="Daftar seserahan dan hantaran. Mahar dicatat di Budget." evFilter
          extra={rows => <p className="mb-3 text-sm text-muted">Total estimasi tampilan ini: <b className="tnum text-ink">{rp(rows.reduce((a, r) => a + (r.estimate ?? 0), 0))}</b> · <Badge tone="good">{rows.filter(r => r.status !== 'belum').length}</Badge> dari {rows.length} sudah dibeli</p>}
        />
      )}
      {tab === 'dok' && (
        <Section
          table="documents" fields={docFields} entity="berkas" addLabel="Tambah berkas" evFilter={false}
          hint="Daftar berkas untuk KUA. Syarat bisa berbeda tiap KUA, jadi cek ke KUA setempat."
          extra={rows => <p className="mb-3 text-sm text-muted">{rows.filter(r => r.status === 'selesai').length} dari {rows.length} berkas selesai. Syarat dapat berbeda di tiap KUA, pastikan ke KUA setempat.</p>}
        />
      )}
    </div>
  );
}
