<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { queryCustomerCaseList, type WebCustomerCase } from "@/api/customerCase";
import PageHero from "@/components/PageHero.vue";
import SiteLayout from "@/components/SiteLayout.vue";
import {
  parseColonLines,
  parseImageList,
  parseTitleTextImageList,
  parseTitleTextList,
  parseValueLabelList,
  usePageContents
} from "@/composables/usePageContents";
import { usePageSeo } from "@/composables/usePageSeo";
import { useI18n } from "@/i18n";

const { currentLanguage, t } = useI18n();
const aboutPage = usePageContents("about");
const homePage = usePageContents("home");
usePageSeo("about");

const galleryIndex = ref(0);
const cases = ref<WebCustomerCase[]>([]);

const heroImage = computed(() => aboutPage.blockImage("hero"));
const journeyItems = computed(() => parseTitleTextList(aboutPage.block("journey")?.extraJson));
const introStats = computed(() => parseValueLabelList(aboutPage.block("intro")?.extraJson));
const introVisionItems = computed(() => parseColonLines(aboutPage.block("intro")?.content));
const advantageItems = computed(() => parseTitleTextImageList(homePage.block("advantages")?.extraJson));
const whyUsItems = computed(() => {
  const aboutItems = parseTitleTextList(aboutPage.block("why_us")?.extraJson);
  return aboutItems.length ? aboutItems : parseTitleTextList(homePage.block("why_us")?.extraJson);
});
const whyUsImage = computed(() => aboutPage.blockImage("why_us") || homePage.blockImage("why_us"));
const factoryImages = computed(() => parseImageList(homePage.block("factory")?.extraJson));

function shift(step: number) {
  if (!factoryImages.value.length) return;
  galleryIndex.value = (galleryIndex.value + step + factoryImages.value.length) % factoryImages.value.length;
}

async function loadCases() {
  try {
    cases.value = await queryCustomerCaseList();
  } catch {
    cases.value = [];
  }
}

onMounted(loadCases);
watch(currentLanguage, loadCases);
watch(factoryImages, () => {
  if (galleryIndex.value >= factoryImages.value.length) {
    galleryIndex.value = 0;
  }
});
</script>

<template>
  <SiteLayout>
    <PageHero
      :title="aboutPage.blockText('hero', 'title', t('about.title'))"
      :summary="aboutPage.blockText('hero', 'summary', t('about.summary'))"
      :image="heroImage"
      :page-label="t('nav.about')"
    />

    <section class="wb-section wb-section--light">
      <div class="wb-wrap wb-about-preview__grid">
        <div v-if="introStats[0]" class="wb-about-preview__stat">
          <strong>{{ introStats[0].value }}</strong>
          <span>{{ introStats[0].label }}</span>
        </div>
        <div>
          <h2>{{ aboutPage.blockText("intro", "title", t("home.aboutTitle")) }}</h2>
          <p>{{ aboutPage.blockText("intro", "summary", t("home.aboutText")) }}</p>
          <div v-if="introVisionItems.length" class="wb-about-preview__vm">
            <div v-for="item in introVisionItems" :key="item.title">
              <strong>{{ item.title }}</strong>
              <p>{{ item.text }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="wb-section">
      <div class="wb-wrap">
        <div class="wb-heading">
          <p>[ {{ aboutPage.blockText("journey", "subtitle", t("about.journeyEyebrow")) }} ]</p>
          <h2>{{ aboutPage.blockText("journey", "title", t("about.journeyTitle")) }}</h2>
        </div>
        <div class="wb-process-grid">
          <article v-for="(item, index) in journeyItems" :key="item.title">
            <span>0{{ index + 1 }}</span>
            <div><h3>{{ item.title }}</h3><p>{{ item.text }}</p></div>
          </article>
        </div>
      </div>
    </section>

    <section class="wb-section wb-section--light">
      <div class="wb-wrap">
        <div class="wb-heading">
          <p>[ {{ homePage.blockText("advantages", "subtitle", t("home.advantagesEyebrow")) }} ]</p>
          <h2>{{ homePage.blockText("advantages", "title", t("home.advantagesTitle")) }}</h2>
        </div>
        <div class="wb-advantages">
          <article v-for="item in advantageItems" :key="item.title">
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="wb-why">
      <div class="wb-wrap wb-why__grid">
        <div class="wb-why__image"><img :src="whyUsImage" alt="" /></div>
        <div>
          <p class="wb-kicker">[ {{ aboutPage.blockText("why_us", "subtitle", homePage.blockText("why_us", "subtitle", t("home.whyEyebrow"))) }} ]</p>
          <h2>{{ aboutPage.blockText("why_us", "title", homePage.blockText("why_us", "title", t("home.whyTitle"))) }}</h2>
          <div class="wb-why__cards">
            <article v-for="item in whyUsItems" :key="item.title">
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="wb-factory-section">
      <div class="wb-wrap">
        <div class="wb-heading">
          <p>[ {{ homePage.blockText("factory", "subtitle", t("home.factoryEyebrow")) }} ]</p>
          <h2>{{ homePage.blockText("factory", "title", t("home.factoryTitle")) }}</h2>
        </div>
        <blockquote>{{ homePage.blockText("factory", "content", t("home.gmQuote")) }}</blockquote>
        <div v-if="factoryImages.length" class="wb-gallery-carousel">
          <button type="button" @click="shift(-1)">‹</button>
          <img :src="factoryImages[galleryIndex]" alt="" />
          <button type="button" @click="shift(1)">›</button>
        </div>
      </div>
    </section>

    <section class="wb-section wb-section--light">
      <div class="wb-wrap">
        <div class="wb-heading">
          <p>[ {{ homePage.blockText("cases", "subtitle", t("home.casesEyebrow")) }} ]</p>
          <h2>{{ homePage.blockText("cases", "title", t("home.casesTitle")) }}</h2>
        </div>
        <div class="wb-solution-cards">
          <article v-for="item in cases" :key="item.slug" class="wb-case-card wb-case-card--static" :style="{ backgroundImage: `linear-gradient(180deg, transparent, rgb(16 27 31 / 92%)), url(${item.image})` }">
            <span>{{ item.industry }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.solution }}</p>
            <RouterLink v-if="item.productSlug" :to="`/products/${item.productSlug}`">{{ t("common.viewDetails") }} →</RouterLink>
          </article>
        </div>
      </div>
    </section>
  </SiteLayout>
</template>
