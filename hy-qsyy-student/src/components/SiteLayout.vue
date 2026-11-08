<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { querySolutionList, type WebSolution } from "@/api/solution";
import { usePageContents, parseTitleTextList } from "@/composables/usePageContents";
import { useSiteContact } from "@/composables/useSiteContact";
import { useI18n } from "@/i18n";
import ChatWidget from "@/components/ChatWidget.vue";

const { siteContact } = useSiteContact();
const sitePage = usePageContents("site");
const homePage = usePageContents("home");

const mobileOpen = ref(false);
const solutions = ref<WebSolution[]>([]);
const { currentLanguage, localeOptions, isRtl, t } = useI18n();

const navItems = [
  { key: "nav.home", path: "/" },
  { key: "nav.products", path: "/products" },
  { key: "nav.solutions", path: "/solutions" },
  { key: "nav.about", path: "/about" },
  { key: "nav.blog", path: "/blog" },
  { key: "nav.contact", path: "/contact" }
] as const;

const legalLinkDefs = [
  { blockCode: "shipping", path: "/shipping", labelKey: "site.shipping" },
  { blockCode: "terms", path: "/terms", labelKey: "site.terms" },
  { blockCode: "privacy", path: "/privacy", labelKey: "site.privacy" }
] as const;

const footerIntro = computed(() => sitePage.blockText("footer", "summary", t("site.footerIntro")));
const brandName = computed(() => sitePage.blockText("meta", "title", t("site.brand")));
const socialLinks = computed(() => {
  const items = parseTitleTextList(sitePage.block("footer")?.extraJson);
  return items
    .map((item) => ({ label: item.title, href: (item.text || "").trim() }))
    .filter((item) => item.label && item.href && item.href !== "#");
});
const legalLinks = computed(() =>
  legalLinkDefs.map((item) => ({
    path: item.path,
    label: sitePage.blockText(item.blockCode, "title", t(item.labelKey))
  }))
);
const faqBannerTitle = computed(() => homePage.blockText("faq", "title", t("site.faqBannerTitle")));
const faqBannerText = computed(() => homePage.blockText("faq", "summary", t("site.faqBannerText")));
const contactAddress = computed(() => siteContact.value.address || t("contact.addressValue"));

function closeMenu() {
  mobileOpen.value = false;
}

async function loadSolutions() {
  try {
    solutions.value = await querySolutionList();
  } catch {
    solutions.value = [];
  }
}

onMounted(loadSolutions);
watch(currentLanguage, loadSolutions);
</script>

