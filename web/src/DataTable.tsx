import { ReactNode, useState } from 'react';
import { Row, useTable } from './api';
import { Opt } from './constants';
import { askConfirm, Badge, Button, Empty, ExampleTag, FieldWrap, fmtDate, Modal, MoneyInput, rp, SelectInput } from './ui';

export type FieldType = 'text' | 'money' | 'int' | 'date' | 'time' | 'select' | 'textarea' | 'url' | 'bool' | 'color' | 'real';

export type FieldDef = {
  key: string;
  label: string;
  type?: FieldType;
  options?: Opt[];
  suggestions?: string[];
  required?: boolean;
  hideInTable?: boolean;
  hideInForm?: boolean;
  /** kolom turunan (tidak disimpan) */
  render?: (row: Row) => ReactNode;
  align?: 'right';
  inline?: boolean; // select/bool bisa diubah langsung di tabel
  min?: string;
};

function Cell({ f, row, onInline }: { f: FieldDef; row: Row; onInline: (patch: Record<string, unknown>) => void }) {
  if (f.render) return <>{f.render(row)}</>;
  const v = row[f.key];
  switch (f.type) {
    case 'money': return <span className="tnum">{v == null ? <span className="text-muted">–</span> : rp(v)}</span>;
    case 'date': return <span className="whitespace-nowrap">{fmtDate(v)}</span>;
    case 'select': {
      const o = f.options?.find(x => x.value === v);
      if (f.inline !== false) {
        return (
          <select
            aria-label={f.label} value={v ?? ''} onChange={e => onInline({ [f.key]: e.target.value })}
            className="cursor-pointer rounded-md border border-transparent bg-transparent py-0.5 text-sm hover:border-line focus:border-accent"
          >
            <option value="">–</option>
            {f.options?.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        );
      }
      return o ? <Badge tone={o.tone}>{o.label}</Badge> : <span className="text-muted">–</span>;
    }
    case 'bool':
      return (
        <input
          type="checkbox" aria-label={f.label} className="size-4 cursor-pointer accent-[var(--color-accent)]"
          checked={!!v} onChange={e => onInline({ [f.key]: e.target.checked ? 1 : 0 })}
        />
      );
    case 'url':
      return v ? <a href={v} target="_blank" rel="noreferrer noopener" className="text-accent underline">Buka</a> : <span className="text-muted">–</span>;
    case 'color':
      return v ? <span className="inline-flex items-center gap-1.5"><span className="size-4 rounded border border-line" style={{ background: v }} />{v}</span> : null;
    default:
      return v == null || v === '' ? <span className="text-muted">–</span> : <span className="whitespace-pre-wrap">{String(v)}</span>;
  }
}

export function RowForm({
  fields, initial, onSubmit, onCancel, onDelete, busy,
}: {
  fields: FieldDef[]; initial: Row; busy?: boolean;
  onSubmit: (v: Row) => void; onCancel: () => void; onDelete?: () => void;
}) {
  const [v, setV] = useState<Row>(initial);
  const set = (k: string, val: unknown) => setV(p => ({ ...p, [k]: val }));
  const fs = fields.filter(f => !f.render && !f.hideInForm);
  const valid = fs.every(f => !f.required || (v[f.key] != null && v[f.key] !== ''));
  return (
    <form
      onSubmit={e => { e.preventDefault(); if (valid) onSubmit(v); }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {fs.map(f => {
        const id = `f-${f.key}`;
        const wide = f.type === 'textarea' || f.key === 'title' || f.key === 'name' || f.key === 'item' || f.key === 'activity';
        let input: ReactNode;
        switch (f.type) {
          case 'money': input = <MoneyInput id={id} value={v[f.key]} onChange={x => set(f.key, x)} />; break;
          case 'select': input = <SelectInput id={id} value={v[f.key]} onChange={x => set(f.key, x)} options={f.options ?? []} />; break;
          case 'textarea': input = <textarea id={id} rows={3} className="field" value={v[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} />; break;
          case 'bool': input = <input id={id} type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={!!v[f.key]} onChange={e => set(f.key, e.target.checked ? 1 : 0)} />; break;
          case 'int': case 'real': input = <input id={id} type="number" step={f.type === 'real' ? '0.1' : '1'} min={f.min} className="field tnum" value={v[f.key] ?? ''} onChange={e => set(f.key, e.target.value === '' ? null : Number(e.target.value))} />; break;
          case 'date': input = <input id={id} type="date" className="field" value={v[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} />; break;
          case 'time': input = <input id={id} type="time" className="field" value={v[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} />; break;
          case 'color': input = (
            <div className="flex gap-2">
              <input id={id} type="color" className="h-9 w-12 cursor-pointer rounded border border-line bg-surface p-0.5" value={v[f.key] || '#9caf88'} onChange={e => set(f.key, e.target.value)} />
              <input className="field" aria-label={f.label + ' (teks)'} value={v[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} placeholder="#9caf88" />
            </div>); break;
          default: input = (
            <>
              <input id={id} type={f.type === 'url' ? 'url' : 'text'} list={f.suggestions ? `dl-${f.key}` : undefined} className="field" value={v[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} placeholder={f.type === 'url' ? 'https://' : undefined} />
              {f.suggestions && <datalist id={`dl-${f.key}`}>{f.suggestions.map(s => <option key={s} value={s} />)}</datalist>}
            </>);
        }
        return <div key={f.key} className={wide ? 'sm:col-span-2' : ''}><FieldWrap label={f.label + (f.required ? ' *' : '')}>{input}</FieldWrap></div>;
      })}
      <div className="mt-2 flex items-center justify-between gap-2 sm:col-span-2">
        <div>{onDelete && <Button type="button" variant="danger" onClick={onDelete}>Hapus</Button>}</div>
        <div className="flex gap-2">
          <Button type="button" onClick={onCancel}>Batal</Button>
          <Button type="submit" variant="primary" disabled={!valid || busy}>Simpan</Button>
        </div>
      </div>
    </form>
  );
}

export function DataTable({
  table, fields, rows, defaults = {}, addLabel = 'Tambah', emptyTitle = 'Belum ada data', emptyHint, footer, loading, entity = 'data', title,
}: {
  table: string; fields: FieldDef[]; rows: Row[]; defaults?: Record<string, unknown>;
  addLabel?: string; emptyTitle?: string; emptyHint?: string; footer?: ReactNode; loading?: boolean; entity?: string; title?: string;
}) {
  const { add, edit, remove } = useTable(table);
  const [editing, setEditing] = useState<Row | null>(null);
  const cols = fields.filter(f => !f.hideInTable);
  const save = (v: Row) => {
    const { id, ...rest } = v;
    const done = () => setEditing(null);
    if (id) edit.mutate({ id, ...rest }, { onSuccess: done });
    else add.mutate(rest, { onSuccess: done });
  };
  const first = cols[0]?.key;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-muted">{title}</div>
        <Button variant="primary" onClick={() => setEditing({ id: 0, ...defaults })}>＋ {addLabel}</Button>
      </div>
      <div className="relative overflow-x-auto rounded-xl border border-line bg-surface">
        {loading ? <Empty title="Memuat…" /> : rows.length === 0 ? (
          <Empty title={emptyTitle} hint={emptyHint} action={<Button variant="primary" onClick={() => setEditing({ id: 0, ...defaults })}>＋ {addLabel}</Button>} />
        ) : (
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-sunken text-xs font-medium text-muted">
                {cols.map(f => <th key={f.key} className={`px-3 py-2 ${f.align === 'right' ? 'text-right' : ''}`}>{f.label}</th>)}
                <th className="sticky right-0 w-12 bg-sunken px-3 py-2"><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr
                  key={r.id} className="group cursor-pointer border-b border-line last:border-0 hover:bg-sunken/60"
                  onClick={e => { if (!(e.target as HTMLElement).closest('select,input,a,button,textarea,label')) setEditing(r); }}
                >
                  {cols.map(f => (
                    <td key={f.key} className={`max-w-[22rem] px-3 py-2 align-top ${f.align === 'right' ? 'text-right' : ''}`}>
                      <Cell f={f} row={r} onInline={p => edit.mutate({ id: r.id, ...p })} />
                      {f.key === first && r.is_example ? <ExampleTag /> : null}
                    </td>
                  ))}
                  <td className="sticky right-0 bg-surface px-2 py-1.5 text-right group-hover:bg-sunken">
                    <Button size="sm" variant="ghost" aria-label={`Ubah ${entity}`} onClick={() => setEditing(r)}>Ubah</Button>
                  </td>
                </tr>
              ))}
            </tbody>
            {footer}
          </table>
        )}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? `Ubah ${entity}` : `Tambah ${entity}`}>
        {editing && (
          <RowForm
            key={editing.id} fields={fields} initial={editing} busy={add.isPending || edit.isPending}
            onSubmit={save} onCancel={() => setEditing(null)}
            onDelete={editing.id ? () => { askConfirm('Hapus data ini? Tindakan ini tidak bisa dibatalkan.').then(ok => { if (ok) remove.mutate(editing.id, { onSuccess: () => setEditing(null) }); }); } : undefined}
          />
        )}
      </Modal>
    </div>
  );
}
