<template>
  <div class="shell">
    <header class="top">
      <router-link to="/" class="brand">
        <img src="/logo.png" alt="" />
        <span>洽思英语</span>
      </router-link>
      <router-link to="/profile" class="who">
        <span class="nm">{{ name }}</span>
        <img class="ava" :src="face" alt="" />
      </router-link>
    </header>
    <main>
      <router-view />
    </main>
    <nav class="dock">
      <router-link to="/" :class="{ on: route.path === '/' || route.path.startsWith('/learn') }">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 6.6A2.6 2.6 0 0 0 9.4 4H5a2 2 0 0 0-2 2v12.5a1.5 1.5 0 0 1 1.5-1.5H12V6.6Z" />
          <path d="M12 6.6A2.6 2.6 0 0 1 14.6 4H19a2 2 0 0 1 2 2v12.5a1.5 1.5 0 0 0-1.5-1.5H12V6.6Z" />
        </svg>
        <span>学习中心</span>
      </router-link>
      <router-link to="/newwords">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.5 3h11a1 1 0 0 1 1 1v16.2a.8.8 0 0 1-1.2.7L12 17.6l-5.3 3.3a.8.8 0 0 1-1.2-.7V4a1 1 0 0 1 1-1Z" />
        </svg>
        <span>生词本</span>
      </router-link>
      <router-link to="/profile">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm-7.5 8.3A7.5 7.5 0 0 1 12 15a7.5 7.5 0 0 1 7.5 5.3l.2.7H4.3l.2-.7Z" />
        </svg>
        <span>个人中心</span>
      </router-link>
    </nav>
    <div v-if="leaveAsk" class="leave-mask" @click.self="answerLeave(false)">
      <div class="sheet leave-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-title">
        <h3 id="leave-title">是否退出当前学习？</h3>
        <div class="leave-actions">
          <button class="btn" type="button" @click="answerLeave(false)">继续学习</button>
          <button class="btn danger" type="button" @click="answerLeave(true)">退出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { avatarUrl, profile, sessionVersion } from "@/api";
import { answerLeave, leaveAsk } from "@/learnSession";

const route = useRoute();
const name = computed(() => profile()?.realname || "学员");
const face = computed(() => {
  sessionVersion.value;
  return avatarUrl(profile()?.avatar);
});

function onKey(event: KeyboardEvent) {
  if (event.key === "Escape" && leaveAsk.value) answerLeave(false);
}

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<style scoped>
.shell { min-height: 100vh; }
.top {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 64px;
  padding: 0 clamp(16px, 2.5vw, 40px);
  background: rgba(227, 238, 251, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 9px; font-size: 18px; font-weight: 800; white-space: nowrap; }
.brand img { height: 30px; width: auto; }
.who { display: flex; align-items: center; gap: 10px; }
.who .nm { font-size: 14px; font-weight: 600; color: var(--muted); white-space: nowrap; }
.ava {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  box-shadow: 0 4px 10px rgba(62, 111, 227, 0.32);
}

.dock {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid rgba(31, 42, 77, 0.07);
  box-shadow: 0 12px 32px rgba(31, 42, 77, 0.16);
}
.dock a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 24px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}
.dock a svg { width: 19px; height: 19px; }
.dock a:hover { color: var(--blue-deep); }
.dock a.router-link-exact-active,
.dock a.on {
  background: var(--blue);
  color: #fff;
  box-shadow: 0 6px 16px rgba(62, 111, 227, 0.36);
}

@media (max-width: 640px) {
  .brand span { display: none; }
  .who .nm { display: none; }
  .dock { bottom: calc(14px + env(safe-area-inset-bottom)); }
  .dock a { padding: 10px 12px; font-size: 12px; gap: 4px; }
}

.leave-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(16, 22, 44, 0.48);
  backdrop-filter: blur(4px);
}
.leave-dialog { width: min(420px, 100%); }
.leave-dialog h3 { margin: 0; font-size: 22px; }
.leave-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
</style>
