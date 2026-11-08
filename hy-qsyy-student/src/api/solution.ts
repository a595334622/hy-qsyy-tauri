import { getApi } from "@/api/common";
import { parseStringArray, resolveMediaUrl } from "@/api/media";

export interface SolutionRecord {
  id: number;
  slug: string;
  languageCode?: string;
  image?: string;
  caseKey?: string;
  name: string;
  summary?: string;
  scenario?: string;
  pain?: string;
  result?: string;
  features?: string;
  metrics?: string;
  productSlugs?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  showOnHomepage?: number;
  sort?: number;
  status?: number;
}

export interface SolutionMetric {
  value: string;
  label: string;
}

export interface WebSolution {
  id: number;
  slug: string;
  name: string;
  summary: string;
  scenario: string;
  pain: string;
  result: string;
  image: string;
  caseKey?: string;
  features: string[];
  metrics: SolutionMetric[];
  productSlugs: string[];
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
}

export async function querySolutionList(options?: { homepage?: boolean }): Promise<WebSolution[]> {
  const res = await getApi<SolutionRecord[]>("/api/solution/list", {
    params: options?.homepage ? { homepage: true } : undefined
  });
  return (res.result || []).map(normalizeSolution);
}

export async function querySolutionDetail(slug: string): Promise<WebSolution | null> {
  const res = await getApi<SolutionRecord | "">(`/api/solution/detail/${slug}`);
  return res.result && typeof res.result === "object" ? normalizeSolution(res.result) : null;
}

export function normalizeSolution(solution: SolutionRecord): WebSolution {
  return {
    id: solution.id,
    slug: solution.slug,
    name: solution.name,
    summary: solution.summary || "",
    scenario: solution.scenario || "",
    pain: solution.pain || "",
    result: solution.result || "",
    image: resolveMediaUrl(solution.image),
    caseKey: solution.caseKey || undefined,
    features: parseStringArray(solution.features),
    metrics: parseMetrics(solution.metrics),
    productSlugs: parseStringArray(solution.productSlugs),
    seoTitle: solution.seoTitle,
    seoKeywords: solution.seoKeywords,
    seoDescription: solution.seoDescription
  };
}

function parseMetrics(value?: string): SolutionMetric[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          const record = item as Record<string, unknown>;
          const metricValue = String(record.value || "").trim();
          const label = String(record.label || record.labelKey || "").trim();
          if (metricValue || label) {
            return { value: metricValue, label };
          }
        }
        return null;
      })
      .filter((item): item is SolutionMetric => Boolean(item));
  } catch {
    return [];
  }
}
