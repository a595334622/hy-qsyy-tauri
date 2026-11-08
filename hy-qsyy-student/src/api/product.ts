import { getApi } from "@/api/common";
import { parseStringArray, resolveMediaUrl } from "@/api/media";

export type ProductCategory = "semi" | "special";

export interface ProductRecord {
  id: number;
  slug: string;
  languageCode?: string;
  image?: string;
  category: string;
  name: string;
  summary?: string;
  features?: string;
  specs?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  showOnHomepage?: number;
  sort?: number;
  status?: number;
}

export interface ProductSpecItem {
  label: string;
  value: string;
}

export interface WebProduct {
  id: number;
  slug: string;
  category: ProductCategory;
  name: string;
  summary: string;
  image: string;
  features: string[];
  specItems: ProductSpecItem[];
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
}

export async function queryProductList(options?: { homepage?: boolean }): Promise<WebProduct[]> {
  const res = await getApi<ProductRecord[]>("/api/product/list", {
    params: options?.homepage ? { homepage: true } : undefined
  });
  return (res.result || []).map(normalizeProduct);
}

export async function queryProductDetail(slug: string): Promise<WebProduct | null> {
  const res = await getApi<ProductRecord | "">(`/api/product/detail/${slug}`);
  return res.result && typeof res.result === "object" ? normalizeProduct(res.result) : null;
}

export function normalizeProduct(product: ProductRecord): WebProduct {
  return {
    id: product.id,
    slug: product.slug,
    category: product.category === "special" ? "special" : "semi",
    name: product.name,
    summary: product.summary || "",
    image: resolveMediaUrl(product.image),
    features: parseStringArray(product.features),
    specItems: parseSpecItems(product.specs),
    seoTitle: product.seoTitle,
    seoKeywords: product.seoKeywords,
    seoDescription: product.seoDescription
  };
}

export function parseSpecItems(value?: string): ProductSpecItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          const record = item as Record<string, unknown>;
          const label = String(record.label || record.name || "").trim();
          const specValue = String(record.value || "").trim();
          if (label || specValue) {
            return { label, value: specValue };
          }
        }
        return null;
      })
      .filter((item): item is ProductSpecItem => Boolean(item));
  } catch {
    return [];
  }
}
