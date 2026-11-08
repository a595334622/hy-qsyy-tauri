<template>
  <div class="page star">
    <section class="sheet bag">
      <p class="tag warm">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5l2.6 6 6.4.6-4.8 4.3 1.4 6.3L12 16.5l-5.6 3.2 1.4-6.3L3 9.1l6.4-.6 2.6-6Z" />
        </svg>
        碎片袋
      </p>
      <h2 class="display h">攒碎片，点亮语法</h2>
      <p v-if="!points.length" class="muted empty">这本教材还没有语法点</p>
      <article v-for="item in points" :key="item.id" class="row">
        <b>{{ item.grammarName }}</b>
        <span class="dots">
          <i v-for="n in needOf(item)" :key="n" :class="{ on: n <= countOf(item), lit: isLit(item.id) }"></i>
        </span>
        <button v-if="ready(item)" class="btn warm lit-btn" type="button" @click="pending = item">归纳点亮</button>
        <span v-else-if="isLit(item.id)" class="tag good">已点亮</span>
        <em v-else>{{ countOf(item) }}/{{ needOf(item) }}</em>
      </article>
      <button class="btn ghost gain" type="button" :disabled="!points.length" @click="gain">获得一块碎片</button>
    </section>

    <section class="sky">
      <div class="sky-head">
        <p class="tag">语法星图</p>
        <span class="lit-count">{{ litCount }} / {{ points.length }} 已点亮</span>
      </div>
      <div class="field">
        <button
          v-for="item in points"
          :key="item.id"
          type="button"
          class="node"
          :class="{ lit: isLit(item.id), ready: ready(item) }"
          :style="{ left: item.mapX + '%', top: item.mapY + '%' }"
          @click="open(item)"
        >
          <i></i>
          <span>{{ item.grammarName }}</span>
        </button>
      </div>
      <p class="hint">集齐碎片的星星可以点亮，点亮后随时回看讲义</p>
    </section>

    <div v-if="pending" class="mask" @click.self="pending = null">
      <div class="sheet dialog">
        <h3>点亮「{{ pending.grammarName }}」</h3>
        <p>用掉 {{ needOf(pending) }} 块碎片后，可以一直查看这份讲义。</p>
        <div class="actions">
          <button class="btn ghost" type="button" @click="pending = null">取消</button>
          <button class="btn warm" type="button" @click="confirm">确认点亮</button>
        </div>
      </div>
    </div>

    <div v-if="handbook" class="mask" @click.self="handbook = null">
      <div class="sheet dialog handbook">
        <p class="tag">讲义</p>
        <h3 class="display dh">{{ handbook.grammarName }}</h3>
        <template v-if="isLit(handbook.id)">
          <p v-if="handbook.definition"><b>定义</b>{{ handbook.definition }}</p>
          <p v-if="handbook.rules"><b>规则</b>{{ handbook.rules }}</p>
          <p v-if="handbook.pitfalls"><b>易错点</b>{{ handbook.pitfalls }}</p>
          <p v-if="handbook.examples"><b>例句</b>{{ handbook.examples }}</p>
          <p v-if="handbook.examMethod"><b>应试</b>{{ handbook.examMethod }}</p>
        </template>
        <p v-else class="muted">集齐碎片并归纳后，才能打开讲义。</p>
        <button class="btn" type="button" @click="handbook = null">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api } from "@/api";
import { addFragment, lightStar, starState } from "@/stars";

const points = ref<any[]>([]);
const state = ref(starState());
const pending = ref<any>(null);
const handbook = ref<any>(null);
const litCount = computed(() => points.value.filter(item => isLit(item.id)).length);

onMounted(async () => {
  const bookId = sessionStorage.getItem("qsyy-book");
  if (!bookId) return;
  const res: any = await api(`/student/learn/grammar?textbookId=${bookId}`);
  points.value = res?.success ? res.result || [] : [];
});

function needOf(item: any) {
  return item.fragmentNeed || 5;
}
function countOf(item: any) {
  return state.value.fragments[String(item.id)] || 0;
}
function isLit(id: number) {
  return state.value.lit.includes(id);
}
function ready(item: any) {
  return !isLit(item.id) && countOf(item) >= needOf(item);
}
function gain() {
  const target = points.value.find(item => !isLit(item.id)) || points.value[0];
  if (!target) return;
  state.value = addFragment(target.id);
}
function confirm() {
  if (!pending.value) return;
  state.value = lightStar(pending.value.id, needOf(pending.value));
  handbook.value = pending.value;
  pending.value = null;
}
function open(item: any) {
  if (ready(item)) pending.value = item;
  else handbook.value = item;
}
</script>

