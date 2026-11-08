<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useI18n } from "@/i18n";

defineProps<{ title: string; summary?: string; image?: string; pageLabel: string }>();
const { t } = useI18n();
</script>

<template>
  <section class="wb-page-hero" :style="image ? { backgroundImage: `linear-gradient(90deg, rgb(14 22 26 / 92%), rgb(14 22 26 / 55%)), url(${image})` } : undefined">
    <div class="wb-wrap">
      <p class="wb-breadcrumb">
        <RouterLink to="/">{{ t("common.home") }}</RouterLink> / {{ pageLabel }}
      </p>
      <h1>{{ title }}</h1>
      <p v-if="summary">{{ summary }}</p>
    </div>
  </section>
</template>
