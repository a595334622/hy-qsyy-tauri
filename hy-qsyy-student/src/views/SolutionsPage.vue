<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { queryCustomerCaseList, type WebCustomerCase } from "@/api/customerCase";
import { queryProductList, type WebProduct } from "@/api/product";
import { querySolutionList, type WebSolution } from "@/api/solution";
import InquiryForm from "@/components/InquiryForm.vue";
import PageHero from "@/components/PageHero.vue";
import SiteLayout from "@/components/SiteLayout.vue";
import { parseTitleTextList, usePageContents } from "@/composables/usePageContents";
import { usePageSeo } from "@/composables/usePageSeo";
import { useI18n } from "@/i18n";

const { currentLanguage, t } = useI18n();
const page = usePageContents("solutions");
const homePage = usePageContents("home");
usePageSeo("solutions");
const solutions = ref<WebSolution[]>([]);
const products = ref<WebProduct[]>([]);
const cases = ref<WebCustomerCase[]>([]);

const heroImage = computed(() => page.blockImage("hero"));
const processSteps = computed(() => parseTitleTextList(page.block("process")?.extraJson));
const ctaImage = computed(() => homePage.blockImage("cta"));
const inquiryStyle = computed(() =>
  ctaImage.value
    ? { backgroundImage: `linear-gradient(90deg, rgb(16 27 31 / 95%), rgb(16 27 31 / 70%)), url(${ctaImage.value})` }
    : undefined
);

const productMap = computed(() =>
  products.value.reduce<Record<string, WebProduct>>((result, item) => {
    result[item.slug] = item;
    return result;
  }, {})
);

function getSolutionCase(solution: WebSolution) {
  if (!solution.caseKey) return undefined;
  return cases.value.find((item) => item.caseKey === solution.caseKey);
}

function getSolutionProducts(solution: WebSolution) {
  return solution.productSlugs
    .map((slug) => productMap.value[slug])
    .filter(Boolean) as WebProduct[];
}

async function loadData() {
  try {
    const [solutionList, productList, caseList] = await Promise.all([
      querySolutionList(),
      queryProductList(),
      queryCustomerCaseList()
    ]);
    solutions.value = solutionList;
    products.value = productList;
    cases.value = caseList;
  } catch {
    solutions.value = [];
    products.value = [];
    cases.value = [];
  }
}

onMounted(loadData);
watch(currentLanguage, loadData);
</script>

<template>
  <SiteLayout>
    <PageHero
      :title="page.blockText('hero', 'title', t('solutionsPage.title'))"
      :summary="page.blockText('hero', 'summary', t('solutionsPage.summary'))"
      :image="heroImage"
      :page-label="t('nav.solutions')"
    />

    <section class="wb-section wb-section--light">
      <div class="wb-wrap">
        <div class="wb-heading wb-heading--center">
          <p>[ {{ page.blockText("process", "subtitle", t("solutionsPage.processEyebrow")) }} ]</p>
          <h2>{{ page.blockText("process", "title", t("solutionsPage.processTitle")) }}</h2>
        </div>
        <div class="wb-process-grid">
          <article v-for="(step, index) in processSteps" :key="step.title">
            <span>0{{ index + 1 }}</span>
            <div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="wb-section">
      <div class="wb-wrap wb-solution-list-page">
        <article v-for="item in solutions" :key="item.slug" class="wb-solution-row">
          <div class="wb-solution-row__banner">
            <img :src="item.image" :alt="item.name" />
            <div class="wb-solution-row__banner-shade"></div>
            <div class="wb-solution-row__banner-copy">
              <span>{{ page.blockText("hero", "title", t("solutionsPage.title")) }}</span>
              <h2>{{ item.name }}</h2>
              <p>{{ item.scenario }}</p>
            </div>
          </div>

          <div class="wb-solution-row__body">
            <div class="wb-solution-row__main">
              <p class="wb-solution-row__scenario">{{ item.scenario }}</p>
              <div class="wb-solution-row__highlights">
                <p><strong>{{ t("solutionDetail.pain") }}:</strong> {{ item.pain }}</p>
                <p><strong>{{ t("solutionDetail.result") }}:</strong> {{ item.result }}</p>
              </div>
              <div class="wb-solution-row__features">
                <h3>{{ t("solutionDetail.features") }}</h3>
                <ul>
                  <li v-for="feature in item.features" :key="feature">{{ feature }}</li>
                </ul>
              </div>
              <div class="wb-solution-row__actions">
                <RouterLink class="wb-btn wb-btn--dark" :to="`/solutions/${item.slug}`">
                  {{ t("common.understandDetails") }} <b>→</b>
                </RouterLink>
                <RouterLink class="wb-btn wb-btn--line" to="/contact">{{ t("solutionDetail.getQuote") }}</RouterLink>
              </div>
            </div>

            <aside class="wb-solution-row__aside">
              <div class="wb-solution-row__metrics">
                <div v-for="metric in item.metrics" :key="`${metric.label}-${metric.value}`">
                  <strong>{{ metric.value }}</strong>
                  <span>{{ metric.label }}</span>
                </div>
              </div>

              <div v-if="getSolutionCase(item)" class="wb-solution-row__case">
                <h3>{{ t("solutionDetail.relatedCase") }}</h3>
                <RouterLink class="wb-solution-row__case-card" to="/contact">
                  <img :src="getSolutionCase(item)!.image" :alt="getSolutionCase(item)!.title" />
                  <div>
                    <span>{{ getSolutionCase(item)!.industry }}</span>
                    <h4>{{ getSolutionCase(item)!.title }}</h4>
                    <p>{{ getSolutionCase(item)!.solution }}</p>
                  </div>
                </RouterLink>
              </div>
            </aside>
          </div>

          <div class="wb-solution-row__products">
            <h3>{{ t("solutionDetail.recommended") }}</h3>
            <div class="wb-series-product-grid">
              <RouterLink
                v-for="product in getSolutionProducts(item)"
                :key="product.slug"
                class="wb-series-product-card"
                :to="`/products/${product.slug}`"
              >
                <img :src="product.image" :alt="product.name" />
                <h4>{{ product.name }}</h4>
              </RouterLink>
            </div>
          </div>
        </article>
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
  </SiteLayout>
</template>
