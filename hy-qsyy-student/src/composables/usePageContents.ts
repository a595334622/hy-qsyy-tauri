import { computed, onMounted, ref, watch, type Ref } from "vue";
import {
  parseContentExtra,
  querySitePageContents,
  type SitePageContentMap,
  type SitePageContentRecord
} from "@/api/sitePageContent";
import { resolveMediaUrl } from "@/api/media";
import { useI18n } from "@/i18n";

export interface ValueLabelItem {
  value: string;
  label: string;
}

export interface TitleTextItem {
  title: string;
  text: string;
}

export interface TitleTextImageItem extends TitleTextItem {
  image: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProductSeriesItem {
  key: string;
  title: string;
  text: string;
  image: string;
}

/** 按 pageCode 加载页面内容块，语言切换时自动刷新。 */
export function usePageContents(pageCode: string | Ref<string>) {
  const { currentLanguage } = useI18n();
  const contents = ref<SitePageContentMap>({});
  const loading = ref(false);
  let requestVersion = 0;

  const resolvedPageCode = computed(() => (typeof pageCode === "string" ? pageCode : pageCode.value));

  async function loadContents() {
    const currentVersion = ++requestVersion;
    const code = resolvedPageCode.value;
    loading.value = true;
    try {
      const result = await querySitePageContents(code);
      if (currentVersion === requestVersion) {
        contents.value = result;
      }
    } catch {
      if (currentVersion === requestVersion) {
        contents.value = {};
      }
    } finally {
      if (currentVersion === requestVersion) {
        loading.value = false;
      }
    }
  }

  onMounted(loadContents);
  watch([currentLanguage, resolvedPageCode], loadContents);

  function block(blockCode: string): SitePageContentRecord | undefined {
    return contents.value[blockCode];
  }

  function blockImage(blockCode: string, fallback = ""): string {
    return resolveMediaUrl(block(blockCode)?.imageUrl) || fallback;
  }

  function blockText(blockCode: string, field: "title" | "subtitle" | "summary" | "content", fallback = ""): string {
    const value = block(blockCode)?.[field];
    return (typeof value === "string" && value.trim() ? value : fallback) || "";
  }

  return {
    contents,
    loading,
    loadContents,
    block,
    blockImage,
    blockText
  };
}

export function parseValueLabelList(extraJson?: string): ValueLabelItem[] {
  const parsed = parseContentExtra<unknown[]>(extraJson);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const value = String(record.value ?? "").trim();
      const label = String(record.label ?? "").trim();
      return value || label ? { value, label } : null;
    })
    .filter((item): item is ValueLabelItem => Boolean(item));
}

export function parseTitleTextList(extraJson?: string): TitleTextItem[] {
  const parsed = parseContentExtra<unknown[]>(extraJson);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = String(record.title ?? "").trim();
      const text = String(record.text ?? "").trim();
      return title || text ? { title, text } : null;
    })
    .filter((item): item is TitleTextItem => Boolean(item));
}

export function parseTitleTextImageList(extraJson?: string): TitleTextImageItem[] {
  const parsed = parseContentExtra<unknown[]>(extraJson);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const title = String(record.title ?? "").trim();
      const text = String(record.text ?? "").trim();
      const image = resolveMediaUrl(String(record.image ?? "").trim());
      return title || text || image ? { title, text, image } : null;
    })
    .filter((item): item is TitleTextImageItem => Boolean(item));
}

export function parseFaqList(extraJson?: string): FaqItem[] {
  const parsed = parseContentExtra<unknown[]>(extraJson);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const question = String(record.question ?? "").trim();
      const answer = String(record.answer ?? "").trim();
      return question || answer ? { question, answer } : null;
    })
    .filter((item): item is FaqItem => Boolean(item));
}

export function parseImageList(extraJson?: string): string[] {
  const parsed = parseContentExtra<unknown[]>(extraJson);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => resolveMediaUrl(typeof item === "string" ? item : String((item as Record<string, unknown>)?.image ?? "")))
    .filter(Boolean);
}

export function parseProductSeriesList(extraJson?: string): ProductSeriesItem[] {
  const parsed = parseContentExtra<unknown[]>(extraJson);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const key = String(record.key ?? "").trim();
      const title = String(record.title ?? "").trim();
      const text = String(record.text ?? "").trim();
      const image = resolveMediaUrl(String(record.image ?? "").trim());
      return key || title || image ? { key, title, text, image } : null;
    })
    .filter((item): item is ProductSeriesItem => Boolean(item));
}

/** 解析 content 中「标题: 正文」多行（愿景/使命等）。 */
export function parseColonLines(content?: string): TitleTextItem[] {
  if (!content?.trim()) return [];
  return content
    .split(/\n+/)
    .map((line) => {
      const text = line.trim();
      if (!text) return null;
      const separatorIndex = Math.max(text.indexOf(":"), text.indexOf("："));
      if (separatorIndex <= 0) return null;
      const title = text.slice(0, separatorIndex).trim();
      const body = text.slice(separatorIndex + 1).trim();
      return title || body ? { title, text: body } : null;
    })
    .filter((item): item is TitleTextItem => Boolean(item));
}

export function parseStringList(extraJson?: string): string[] {
  const parsed = parseContentExtra<unknown[]>(extraJson);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
}
