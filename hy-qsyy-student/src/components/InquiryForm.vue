<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { submitInquiry } from "@/api/inquiry";
import { useI18n } from "@/i18n";

const { currentLanguage, t } = useI18n();
const route = useRoute();

const name = ref("");
const email = ref("");
const phone = ref("");
const message = ref("");
const submitting = ref(false);
const submitted = ref(false);
const errorText = ref("");

async function onSubmit(event: Event) {
  event.preventDefault();
  if (submitting.value) return;
  submitting.value = true;
  errorText.value = "";
  try {
    await submitInquiry({
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      message: message.value.trim(),
      languageCode: currentLanguage.value,
      sourcePage: route.fullPath
    });
    submitted.value = true;
    name.value = "";
    email.value = "";
    phone.value = "";
    message.value = "";
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : t("contact.submitFail");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form class="wb-form" @submit="onSubmit">
    <label>{{ t("contact.name") }}<input v-model="name" required /></label>
    <label>{{ t("contact.email") }}<input v-model="email" type="email" /></label>
    <label>{{ t("contact.phone") }}<input v-model="phone" /></label>
    <label>{{ t("contact.message") }}<textarea v-model="message" rows="4" required></textarea></label>
    <button type="submit" :disabled="submitting">{{ submitting ? t("contact.submitting") : t("contact.submit") }} <b>→</b></button>
    <p v-if="submitted" class="wb-form__success">{{ t("contact.submitSuccess") }}</p>
    <p v-if="errorText" class="wb-form__error">{{ errorText }}</p>
  </form>
</template>
