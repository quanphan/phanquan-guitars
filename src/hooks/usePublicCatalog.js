import { useCallback, useEffect, useState } from "react";
import { isProductType } from "../auth/productSpecs.js";
import { loadCatalogNameMap, listPublicProducts } from "../services/publicProductService.js";
import { publicInstrumentsOfType } from "../services/productView.js";

export function usePublicCatalog(productType) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const retry = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!isProductType(productType)) {
      setItems([]);
      setError(null);
      setStatus("ready");
      return undefined;
    }
    let cancelled = false;
    async function load() {
      setStatus("loading");
      setError(null);
      setItems([]);
      const listed = await listPublicProducts(productType);
      if (cancelled) return;
      if (!listed.ok) {
        setError(listed.code);
        setStatus("error");
        return;
      }
      const names = await loadCatalogNameMap(listed.items);
      if (cancelled) return;
      setItems(publicInstrumentsOfType(listed.items, productType, names));
      setStatus("ready");
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [productType, reloadToken]);

  return { items, status, error, retry };
}
