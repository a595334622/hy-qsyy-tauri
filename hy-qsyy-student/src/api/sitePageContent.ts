import { getApi } from "@/api/common";

export interface SitePageContentRecord {
  id: number;
  languageCode?: string;
  pageCode: string;
  blockCode: string;
  title?: string;
  subtitle?: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  linkText?: string;
  linkUrl?: string;
  extraJson?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  sort?: number;
  status?: number;
}

export type SitePageContentMap = Record<string, SitePageContentRecord>;

export async function querySitePageContents(pageCode: string): Promise<SitePageContentMap> {
  const res = await getApi<SitePageContentRecord[]>(`/api/sitePageContent/page/${pageCode}`);
  return (res.result || []).reduce<SitePageContentMap>((result, item) => {
    result[item.blockCode] = item;
    return result;
  }, {});
}

export function parseContentExtra<T>(value?: string): T | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