<template>
  <div class="wb-site" :dir="isRtl ? 'rtl' : 'ltr'" :lang="currentLanguage">
    <div class="wb-topbar">
      <div class="wb-wrap wb-topbar__inner">
        <div class="wb-topbar__left">
          <span class="wb-topbar__item">
            <svg class="wb-topbar__icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
            <span>{{ t("topbar.officeAddress") }}: {{ contactAddress }}</span>
          </span>
          <a class="wb-topbar__item" :href="siteContact.whatsappLink" target="_blank" rel="noopener">
            <svg class="wb-topbar__icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8c1.5 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
            <span>{{ t("topbar.phoneWhatsApp") }}: {{ siteContact.phone }}</span>
          </a>
          <a class="wb-topbar__item" :href="`mailto:${siteContact.email}`">
            <svg class="wb-topbar__icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z"/></svg>
            <span>{{ siteContact.email }}</span>
          </a>
        </div>
        <div class="wb-topbar__social">
          <a
            v-for="item in socialLinks"
            :key="item.label"
            :href="item.href"
            :aria-label="item.label"
            class="wb-topbar__social-link"
            target="_blank"
            rel="noopener"
          >
            <svg v-if="item.label.toLowerCase().includes('facebook')" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13 10V7.5c0-.8.7-1.5 1.5-1.5H16V3h-2.2C11.8 3 10 4.8 10 7v3H8v3.5h2V21h3v-7.5h2.5L16 13h-3z"/></svg>
            <svg v-else-if="item.label.toLowerCase().includes('instagram')" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A5.5 5.5 0 1 0 16.5 13 5.5 5.5 0 0 0 12 7.5zm6.2-.9a1.1 1.1 0 1 0-1.1 1.1 1.1 1.1 0 0 0 1.1-1.1z"/></svg>
            <svg v-else-if="item.label.toLowerCase().includes('tiktok')" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.5 3c.4 2.2 1.8 4 3.9 4.7V11c-1.8 0-3.4-.6-4.7-1.5v6.8c0 3.4-2.7 6.1-6.1 6.1S3.5 19.7 3.5 16.3 6.2 10.2 9.6 10.2c.4 0 .8 0 1.2.1v3.9c-.3-.1-.7-.2-1-.2-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5V3h3.2z"/></svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21 8.5a2.8 2.8 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
          </a>
        </div>
      </div>
    </div>

    <header class="wb-header">
      <div class="wb-wrap wb-header__inner">
        <RouterLink class="wb-brand" to="/" @click="closeMenu">
          <img src="/logo.png" :alt="brandName" />
          <span>{{ brandName }}</span>
        </RouterLink>

        <button class="wb-menu" type="button" :aria-expanded="mobileOpen" @click="mobileOpen = !mobileOpen">
          <span></span><span></span><span></span>
        </button>

        <nav class="wb-nav" :class="{ open: mobileOpen }">
          <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" @click="closeMenu">
            {{ t(item.key) }}
          </RouterLink>
        </nav>

        <div class="wb-tools">
          <select v-model="currentLanguage" :aria-label="t('site.search')">
            <option v-for="item in localeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <RouterLink class="wb-contact" to="/contact">{{ t("site.communicate") }}</RouterLink>
        </div>
      </div>
    </header>

    <slot />
    <ChatWidget />

    <section class="wb-faq-banner">
      <div class="wb-wrap wb-faq-banner__grid">
        <div>
          <p class="wb-kicker">{{ t("site.inquiry") }}</p>
          <h2>{{ faqBannerTitle }}</h2>
          <p>{{ faqBannerText }}</p>
          <RouterLink class="wb-btn wb-btn--primary" to="/contact">{{ t("site.startProject") }} <b>→</b></RouterLink>
        </div>
        <div class="wb-faq-banner__contact">
          <div><span>{{ t("contact.phoneLabel") }}</span><strong>{{ siteContact.phone }}</strong></div>
          <div><span>{{ t("contact.emailLabel") }}</span><strong>{{ siteContact.email }}</strong></div>
          <div><span>{{ t("contact.addressLabel") }}</span><strong>{{ contactAddress }}</strong></div>
        </div>
      </div>
    </section>

    <footer class="wb-footer">
      <div class="wb-wrap">
        <div class="wb-footer__top">
          <div>
            <img src="/logo.png" :alt="brandName" />
            <p>{{ footerIntro }}</p>
            <div v-if="socialLinks.length" class="wb-footer__social">
              <a v-for="item in socialLinks" :key="item.label" :href="item.href" target="_blank" rel="noopener">{{ item.label }}</a>
            </div>
          </div>
          <div>
            <strong>{{ t("site.quickNav") }}</strong>
            <RouterLink v-for="item in navItems" :key="item.path" :to="item.path">{{ t(item.key) }}</RouterLink>
          </div>
          <div>
            <strong>{{ t("site.solutions") }}</strong>
            <RouterLink v-for="item in solutions" :key="item.slug" :to="`/solutions/${item.slug}`">
              {{ item.name }}
            </RouterLink>
          </div>
          <div>
            <strong>{{ t("site.productCategories") }}</strong>
            <RouterLink to="/products?category=semi">{{ t("site.semiSeries") }}</RouterLink>
            <RouterLink to="/products?category=special">{{ t("site.specialSeries") }}</RouterLink>
          </div>
        </div>
        <div class="wb-footer__bottom">
          <span>© {{ new Date().getFullYear() }} {{ brandName }}. {{ t("site.rights") }}.</span>
          <span>
            <template v-for="(item, index) in legalLinks" :key="item.path">
              <RouterLink :to="item.path">{{ item.label }}</RouterLink>
              <span v-if="index < legalLinks.length - 1" aria-hidden="true">·</span>
            </template>
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>
