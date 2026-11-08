import { getApi } from "@/api/common";
import { resolveMediaUrl } from "@/api/media";

export interface CustomerCaseRecord {
  id: number;
  slug: string;
  languageCode?: string;
  image?: string;
  caseKey?: string;
  productSlug?: string;
  industry?: string;
  title: string;
  pain?: string;
  solution?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  showOnHomepage?: number;
  sort?: number;
  status?: number;
}

export interface WebCustomerCase {
  id: number;
  slug: string;
  caseKey?: string;
  productSlug?: string;
  industry: string;
  title: string;
  pain: string;
  solution: string;
  image: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
}

export async function queryCustomerCaseList(options?: { homepage?: boolean }): Promise<WebCustomerCase[]> {
  const res = await getApi<CustomerCaseRecord[]>("/api/customerCase/list", {
    params: options?.homepage ? { homepage: true } : undefined
  });
  return (res.result || []).map(normalizeCustomerCase);
}

export async function queryCustomerCaseDetail(slug: string): Promise<WebCustomerCase | null> {
  const res = await getApi<CustomerCaseRecord | "">(`/api/customerCase/detail/${slug}`);
  return res.result && typeof res.result === "object" ? normalizeCustomerCase(res.result) : null;
}

export function normalizeCustomerCase(record: CustomerCaseRecord): WebCustomerCase {
  return {
    id: record.id,
    slug: record.slug,
    caseKey: record.caseKey || undefined,
    productSlug: record.productSlug || undefined,
    industry: record.industry || "",
    title: record.title,
    pain: record.pain || "",
    solution: record.solution || "",
    image: resolveMediaUrl(record.image),
    seoTitle: record.seoTitle,
    seoKeywords: record.seoKeywords,
    seoDescription: record.seoDescription
  };
}
