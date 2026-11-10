import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, useSettings } from '../api';
import { askConfirm, Button, Card, FieldWrap, MoneyInput, PageHeader } from '../ui';

const EXPORTS: [string, string][] = [
  ['guests', 'Daftar tamu'], ['budget_items', 'Budget'], ['vendors', 'Vendor'], ['items', 'Barang'],
  ['seserahan', 'Seserahan'], ['documents', 'Dokumen KUA'], ['tasks', 'To-do'], ['rundown', 'Rundown'],
  ['compare_candidates', 'Kandidat komparasi'], ['concepts', 'Opsi konsep'],
];

export function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useSettings();
  const [v, setV] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  useEffect(() => { if (data) setV(data); }, [data]);
  const set = (k: string, val: string | number | null) => setV(p => ({ ...p, [k]: val == null ? '' : String(val) }));
  const text = (k: string, label: string, type = 'text') => (
    <FieldWrap label={label}><input type={type} className="field" value={v[k] ?? ''} onChange={e => set(k, e.target.value)} /></FieldWrap>
  );

  const save = async () => {
    await api('/api/settings', { method: 'PUT', body: v });
    await qc.invalidateQueries({ queryKey: ['settings'] });
    setMsg('Pengaturan tersimpan.');
  };
  const clearExamples = async () => {
    if (!(await askConfirm('Hapus semua data contoh (ditandai "contoh") di seluruh halaman? Data yang sudah kamu ubah atau tambah sendiri tidak ikut terhapus.'))) return;
    await api('/api/examples', { method: 'DELETE' });
    await qc.invalidateQueries();
    setMsg('Data contoh dihapus.');
  };

  if (isLoading) return <p className="text-muted">Memuat…</p>;
  return (
    <div>
      <PageHeader title="Pengaturan" sub="Nama, tanggal, lokasi, dan target budget. Semua boleh diisi belakangan." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Pasangan</h2>
          <div className="grid gap-3 sm:grid-cols-2">{text('groom_name', 'Nama mempelai pria')}{text('bride_name', 'Nama mempelai wanita')}</div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Tanggal & lokasi</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {text('date_lamaran', 'Tanggal lamaran', 'date')}{text('loc_lamaran', 'Lokasi lamaran')}
            {text('date_akad', 'Tanggal akad nikah', 'date')}{text('loc_akad', 'Lokasi akad')}
            {text('date_resepsi', 'Tanggal resepsi', 'date')}{text('loc_resepsi', 'Lokasi resepsi')}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Target budget</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldWrap label="Budget lamaran"><MoneyInput value={v.budget_lamaran ? Number(v.budget_lamaran) : null} onChange={n => set('budget_lamaran', n)} /></FieldWrap>
            <FieldWrap label="Budget wedding"><MoneyInput value={v.budget_wedding ? Number(v.budget_wedding) : null} onChange={n => set('budget_wedding', n)} /></FieldWrap>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Target jumlah tamu</h2>
          <div className="grid gap-3 sm:grid-cols-2">{text('guests_lamaran', 'Tamu lamaran', 'number')}{text('guests_wedding', 'Tamu wedding', 'number')}</div>
        </Card>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button variant="primary" onClick={save}>Simpan pengaturan</Button>
        {msg && <span role="status" className="text-sm text-good">{msg}</span>}
      </div>

      <Card className="mt-8 p-4">
        <h2 className="mb-1 text-sm font-semibold">Export data (CSV)</h2>
        <p className="mb-3 text-sm text-muted">Bisa dibuka di Excel atau Google Sheets, misalnya untuk dikirim ke WO atau keluarga.</p>
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map(([t, l]) => <a key={t} href={`/api/export/${t}.csv`} className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-sunken">⬇ {l}</a>)}
        </div>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="mb-1 text-sm font-semibold">Data contoh</h2>
        <p className="mb-3 text-sm text-muted">Template awal (to-do, dokumen KUA, rundown, dll.) ditandai "contoh". Hapus semuanya kalau sudah tidak diperlukan, atau ubah satu per satu.</p>
        <Button variant="danger" onClick={clearExamples}>Hapus semua data contoh</Button>
      </Card>
    </div>
  );
}
