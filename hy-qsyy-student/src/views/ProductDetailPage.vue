<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { queryProductDetail, queryProductList, type WebProduct } from "@/api/product";
import InquiryForm from "@/components/InquiryForm.vue";
import PageHero from "@/components/PageHero.vue";
import SiteLayout from "@/components/SiteLayout.vue";
import { usePageContents } from "@/composables/usePageContents";
import { applyRecordSeo } from "@/composables/usePageSeo";
import { useI18n } from "@/i18n";

const route = useRoute();
const { currentLanguage, t } = useI18n();
const homePage = usePageContents("home");
const product = ref<WebProduct | null>(null);
const allProducts = ref<WebProduct[]>([]);
const ctaImage = computed(() => homePage.blockImage("cta"));
const inquiryStyle = computed(() =>
  ctaImage.value
    ? { backgroundImage: `linear-gradient(90deg, rgb(16 27 31 / 95%), rgb(16 27 31 / 70%)), url(${ctaImage.value})` }
    : undefined
);

const related = computed(() =>
  allProducts.value.filter((item) => item.slug !== product.value?.slug).slice(0, 4)
);

async function loadProduct() {
  const slug = String(route.params.slug);
  try {
    const [detail, list] = await Promise.all([queryProductDetail(slug), queryProductList()]);
    product.value = detail;
    allProducts.value = list;
  } catch {
    product.value = null;
    allProducts.value = [];
  }
}

onMounted(loadProduct);
watch([currentLanguage, () => route.params.slug], loadProduct);
watch(product, (value) => {
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
    <template v-if="product">
      <PageHero
        :title="product.name"
        :summary="product.summary"
        :image="product.image"
        :page-label="t('nav.products')"
      />

      <section class="wb-section">
        <div class="wb-wrap wb-detail-grid">
          <img class="wb-detail-image" :src="product.image" :alt="product.name" />
          <div>
            <h2>{{ product.name }}</h2>
            <p>{{ product.summary }}</p>
            <ul class="wb-feature-list">
              <li v-for="feature in product.features" :key="feature">{{ feature }}</li>
            </ul>
            <RouterLink class="wb-btn wb-btn--primary" to="/contact">{{ t("home.getQuote") }} <b>→</b></RouterLink>
          </div>
        </div>
      </section>

      <section class="wb-section wb-section--light">
        <div class="wb-wrap wb-spec-grid">
          <div>
            <h2>{{ t("productDetail.specs") }}</h2>
            <table v-if="product.specItems.length" class="wb-spec-table">
              <tbody>
                <tr v-for="row in product.specItems" :key="`${row.label}-${row.value}`">
                  <th>{{ row.label }}</th>
                  <td>{{ row.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h2>{{ t("productDetail.highlights") }}</h2>
            <ul class="wb-feature-list">
              <li v-for="feature in product.features" :key="feature">{{ feature }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section class="wb-section">
        <div class="wb-wrap">
          <div class="wb-heading"><h2>{{ t("productDetail.related") }}</h2></div>
          <div class="wb-product-grid">
            <RouterLink v-for="item in related" :key="item.slug" class="wb-product" :to="`/products/${item.slug}`">
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
        <h2>404</h2>
        <RouterLink to="/products">{{ t("nav.products") }}</RouterLink>
      </div>
    </section>
  </SiteLayout>
</template>