<style scoped>
.star { display: grid; grid-template-columns: minmax(380px, 460px) minmax(0, 1fr); gap: 16px; align-items: stretch; }
.h { margin-top: 12px; font-size: clamp(24px, 3vw, 32px); }
.empty { margin-top: 18px; }
.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 12px;
  align-items: center;
  margin-top: 12px;
  padding: 13px 14px;
  border-radius: 14px;
  background: var(--wash);
}
.row b { font-size: 15px; }
.dots { grid-column: 1 / -1; display: flex; gap: 5px; }
.dots i { width: 10px; height: 10px; border-radius: 50%; background: #dbe6f6; transition: background 0.25s ease, box-shadow 0.25s ease; }
.dots i.on { background: var(--sun); box-shadow: 0 0 6px rgba(245, 174, 43, 0.55); }
.dots i.lit { background: var(--ink); box-shadow: none; }
.row em { color: var(--muted); font-style: normal; font-size: 13px; font-family: var(--en); }
.lit-btn { min-height: 38px; padding: 0 14px; font-size: 14px; border-radius: 11px; }
.gain { width: 100%; margin-top: 16px; }

.sky { border-radius: 20px; background: var(--card); box-shadow: 0 10px 30px rgba(31, 42, 77, 0.05); padding: 24px; }
.sky-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.lit-count {
  padding: 5px 13px;
  border-radius: 999px;
  background: var(--sun-soft);
  color: var(--sun-deep);
  font-family: var(--en);
  font-size: 13px;
  font-weight: 700;
}
.field {
  position: relative;
  height: 560px;
  margin-top: 18px;
  border-radius: 18px;
  overflow: hidden;
  background:
    radial-gradient(1.6px 1.6px at 12% 24%, rgba(255, 255, 255, 0.9), transparent 60%),
    radial-gradient(1.4px 1.4px at 78% 12%, rgba(255, 255, 255, 0.7), transparent 60%),
    radial-gradient(1.8px 1.8px at 30% 68%, rgba(255, 255, 255, 0.75), transparent 60%),
    radial-gradient(1.2px 1.2px at 55% 36%, rgba(255, 255, 255, 0.55), transparent 60%),
    radial-gradient(1.6px 1.6px at 88% 58%, rgba(255, 255, 255, 0.8), transparent 60%),
    radial-gradient(1.2px 1.2px at 42% 88%, rgba(255, 255, 255, 0.6), transparent 60%),
    radial-gradient(1.8px 1.8px at 66% 80%, rgba(255, 255, 255, 0.65), transparent 60%),
    radial-gradient(1.3px 1.3px at 8% 82%, rgba(255, 255, 255, 0.5), transparent 60%),
    radial-gradient(1.5px 1.5px at 92% 30%, rgba(255, 255, 255, 0.6), transparent 60%),
    radial-gradient(2px 2px at 20% 46%, rgba(245, 205, 130, 0.8), transparent 65%),
    radial-gradient(1.6px 1.6px at 72% 50%, rgba(245, 205, 130, 0.6), transparent 65%),
    radial-gradient(120% 130% at 50% 0%, #2c3768 0%, var(--night) 58%, #131a38 100%);
}
.node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 110px;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.node i {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 0 0 7px rgba(255, 255, 255, 0.07);
  transition: box-shadow 0.25s ease, background 0.25s ease;
}
.node span { font-size: 13px; color: rgba(255, 255, 255, 0.66); text-shadow: 0 1px 6px rgba(10, 14, 32, 0.9); transition: color 0.25s ease; }
.node.ready i {
  background: var(--sun);
  box-shadow: 0 0 0 7px rgba(245, 174, 43, 0.22);
  animation: pulse 1.8s ease-in-out infinite;
}
.node.ready span { color: #ffd98a; }
.node.lit i {
  background: radial-gradient(circle at 34% 32%, #ffe3a1, var(--sun) 62%);
  box-shadow: 0 0 18px 5px rgba(245, 174, 43, 0.55), 0 0 0 7px rgba(245, 174, 43, 0.16);
}
.node.lit span { color: rgba(255, 255, 255, 0.95); font-weight: 600; }
.node:hover i { transform: scale(1.12); }
.node i { transition: box-shadow 0.25s ease, background 0.25s ease, transform 0.15s ease; }
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 5px rgba(245, 174, 43, 0.28); }
  50% { box-shadow: 0 0 0 12px rgba(245, 174, 43, 0.08); }
}
.hint { margin: 14px 2px 0; color: var(--muted); font-size: 13px; }

.mask {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(16, 22, 44, 0.48);
  backdrop-filter: blur(4px);
}
.dialog { width: min(560px, 100%); }
.dialog h3 { margin: 0 0 10px; font-size: 20px; }
.dialog p { margin: 12px 0; line-height: 1.7; white-space: pre-line; }
.dialog b { display: block; margin-bottom: 4px; color: var(--blue-deep); }
.actions { display: flex; justify-content: flex-end; gap: 10px; }
.handbook .dh { margin-top: 12px; font-size: 30px; }
@media (max-width: 1100px) {
  .star { grid-template-columns: 1fr; }
  .field { height: 420px; }
}
</style>
