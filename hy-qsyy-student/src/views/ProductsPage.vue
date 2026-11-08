<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { queryProductList, type WebProduct } from "@/api/product";
import PageHero from "@/components/PageHero.vue";
import SiteLayout from "@/components/SiteLayout.vue";
import { usePageContents } from "@/composables/usePageContents";
import { usePageSeo } from "@/composables/usePageSeo";
import { useI18n } from "@/i18n";

const route = useRoute();
const { currentLanguage, t } = useI18n();
const { blockImage, blockText } = usePageContents("products");
usePageSeo("products");
const products = ref<WebProduct[]>([]);

const category = computed(() => String(route.query.category || "all"));
const heroImage = computed(() => blockImage("hero"));

const filteredProducts = computed(() => {
  if (category.value === "semi") return products.value.filter((item) => item.category === "semi");
  if (category.value === "special") return products.value.filter((item) => item.category === "special");
  return products.value;
});

async function loadProducts() {
  try {
    products.value = await queryProductList();
  } catch {
    products.value = [];
  }
}

onMounted(loadProducts);
watch(currentLanguage, loadProducts);
</script>

<template>
  <SiteLayout>
    <PageHero
      :title="blockText('hero', 'title', t('productsPage.title'))"
      :summary="blockText('hero', 'summary', t('productsPage.summary'))"
      :image="heroImage"
      :page-label="t('nav.products')"
    />

    <section class="wb-section wb-section--light">
      <div class="wb-wrap">
        <div class="wb-banner-note">
          <p>{{ blockText("hero", "content", t("productsPage.bannerText")) }}</p>
          <RouterLink class="wb-btn wb-btn--primary" to="/contact">{{ t("site.communicate") }} <b>→</b></RouterLink>
        </div>

        <div class="wb-filter-bar">
          <span>{{ t("productsPage.categories") }}:</span>
          <RouterLink to="/products" :class="{ active: category === 'all' }">{{ t("common.allProducts") }}</RouterLink>
          <RouterLink to="/products?category=semi" :class="{ active: category === 'semi' }">{{ t("site.semiSeries") }}</RouterLink>
          <RouterLink to="/products?category=special" :class="{ active: category === 'special' }">{{ t("site.specialSeries") }}</RouterLink>
        </div>

        <div class="wb-product-grid wb-product-grid--page">
          <RouterLink v-for="item in filteredProducts" :key="item.slug" class="wb-product" :to="`/products/${item.slug}`">
            <img :src="item.image" :alt="item.name" />
            <div>
              <span>{{ item.category === "semi" ? t("site.semiSeries") : t("site.specialSeries") }}</span>
              <h3>{{ item.name }}</h3>
              <p>{{ item.summary }}</p>
              <em>{{ t("productsPage.viewDetails") }} →</em>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>
  </SiteLayout>
</template>
