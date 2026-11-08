<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import PageHero from "@/components/PageHero.vue";
import SiteLayout from "@/components/SiteLayout.vue";
import { usePageContents } from "@/composables/usePageContents";
import { usePageSeo } from "@/composables/usePageSeo";
import { useI18n } from "@/i18n";

const LEGAL_BLOCKS = {
  shipping: { labelKey: "site.shipping" },
  terms: { labelKey: "site.terms" },
  privacy: { labelKey: "site.privacy" }
} as const;

type LegalBlockCode = keyof typeof LEGAL_BLOCKS;

const route = useRoute();
const { t } = useI18n();

const blockCode = computed(() => {
  const code = String(route.params.pageCode || "");
  return (code in LEGAL_BLOCKS ? code : "privacy") as LegalBlockCode;
});

const page = usePageContents("site");
usePageSeo("site", blockCode);

const pageLabel = computed(() => t(LEGAL_BLOCKS[blockCode.value].labelKey));
const title = computed(() => page.blockText(blockCode.value, "title", pageLabel.value));
const summary = computed(() => page.blockText(blockCode.value, "summary"));
const heroImage = computed(() => page.blockImage(blockCode.value));
const paragraphs = computed(() => {
  const content = page.blockText(blockCode.value, "content");
  if (!content.trim()) return [];
  return content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
});
</script>

<template>
  <SiteLayout>
    <PageHero :title="title" :summary="summary" :image="heroImage" :page-label="pageLabel" />

    <section class="wb-section wb-section--light">
      <div class="wb-wrap wb-article">
        <template v-if="paragraphs.length">
          <p v-for="(item, index) in paragraphs" :key="index">{{ item }}</p>
        </template>
        <p v-else>{{ t("site.legalEmpty") }}</p>
        <RouterLink class="wb-btn wb-btn--primary" to="/contact">{{ t("site.communicate") }} <b>→</b></RouterLink>
      </div>
    </section>
  </SiteLayout>
</template>
