import { useCallback, useEffect, useState } from "react";
import { mergeUniqueById } from "../auth/catalog.js";
import { PUBLIC_GALLERY_PAGE_SIZE } from "../data/gallery.js";
import { listAdminGallery, listPublicGallery } from "../services/galleryService.js";

export function useGalleryFeed({ isAdmin, request, filter }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const fetchPage = useCallback(
    async (nextPage) => {
      const options = {
        category: filter,
        page: nextPage,
        limit: PUBLIC_GALLERY_PAGE_SIZE,
      };
      return isAdmin ? listAdminGallery(request, options) : listPublicGallery(options);
    },
    [filter, isAdmin, request],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      setItems([]);
      setPage(1);
      setMeta(null);
      const listed = await fetchPage(1);
      if (cancelled) return;
      if (!listed.ok) {
        setError(listed.code);
        setLoading(false);
        return;
      }
      setItems(mergeUniqueById([], listed.items));
      setMeta(listed.meta);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, reloadToken]);

  const reset = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  const hasMore = Boolean(meta) && Number(meta.page || page) < Number(meta.totalPages || 0);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = (Number(meta.page) || page) + 1;
    setLoadingMore(true);
    setError(null);
    const listed = await fetchPage(nextPage);
    if (!listed.ok) {
      setError(listed.code);
      setLoadingMore(false);
      return;
    }
    setItems((current) => mergeUniqueById(current, listed.items));
    setMeta(listed.meta);
    setPage(nextPage);
    setLoadingMore(false);
  }, [fetchPage, hasMore, loading, loadingMore, meta, page]);

  const reloadLoaded = useCallback(async ({ silent = false } = {}) => {
    const pages = Math.max(1, Number(meta?.page) || page || 1);
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    let merged = [];
    let lastMeta = null;
    for (let nextPage = 1; nextPage <= pages; nextPage += 1) {
      const listed = await fetchPage(nextPage);
      if (!listed.ok) {
        if (!silent) setItems([]);
        setError(listed.code);
        setLoading(false);
        return { ok: false, items: merged };
      }
      merged = mergeUniqueById(merged, listed.items);
      lastMeta = listed.meta;
    }
    setItems(merged);
    setMeta(lastMeta);
    setPage(pages);
    setLoading(false);
    return { ok: true, items: merged };
  }, [fetchPage, meta, page]);

  return {
    items,
    meta,
    page,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reloadLoaded,
    reset,
    setError,
  };
}
