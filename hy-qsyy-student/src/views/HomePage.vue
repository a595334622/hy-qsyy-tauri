<template>
  <div class="page home">
    <p class="sec">第一步 · 选模块</p>
    <div class="mods">
      <button
        v-for="item in modules"
        :key="item.mode"
        type="button"
        class="mod"
        :class="[`m-${item.mode}`, { on: activeMode === item.mode }]"
        @click="pick(item.mode)"
      >
        <span class="badge">{{ item.mark }}</span>
        <span class="txt">
          <b>{{ item.name }}</b>
          <span class="cap">{{ item.en }}</span>
        </span>
        <svg class="ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m4 12.5 5 5L20 6.5" />
        </svg>
      </button>
    </div>

    <div class="sec-row">
      <p class="sec">第二步 · 选教材，进入「{{ activeName }}」</p>
      <button v-if="hasTrial" type="button" class="clear-trial" @click="clearAsk = true">清空体验课学习记录</button>
    </div>
    <div class="books">
      <button
        v-for="book in books"
        :key="book.id"
        type="button"
        class="book"
        :class="{ on: book.id === currentId }"
        @click="openBook(book)"
      >
        <span class="cover">
          <img :src="coverOf(book)" alt="" loading="lazy" />
          <i v-if="book.id === currentId" class="using">在学</i>
        </span>
        <b>{{ book.name }}</b>
        <span class="prog">{{ percentOf(book) }}</span>
        <span class="meta">{{ meta(book) }}</span>
      </button>
    </div>
    <p v-if="!books.length" class="muted none">暂无教材</p>

    <div v-if="clearAsk" class="mask" @click.self="clearAsk = false">
      <div class="ask" role="dialog" aria-modal="true">
        <h3>清空体验课学习记录？</h3>
        <p>只清空体验课教材的学习进度、测试和生词。正式教材不会动，清空后不能恢复。</p>
        <div class="ask-actions">
          <button type="button" @click="clearAsk = false">取消</button>
          <button type="button" class="danger" :disabled="clearing" @click="doClear">{{ clearing ? "清空中..." : "清空" }}</button>
        </div>
        <p v-if="clearTip" class="clear-tip">{{ clearTip }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api, fileUrl } from "@/api";

const router = useRouter();
const books = ref<any[]>([]);
const currentId = ref<number | null>(Number(sessionStorage.getItem("qsyy-book") || 0) || null);
const activeMode = ref(sessionStorage.getItem("qsyy-mode") || "recite");
const clearAsk = ref(false);
const clearing = ref(false);
const clearTip = ref("");
const modules = [
  { mode: "recite", name: "认读速记", en: "看词认意思", mark: "读" },
  { mode: "listen", name: "听音辩词", en: "听音认单词", mark: "听" },
  { mode: "spell", name: "拼写训练", en: "听音写单词", mark: "写" }
];
const activeName = computed(() => modules.find(item => item.mode === activeMode.value)?.name || "学习");
const hasTrial = computed(() => books.value.some(book => book.trial === 1));

onMounted(async () => {
  if (!modules.some(item => item.mode === activeMode.value)) {
    activeMode.value = "recite";
    sessionStorage.setItem("qsyy-mode", "recite");
  }
  await loadBooks();
});

async function loadBooks() {
  const res: any = await api(`/student/learn/textbooks?module=${activeMode.value}`);
  books.value = res?.success ? res.result || [] : [];
}

