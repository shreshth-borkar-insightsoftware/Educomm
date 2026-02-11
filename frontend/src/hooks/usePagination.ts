import { useState, useEffect, useCallback } from "react";
import api from "@/api/axiosInstance";

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UsePaginationResult<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  error: string | null;
}

export function usePagination<T>(
  endpoint: string,
  pageSize: number = 10
): UsePaginationResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data } = await api.get<PaginatedResponse<T>>(endpoint, {
        params: { page, pageSize }
      });

      if (page === 1) {
        setItems(data.items);
      } else {
        setItems(prev => [...prev, ...data.items]);
      }

      setTotalPages(data.totalPages);
      setHasMore(page < data.totalPages);
    } catch (err: any) {
      console.error("Pagination fetch error:", err);
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [endpoint, pageSize]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPage(nextPage);
    }
  }, [currentPage, loading, hasMore, fetchPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setItems([]);
    setTotalPages(0);
    setHasMore(true);
    setError(null);
    fetchPage(1);
  }, [fetchPage]);

  return { items, loading, hasMore, loadMore, reset, error };
}
