import { useCallback, useEffect, useState } from "react";
import { mergeUniqueById, PUBLIC_GUITAR_PAGE_SIZE } from "../auth/catalog.js";
import { isProductType, PRODUCT_TYPES } from "../auth/productSpecs.js";
import { loadCatalogNameMap, listPublicProductPage } from "../services/publicProductService.js";
import { publicInstrumentsOfType } from "../services/productView.js";

export function usePublicGuitarList() {
  const productType = PRODUCT_TYPES.CUSTOM_ORDER;
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const retry = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isProductType(productType)) {
      setItems([]);
      setMeta(null);
      setError(null);
      setStatus("ready");
      return undefined;
    }
    let cancelled = false;
    async function load() {
      setStatus("loading");
      setLoadingMore(false);
      setError(null);
      setItems([]);
      setPage(1);
      const listed = await listPublicProductPage(productType, {
        page: 1,
        limit: PUBLIC_GUITAR_PAGE_SIZE,
        sort: "listing",
      });
      if (cancelled) return;
      if (!listed.ok) {
        setError(listed.code);
        setMeta(null);
        setStatus("error");
        return;
      }
      const names = await loadCatalogNameMap(listed.items);
      if (cancelled) return;
      setItems(publicInstrumentsOfType(listed.items, productType, names));
      setMeta(listed.meta);
      setStatus("ready");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [productType, reloadToken]);

  const hasMore = Boolean(meta) && Number(meta.page || page) < Number(meta.totalPages || 0);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || status !== "ready") return;
    const nextPage = (Number(meta.page) || page) + 1;
    setLoadingMore(true);
    setError(null);
    const listed = await listPublicProductPage(productType, {
      page: nextPage,
      limit: PUBLIC_GUITAR_PAGE_SIZE,
      sort: "listing",
    });
    if (!listed.ok) {
      setError(listed.code);
      setLoadingMore(false);
      return;
    }
    const names = await loadCatalogNameMap(listed.items);
    const incoming = publicInstrumentsOfType(listed.items, productType, names);
    setItems((current) => mergeUniqueById(current, incoming));
    setMeta(listed.meta);
    setPage(nextPage);
    setLoadingMore(false);
  }, [hasMore, loadingMore, meta, page, productType, status]);

  return { items, status, error, retry, hasMore, loadMore, loadingMore };
}
