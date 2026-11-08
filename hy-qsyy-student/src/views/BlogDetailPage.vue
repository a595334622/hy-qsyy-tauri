<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { queryBlogArticleDetail, queryBlogArticleList, type WebBlogArticle } from "@/api/blogArticle";
import PageHero from "@/components/PageHero.vue";
import SiteLayout from "@/components/SiteLayout.vue";
import { applyRecordSeo } from "@/composables/usePageSeo";
import { useI18n } from "@/i18n";

const route = useRoute();
const { currentLanguage, t } = useI18n();
const post = ref<WebBlogArticle | null>(null);
const allPosts = ref<WebBlogArticle[]>([]);

const related = ref<WebBlogArticle[]>([]);

async function loadBlogPost() {
  const slug = String(route.params.slug);
  try {
    const [detail, list] = await Promise.all([queryBlogArticleDetail(slug), queryBlogArticleList()]);
    post.value = detail;
    allPosts.value = list;
    related.value = list.filter((item) => item.slug !== slug).slice(0, 3);
  } catch {
    post.value = null;
    allPosts.value = [];
    related.value = [];
  }
}

onMounted(loadBlogPost);
watch([currentLanguage, () => route.params.slug], loadBlogPost);
watch(post, (value) => {
  if (!value) return;
  applyRecordSeo({
    seoTitle: value.seoTitle,
    seoKeywords: value.seoKeywords,
    seoDescription: value.seoDescription,
    title: value.title,
    summary: value.summary
  });
});
</script>

<template>
  <SiteLayout>
    <template v-if="post">
      <PageHero
        :title="post.title"
        :summary="post.summary"
        :image="post.image"
        :page-label="t('nav.blog')"
      />

      <section class="wb-section wb-section--light">
        <div class="wb-wrap wb-article">
          <p class="wb-article__meta">{{ post.date }}</p>
          <p>{{ post.summary }}</p>
          <p v-if="post.body1">{{ post.body1 }}</p>
          <p v-if="post.body2">{{ post.body2 }}</p>
          <img :src="post.image" :alt="post.title" />
          <p v-if="post.body3">{{ post.body3 }}</p>
          <RouterLink class="wb-btn wb-btn--primary" to="/contact">{{ t("home.getQuote") }} <b>→</b></RouterLink>
        </div>
      </section>

      <section class="wb-section">
        <div class="wb-wrap">
          <div class="wb-heading"><h2>{{ t("blogDetail.related") }}</h2></div>
          <div class="wb-blog-grid">
            <RouterLink v-for="item in related" :key="item.slug" class="wb-blog-card" :to="`/blog/${item.slug}`">
              <img :src="item.image" :alt="item.title" />
              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.summary }}</p>
              </div>
            </RouterLink>
          </div>
        </div>
      </section>
    </template>

    <section v-else class="wb-section">
      <div class="wb-wrap"><RouterLink to="/blog">{{ t("nav.blog") }}</RouterLink></div>
    </section>
  </SiteLayout>
</template>