function percentOf(book: any) {
  const n = Number(book.progress ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(2) : "0.00"}%`;
}

async function doClear() {
  clearTip.value = "";
  clearing.value = true;
  try {
    const res: any = await api("/student/learn/clearTrial", { method: "POST" });
    if (!res?.success) {
      clearTip.value = res?.message || "清空失败";
      return;
    }
    clearAsk.value = false;
    await loadBooks();
  } finally {
    clearing.value = false;
  }
}

function meta(book: any) {
  return [book.publisher, book.grade, book.volume].filter(Boolean).join(" · ");
}

function coverOf(book: any) {
  const path = book.cover || `textbook/cover/textbook-${book.id}.svg`;
  return fileUrl(String(path).replace(/^\//, ""));
}

function pick(mode: string) {
  activeMode.value = mode;
  sessionStorage.setItem("qsyy-mode", mode);
  loadBooks();
}

function openBook(book: any) {
  currentId.value = book.id;
  sessionStorage.setItem("qsyy-book", String(book.id));
  sessionStorage.setItem("qsyy-mode", activeMode.value);
  router.push(`/learn/${activeMode.value}`);
}
</script>

<style scoped>
.sec { margin: 4px 2px 16px; font-size: 18px; font-weight: 700; color: var(--muted); letter-spacing: 0.04em; }
.sec-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 32px 0 24px; }
.sec-row .sec { margin: 0; }
.clear-trial {
  flex: none;
  padding: 8px 14px;
  border: 0;
  border-radius: 999px;
  background: #fff;
  color: var(--bad);
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 8px 22px rgba(31, 42, 77, 0.05);
  cursor: pointer;
}
.clear-trial:hover { background: var(--bad-soft); }

.mods { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mod {
  --tone: var(--blue);
  --tint: var(--sky);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 148px;
  padding: 17px 20px;
  background: var(--card);
  border: 2px solid transparent;
  border-radius: 18px;
  box-shadow: 0 8px 22px rgba(31, 42, 77, 0.05);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}
.mod:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(31, 42, 77, 0.1); }
.mod:active { transform: scale(0.98); }
.mod.on { border-color: var(--tone); }
.badge {
  width: 46px;
  height: 46px;
  margin-bottom: auto;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--tint);
  color: var(--tone);
  font-size: 19px;
  font-weight: 800;
}
.txt { min-width: 0; text-align: left; }
.txt b { display: block; font-size: 21px; font-weight: 800; }
.cap { display: block; margin-top: 5px; font-size: 12.5px; color: var(--muted); }
.ok { display: none; position: absolute; top: 14px; right: 14px; width: 20px; height: 20px; color: var(--tone); }
.mod.on .ok { display: block; }
.m-recite { --tone: #3e6fe3; --tint: #e9f0ff; }
.m-listen { --tone: #7b5cf0; --tint: #efeefe; }
.m-spell  { --tone: #ef8a2c; --tint: #fdeedc; }

.books { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.book {
  padding: 0 0 14px;
  text-align: left;
  background: var(--card);
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 8px 22px rgba(31, 42, 77, 0.05);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}
.book:hover { transform: translateY(-3px); box-shadow: 0 14px 30px rgba(31, 42, 77, 0.1); }
.book:active { transform: scale(0.98); }
.book.on { box-shadow: 0 0 0 2.5px var(--blue), 0 14px 30px rgba(31, 42, 77, 0.1); }
.cover { position: relative; display: block; aspect-ratio: 5 / 7; background: var(--sky); }
.cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.using {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 11px;
  border-radius: 999px;
  background: rgba(31, 42, 77, 0.78);
  color: #fff;
  font-style: normal;
  font-size: 12px;
  font-weight: 600;
}
.book b { display: block; margin: 12px 14px 0; font-size: 14px; font-weight: 700; line-height: 1.4; }
.prog { display: block; margin: 6px 14px 0; color: var(--blue); font-size: 13px; font-weight: 800; }
.meta { display: block; margin: 4px 14px 0; font-size: 12px; color: var(--muted); }
.none { margin-top: 16px; }

.mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(16, 22, 44, 0.48);
}
.ask {
  width: min(420px, 100%);
  padding: 22px;
  border-radius: 18px;
  background: #fff;
}
.ask h3 { margin: 0; font-size: 18px; }
.ask p { margin: 10px 0 0; color: var(--muted); font-size: 14px; line-height: 1.6; }
.ask-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
.ask-actions button {
  min-width: 72px;
  height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: var(--sky);
  color: var(--blue-deep);
  font-weight: 700;
  cursor: pointer;
}
.ask-actions .danger { background: var(--bad); color: #fff; }
.ask-actions button:disabled { opacity: 0.6; cursor: default; }
.clear-tip { color: var(--bad); }

@media (max-width: 640px) {
  .mods { gap: 10px; }
  .mod { min-height: 118px; padding: 12px 14px; border-radius: 15px; }
  .txt b { font-size: 17px; }
  .badge { width: 38px; height: 38px; border-radius: 11px; font-size: 16px; }
  .ok { top: 10px; right: 10px; width: 16px; height: 16px; }
  .books { grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 12px; }
}
</style>
