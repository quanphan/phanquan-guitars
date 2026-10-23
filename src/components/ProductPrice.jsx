import { formatProductPrice } from "../services/formatPrice.js";

export default function ProductPrice({ product, className = "mt-5 text-lg text-ivory" }) {
  const label = formatProductPrice(product);
  if (!label) return null;
  return <p className={className}>{label}</p>;
}
