import { mediaUrl } from "../config/api.js";
import {
  productImagePaths,
  productQuantity,
  productsOfType,
  readProductType,
  specsToTabs,
} from "../auth/productSpecs.js";

export function publicInstrumentsOfType(items, productType, catalogNames = {}) {
  return productsOfType(items, productType)
    .map((item) => toPublicInstrument(item, catalogNames))
    .filter(Boolean);
}

export function toPublicInstrument(product, catalogNames = {}) {
  if (!product?.id) return null;
  const paths = productImagePaths(product);
  const quantity = productQuantity(product);
  const specTabs = specsToTabs(product.specs, catalogNames);
  if (product.descriptionDetail && !specTabs.additional.otherDetails) {
    specTabs.additional.otherDetails = product.descriptionDetail;
  }
  return {
    id: product.id,
    slug: product.slug || product.id,
    source: "api",
    name: product.name,
    typeLabel: product.instrumentType?.name || product.series?.name || product.bodyShape?.name || "",
    description: product.description || "",
    descriptionDetail: product.descriptionDetail || "",
    price: product.price,
    unit: product.unit || "",
    currency: typeof product.currency === "string" ? product.currency : "",
    productType: readProductType(product),
    availability: quantity == null || quantity > 0 ? "available" : "sold",
    images: paths.map((path) => ({
      src: mediaUrl(path),
      alt: product.name,
    })),
    specTabs,
    isDemo: false,
    isMock: false,
    inquiryRoute: "/contact",
  };
}

export function imageAlt(image, t) {
  if (!image) return "";
  if (typeof image.alt === "string" && image.alt.trim()) return image.alt;
  if (image.altKey) {
    const translated = t(image.altKey);
    return translated === image.altKey ? "" : translated;
  }
  return "";
}
