const ISO_CURRENCY = /^[A-Za-z]{3}$/;

function storedCurrency(product) {
  if (typeof product?.currency === "string" && product.currency.trim()) return product.currency.trim();
  if (typeof product?.unit === "string" && product.unit.trim()) return product.unit.trim();
  return "";
}

function formatIsoCurrency(amount, code) {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const number = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return `${number} ${code}`;
  }
}

export function formatStoredPrice(price, currency) {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  const raw = typeof currency === "string" ? currency.trim() : "";
  if (!raw) return formatIsoCurrency(amount, "USD");
  if (ISO_CURRENCY.test(raw)) return formatIsoCurrency(amount, raw.toUpperCase());
  const number = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${number} ${raw}`;
}

export function formatProductPrice(product) {
  return formatStoredPrice(product?.price, storedCurrency(product));
}
