'use client';

import { useCallback, useEffect, useState } from 'react';

import type { PaginatedResult, PaginationMeta } from '@community-marketplace/types';

interface UsePaginatedQueryOptions<T> {
  fetcher: (page: number, limit: number) => Promise<PaginatedResult<T>>;
  limit?: number;
}

export function usePaginatedQuery<T>({ fetcher, limit = 20 }: UsePaginatedQueryOptions<T>) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(page, limit);
      setData(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return {
    page,
    setPage,
    data,
    meta,
    loading,
    error,
    totalPages,
    reload: load,
  };
}
