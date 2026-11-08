<template>
  <div v-if="open" class="shell-menu" role="presentation" @click.self="open = false">
    <div class="shell-menu-card" role="dialog" aria-modal="true" aria-label="清理缓存或关闭程序">
      <button type="button" class="shell-menu-close" aria-label="关闭" :disabled="busy" @click="open = false">×</button>
      <p v-if="error" class="shell-menu-error" role="alert">{{ error }}</p>
      <button type="button" :disabled="busy" @click="clearCache">{{ busy ? "正在清理..." : "清理缓存" }}</button>
      <button type="button" class="danger" :disabled="busy" @click="quit">关闭程序</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { clearBrowserCache, quitApp } from "@/utils/tauri";

const open = ref(false);
const busy = ref(false);
const error = ref("");

function onKey(event: KeyboardEvent) {
  const menuKey = event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.code === "KeyX";
  if (menuKey && !event.repeat) {
    event.preventDefault();
    event.stopPropagation();
    error.value = "";
    open.value = !open.value;
    return;
  }
  if (open.value && event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    open.value = false;
  }
}

async function clearPageStorage() {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(";").forEach(item => {
    const name = item.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }
  if (indexedDB.databases) {
    const bases = await indexedDB.databases();
    await Promise.all(
      bases.filter(item => item.name).map(
        item =>
          new Promise<void>(resolve => {
            const request = indexedDB.deleteDatabase(item.name as string);
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
            request.onblocked = () => resolve();
          })
      )
    );
  }
  if (navigator.serviceWorker) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(item => item.unregister()));
  }
}

async function clearCache() {
  busy.value = true;
  error.value = "";
  try {
    await clearBrowserCache();
    await clearPageStorage();
    await new Promise(resolve => setTimeout(resolve, 300));
    location.reload();
  } catch (reason) {
    error.value = typeof reason === "string" && reason ? reason : "清理失败";
    busy.value = false;
  }
}

async function quit() {
  busy.value = true;
  try {
    await quitApp();
  } catch {
    error.value = "关闭失败";
    busy.value = false;
  }
}

onMounted(() => window.addEventListener("keydown", onKey, true));
onUnmounted(() => window.removeEventListener("keydown", onKey, true));
</script>
