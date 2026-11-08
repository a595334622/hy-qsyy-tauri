<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { queryProductList, type WebProduct } from "@/api/product";
import { querySolutionDetail, type WebSolution } from "@/api/solution";
import InquiryForm from "@/components/InquiryForm.vue";
import PageHero from "@/components/PageHero.vue";
import SiteLayout from "@/components/SiteLayout.vue";
import { usePageContents } from "@/composables/usePageContents";
import { applyRecordSeo } from "@/composables/usePageSeo";
import { useI18n } from "@/i18n";

const route = useRoute();
const { currentLanguage, t } = useI18n();
const homePage = usePageContents("home");
const solution = ref<WebSolution | null>(null);
const allProducts = ref<WebProduct[]>([]);
const ctaImage = computed(() => homePage.blockImage("cta"));
const inquiryStyle = computed(() =>
  ctaImage.value
    ? { backgroundImage: `linear-gradient(90deg, rgb(16 27 31 / 95%), rgb(16 27 31 / 70%)), url(${ctaImage.value})` }
    : undefined
);

const recommended = computed(() => {
  if (!solution.value) return [];
  const slugSet = new Set(solution.value.productSlugs);
  const matched = solution.value.productSlugs
    .map((slug) => allProducts.value.find((item) => item.slug === slug))
    .filter(Boolean) as WebProduct[];
  if (matched.length) return matched;
  return allProducts.value.filter((item) => slugSet.has(item.slug)).slice(0, 6);
});

async function loadSolution() {
  const slug = String(route.params.slug);
  try {
    const [detail, products] = await Promise.all([querySolutionDetail(slug), queryProductList()]);
    solution.value = detail;
    allProducts.value = products;
  } catch {
    solution.value = null;
    allProducts.value = [];
  }
}

onMounted(loadSolution);
watch([currentLanguage, () => route.params.slug], loadSolution);
watch(solution, (value) => {
  if (!value) return;
  applyRecordSeo({
    seoTitle: value.seoTitle,
    seoKeywords: value.seoKeywords,
    seoDescription: value.seoDescription,
    title: value.name,
    summary: value.summary
  });
});
</script>

<template>
  <SiteLayout>
    <template v-if="solution">
      <PageHero
        :title="solution.name"
        :summary="solution.summary"
        :image="solution.image"
        :page-label="t('nav.solutions')"
      />

      <section class="wb-section wb-section--light">
        <div class="wb-wrap wb-detail-grid">
          <div>
            <h2>{{ t("solutionDetail.overview") }}</h2>
            <p>{{ solution.summary }}</p>
            <p><strong>{{ t("solutionDetail.pain") }}:</strong> {{ solution.pain }}</p>
            <p><strong>{{ t("solutionDetail.result") }}:</strong> {{ solution.result }}</p>
          </div>
          <img class="wb-detail-image" :src="solution.image" alt="" />
        </div>
      </section>

      <section class="wb-section">
        <div class="wb-wrap">
          <div class="wb-heading"><h2>{{ t("solutionDetail.recommended") }}</h2></div>
          <div class="wb-product-grid">
            <RouterLink v-for="item in recommended" :key="item.slug" class="wb-product" :to="`/products/${item.slug}`">
              <img :src="item.image" :alt="item.name" />
              <div>
                <h3>{{ item.name }}</h3>
                <p>{{ item.summary }}</p>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="wb-inquiry wb-inquiry--compact" :style="inquiryStyle">
        <div class="wb-wrap wb-inquiry__grid">
          <div>
            <h2>{{ homePage.blockText("cta", "title", t("home.ctaTitle")) }}</h2>
            <p>{{ homePage.blockText("cta", "summary", t("home.ctaText")) }}</p>
          </div>
          <InquiryForm />
        </div>
      </section>
    </template>

    <section v-else class="wb-section">
      <div class="wb-wrap">
        <RouterLink to="/solutions">{{ t("nav.solutions") }}</RouterLink>
      </div>
    </section>
  </SiteLayout>
</template>
