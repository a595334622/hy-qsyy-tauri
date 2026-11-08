<template>
  <div class="blocked">
    <div class="blocked-card">
      <img class="blocked-logo" src="/logo.png" alt="洽思英语" />
      <h1>输入秘钥</h1>
      <p>向学校领取客户端秘钥。这台电脑第一次打开时填写，验证后会记在本机。</p>
      <form class="activate-form" @submit.prevent="submit">
        <label for="secret">秘钥</label>
        <input id="secret" v-model="secret" autocomplete="off" placeholder="请输入秘钥" />
        <p class="activate-error" role="alert">{{ error }}</p>
        <button :disabled="loading">{{ loading ? "验证中..." : "验证并进入" }}</button>
      </form>
      <p class="activate-machine">本机编码 {{ machineCode }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/api";
import { licenseMessage, licensed, machineCode, saveClientSecret, savedSecret } from "@/utils/tauri";

const router = useRouter();
const secret = ref(savedSecret.value);
const error = ref(licenseMessage.value);
const loading = ref(false);

const submit = async () => {
  const value = secret.value.trim();
  if (!value) {
    error.value = "请输入秘钥";
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const res: any = await api("/student/client/activate", {
      method: "POST",
      body: { secret: value, machineCode: machineCode.value }
    });
    if (!res?.success) {
      error.value = res?.message || "授权失败";
      return;
    }
    await saveClientSecret(value);
    licensed.value = true;
    licenseMessage.value = "";
    await router.replace("/login");
  } catch {
    error.value = "授权失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};
</script>
