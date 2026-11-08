<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { queryBlogArticleList, type WebBlogArticle } from "@/api/blogArticle";
import PageHero from "@/components/PageHero.vue";
import SiteLayout from "@/components/SiteLayout.vue";
import { usePageContents } from "@/composables/usePageContents";
import { usePageSeo } from "@/composables/usePageSeo";
import { useI18n } from "@/i18n";

const { currentLanguage, t } = useI18n();
const { blockImage, blockText } = usePageContents("blog");
usePageSeo("blog");
const blogPosts = ref<WebBlogArticle[]>([]);
const heroImage = computed(() => blockImage("hero"));

async function loadBlogPosts() {
  try {
    blogPosts.value = await queryBlogArticleList();
  } catch {
    blogPosts.value = [];
  }
}

onMounted(loadBlogPosts);
watch(currentLanguage, loadBlogPosts);
</script>

<template>
  <SiteLayout>
    <PageHero
      :title="blockText('hero', 'title', t('blogPage.title'))"
      :summary="blockText('hero', 'summary', t('blogPage.summary'))"
      :image="heroImage"
      :page-label="t('nav.blog')"
    />

    <section class="wb-section wb-section--light">
      <div class="wb-wrap">
        <div class="wb-blog-grid wb-blog-grid--page">
          <RouterLink v-for="post in blogPosts" :key="post.slug" class="wb-blog-card" :to="`/blog/${post.slug}`">
            <img :src="post.image" :alt="post.title" />
            <div>
              <span>{{ post.date }}</span>
              <h3>{{ post.title }}</h3>
              <p>{{ post.summary }}</p>
              <em>{{ t("home.readMore") }} →</em>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>
  </SiteLayout>
</template>
