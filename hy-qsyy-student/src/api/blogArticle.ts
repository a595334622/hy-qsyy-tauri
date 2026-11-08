import { getApi } from "@/api/common";
import { resolveMediaUrl } from "@/api/media";

export interface BlogArticleRecord {
  id: number;
  slug: string;
  languageCode?: string;
  image?: string;
  date?: string;
  title: string;
  summary?: string;
  body1?: string;
  body2?: string;
  body3?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  showOnHomepage?: number;
  sort?: number;
  status?: number;
}

export interface WebBlogArticle {
  id: number;
  slug: string;
  title: string;
  summary: string;
  image: string;
  date: string;
  body1: string;
  body2: string;
  body3: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
}

export async function queryBlogArticleList(options?: { homepage?: boolean }): Promise<WebBlogArticle[]> {
  const res = await getApi<BlogArticleRecord[]>("/api/blogArticle/list", {
    params: options?.homepage ? { homepage: true } : undefined
  });
  return (res.result || []).map(normalizeBlogArticle);
}

export async function queryBlogArticleDetail(slug: string): Promise<WebBlogArticle | null> {
  const res = await getApi<BlogArticleRecord | "">(`/api/blogArticle/detail/${slug}`);
  return res.result && typeof res.result === "object" ? normalizeBlogArticle(res.result) : null;
}

export function normalizeBlogArticle(article: BlogArticleRecord): WebBlogArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary || "",
    image: resolveMediaUrl(article.image),
    date: formatDate(article.date),
    body1: article.body1 || "",
    body2: article.body2 || "",
    body3: article.body3 || "",
    seoTitle: article.seoTitle,
    seoKeywords: article.seoKeywords,
    seoDescription: article.seoDescription
  };
}

function formatDate(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}
