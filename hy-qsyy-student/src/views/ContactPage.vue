<script setup lang="ts">
import { computed } from "vue";
import InquiryForm from "@/components/InquiryForm.vue";
import PageHero from "@/components/PageHero.vue";
import SiteLayout from "@/components/SiteLayout.vue";
import { parseStringList, usePageContents } from "@/composables/usePageContents";
import { usePageSeo } from "@/composables/usePageSeo";
import { useSiteContact } from "@/composables/useSiteContact";
import { useI18n } from "@/i18n";

const { t } = useI18n();
const { siteContact } = useSiteContact();
const page = usePageContents("contact");
const homePage = usePageContents("home");
usePageSeo("contact");

const heroImage = computed(() => page.blockImage("hero"));
const ctaImage = computed(() => homePage.blockImage("cta"));
const ctaPromises = computed(() => parseStringList(homePage.block("cta")?.extraJson));
const inquiryStyle = computed(() =>
  ctaImage.value
    ? { backgroundImage: `linear-gradient(90deg, rgb(16 27 31 / 95%), rgb(16 27 31 / 70%)), url(${ctaImage.value})` }
    : undefined
);
</script>

<template>
  <SiteLayout>
    <PageHero
      :title="page.blockText('hero', 'title', t('contact.title'))"
      :summary="page.blockText('hero', 'summary', t('contact.summary'))"
      :image="heroImage"
      :page-label="t('nav.contact')"
    />

    <section class="wb-section wb-section--light">
      <div class="wb-wrap wb-contact-cards">
        <article>
          <span>{{ t("contact.phoneLabel") }}</span>
          <strong>{{ siteContact.phone }}</strong>
          <a :href="`tel:${siteContact.phone}`">{{ t("site.communicate") }}</a>
        </article>
        <article>
          <span>{{ t("contact.emailLabel") }}</span>
          <strong>{{ siteContact.email }}</strong>
          <a :href="`mailto:${siteContact.email}`">{{ t("site.mail") }}</a>
        </article>
        <article>
          <span>{{ t("contact.addressLabel") }}</span>
          <strong>{{ siteContact.address || t("contact.addressValue") }}</strong>
        </article>
      </div>
    </section>

    <section class="wb-inquiry" :style="inquiryStyle">
      <div class="wb-wrap wb-inquiry__grid">
        <div>
          <p class="wb-kicker">[ {{ t("contact.withUs") }} ]</p>
          <h2>{{ homePage.blockText("cta", "title", t("home.ctaTitle")) }}</h2>
          <p>{{ homePage.blockText("cta", "summary", t("home.ctaText")) }}</p>
          <ul v-if="ctaPromises.length" class="wb-inquiry__promises">
            <li v-for="item in ctaPromises" :key="item">{{ item }}</li>
          </ul>
        </div>
        <InquiryForm />
      </div>
    </section>
  </SiteLayout>
</template>
