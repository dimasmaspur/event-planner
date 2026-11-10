import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = { id: number; is_example?: number; [k: string]: any };

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = unknown>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error || 'Terjadi kesalahan');
  return data as T;
}

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, refetchOnWindowFocus: true, retry: false } },
});

export function useRows(table: string) {
  return useQuery({ queryKey: [table], queryFn: () => api<Row[]>(`/api/${table}`) });
}

export function useTable(table: string) {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: [table] });
  const add = useMutation({ mutationFn: (b: Record<string, unknown>) => api(`/api/${table}`, { method: 'POST', body: b }), onSuccess: done });
  const edit = useMutation({
    mutationFn: ({ id, ...b }: Record<string, unknown> & { id: number }) => api(`/api/${table}/${id}`, { method: 'PUT', body: b }),
    onSuccess: done,
  });
  const remove = useMutation({ mutationFn: (id: number) => api(`/api/${table}/${id}`, { method: 'DELETE' }), onSuccess: done });
  return { add, edit, remove };
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => api<Record<string, string>>('/api/settings') });
}
