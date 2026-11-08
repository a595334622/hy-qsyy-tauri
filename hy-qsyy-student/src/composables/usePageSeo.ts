import { computed, unref, watch, type MaybeRef } from "vue";
import type { SitePageContentRecord } from "@/api/sitePageContent";
import { usePageContents } from "@/composables/usePageContents";
import { useI18n } from "@/i18n";
import { updateDocumentSeo } from "@/utils/seo";

/** 按页面 hero/meta 块应用 SEO；默认 SEO 回退到站点 meta。 */
export function usePageSeo(pageCode: MaybeRef<string>, blockCode: MaybeRef<string> = "hero") {
  const { currentLanguage, t } = useI18n();
  const resolvedPageCode = computed(() => unref(pageCode));
  const resolvedBlockCode = computed(() => unref(blockCode));
  const { contents, block } = usePageContents(resolvedPageCode);
  const sitePage = usePageContents("site");

  function applySeo() {
    const record = block(resolvedBlockCode.value);
    const siteMeta = sitePage.block("meta");
    applyRecordSeo(record, {
      title: siteMeta?.seoTitle || siteMeta?.title || t("site.metaTitle"),
      description: siteMeta?.seoDescription || siteMeta?.summary || t("site.metaDescription"),
      keywords: siteMeta?.seoKeywords
    });
  }

  watch([contents, sitePage.contents, currentLanguage, resolvedPageCode, resolvedBlockCode], applySeo, {
    deep: true,
    immediate: true
  });

  return { applySeo };
}

/** 将内容记录或业务实体的 SEO 写入 document。 */
export function applyRecordSeo(
  record?: Pick<SitePageContentRecord, "seoTitle" | "seoKeywords" | "seoDescription" | "title" | "summary"> | null,
  fallback?: { title?: string; description?: string; keywords?: string }
) {
  updateDocumentSeo({
    title: record?.seoTitle || record?.title || fallback?.title,
    description: record?.seoDescription || record?.summary || fallback?.description,
    keywords: record?.seoKeywords || fallback?.keywords
  });
}
