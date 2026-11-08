<template>
  <section class="match">
    <header class="match-head">
      <div>
        <p class="tag">认读速记 · 单词连连看</p>
        <h2 class="display h">第 {{ groupIndex + 1 }} / {{ groupTotal }} 组</h2>
      </div>
      <p class="match-meta">本组 {{ words.length }} 个 · 已连对 {{ pairedCount }} 个</p>
    </header>

    <div ref="boardRef" class="match-board">
      <svg class="match-lines" aria-hidden="true">
        <line
          v-for="line in lines"
          :key="line.id"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
        />
      </svg>
      <div class="match-cols">
        <div class="match-col">
          <button
            v-for="item in enRows"
            :key="item.id"
            :ref="el => setEnRef(item.id, el)"
            type="button"
            class="match-item en"
            :class="itemState(item.id, 'en')"
            :disabled="paired.has(item.id)"
            @click="pickEn(item.id)"
          >
            {{ item.word }}
          </button>
        </div>
        <div class="match-col">
          <button
            v-for="item in zhRows"
            :key="item.key"
            :ref="el => setZhRef(item.key, el)"
            type="button"
            class="match-item zh"
            :class="itemState(item.wordId, 'zh', item.key)"
            :disabled="paired.has(item.wordId)"
            @click="pickZh(item)"
          >
            {{ item.text }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

interface WordRow {
  id: number;
  word?: string;
  pos?: string;
  meaning?: string;
}

interface ZhRow {
  key: string;
  wordId: number;
  text: string;
}

const props = defineProps<{
  words: WordRow[];
  groupIndex: number;
  groupTotal: number;
}>();

const emit = defineEmits<{ (e: "done"): void }>();

const boardRef = ref<HTMLElement | null>(null);
const enRefs = new Map<number, HTMLElement>();
const zhRefs = new Map<string, HTMLElement>();
const paired = ref(new Set<number>());
const pickEnId = ref<number | null>(null);
const pickZhKey = ref<string | null>(null);
const lines = ref<{ id: string; x1: number; y1: number; x2: number; y2: number }[]>([]);

const enRows = computed(() =>
  props.words.map(row => ({
    id: row.id,
    word: row.word || ""
  }))
);

function meaningOf(row: WordRow) {
  return [row.pos, row.meaning].filter(Boolean).join(" ").trim() || String(row.word || "");
}

const zhRows = ref<ZhRow[]>([]);

function shuffle<T>(list: T[]) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function loadZh() {
  enRefs.clear();
  zhRefs.clear();
  zhRows.value = shuffle(
    props.words.map(row => ({
      key: `zh-${row.id}`,
      wordId: row.id,
      text: meaningOf(row)
    }))
  );
  paired.value = new Set();
  pickEnId.value = null;
  pickZhKey.value = null;
  lines.value = [];
}

const pairedCount = computed(() => paired.value.size);

function setEnRef(id: number, el: unknown) {
  if (el instanceof HTMLElement) enRefs.set(id, el);
  else enRefs.delete(id);
}

function setZhRef(key: string, el: unknown) {
  if (el instanceof HTMLElement) zhRefs.set(key, el);
  else zhRefs.delete(key);
}

function itemState(wordId: number, side: "en" | "zh", zhKey?: string) {
  if (paired.value.has(wordId)) return "matched";
  if (side === "en" && pickEnId.value === wordId) return "pick";
  if (side === "zh" && pickZhKey.value === zhKey) return "pick";
  return "";
}

function sfx(ok: boolean) {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.12 : 0.18));
    osc.onended = () => ctx.close();
  } catch {
    // ignore
  }
}

function updateLine(wordId: number) {
  const en = enRefs.get(wordId);
  const zhKey = zhRows.value.find(row => row.wordId === wordId)?.key;
  const zh = zhKey ? zhRefs.get(zhKey) : undefined;
  const board = boardRef.value;
  if (!en || !zh || !board) return;
  const box = board.getBoundingClientRect();
  const a = en.getBoundingClientRect();
  const b = zh.getBoundingClientRect();
  const id = String(wordId);
  const line = {
    id,
    x1: a.right - box.left,
    y1: a.top - box.top + a.height / 2,
    x2: b.left - box.left,
    y2: b.top - box.top + b.height / 2
  };
  lines.value = [...lines.value.filter(item => item.id !== id), line];
}

function refreshLines() {
  if (!paired.value.size) return;
  lines.value = [...paired.value].map(wordId => {
    const en = enRefs.get(wordId);
    const zhKey = zhRows.value.find(row => row.wordId === wordId)?.key;
    const zh = zhKey ? zhRefs.get(zhKey) : undefined;
    const board = boardRef.value;
    if (!en || !zh || !board) return null;
    const box = board.getBoundingClientRect();
    const a = en.getBoundingClientRect();
    const b = zh.getBoundingClientRect();
    return {
      id: String(wordId),
      x1: a.right - box.left,
      y1: a.top - box.top + a.height / 2,
      x2: b.left - box.left,
      y2: b.top - box.top + b.height / 2
    };
  }).filter(Boolean) as typeof lines.value;
}

function tryPair() {
  const enId = pickEnId.value;
  const zh = zhRows.value.find(row => row.key === pickZhKey.value);
  if (enId == null || !zh) return;
  if (enId === zh.wordId) {
    paired.value = new Set([...paired.value, enId]);
    pickEnId.value = null;
    pickZhKey.value = null;
    sfx(true);
    nextTick(() => {
      updateLine(enId);
      if (paired.value.size >= props.words.length) {
        window.setTimeout(() => emit("done"), 420);
      }
    });
    return;
  }
  sfx(false);
  pickEnId.value = null;
  pickZhKey.value = null;
}

function pickEn(id: number) {
  if (paired.value.has(id)) return;
  pickEnId.value = pickEnId.value === id ? null : id;
  tryPair();
}

function pickZh(item: ZhRow) {
  if (paired.value.has(item.wordId)) return;
  pickZhKey.value = pickZhKey.value === item.key ? null : item.key;
  tryPair();
}

watch(
  () => props.words,
  () => {
    loadZh();
    nextTick(() => refreshLines());
  },
  { immediate: true }
);

function onResize() {
  refreshLines();
}

let stopLayoutWatch: (() => void) | undefined;

function bindLayoutWatch() {
  stopLayoutWatch?.();
  const board = boardRef.value;
  if (!board) return;
  const onScroll = () => refreshLines();
  const observer = new ResizeObserver(() => refreshLines());
  observer.observe(board);
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, true);
  stopLayoutWatch = () => {
    observer.disconnect();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll, true);
  };
}

onMounted(() => {
  nextTick(() => bindLayoutWatch());
});

watch(boardRef, () => nextTick(() => bindLayoutWatch()));

onUnmounted(() => stopLayoutWatch?.());
</script>

<style scoped>
.match {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: min(1080px, 100%);
  margin: 0 auto;
  padding: 12px 8px 24px;
}
.match-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}
.match-head h2 {
  margin: 6px 0 0;
}
.match-meta {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
}
.match-board {
  position: relative;
  min-height: 280px;
  padding: 28px 36px;
  border-radius: 20px;
  background: var(--card);
  border: 1px solid var(--line);
  box-shadow: 0 16px 40px rgba(32, 52, 120, 0.06);
}
.match-cols {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 96px;
  align-items: start;
}
.match-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}
.match-lines line {
  stroke: var(--blue);
  stroke-width: 2.5;
  stroke-linecap: round;
}
.match-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1;
}
.match-item {
  min-height: 48px;
  padding: 10px 16px;
  border: 2px solid var(--line);
  border-radius: 14px;
  background: #fff;
  color: var(--ink);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.match-item.en {
  font-family: var(--en);
  font-size: 19px;
  text-align: right;
}
.match-item:hover:not(:disabled) {
  border-color: var(--blue);
  box-shadow: 0 4px 14px rgba(62, 111, 227, 0.12);
}
.match-item.pick {
  border-color: var(--blue);
  background: var(--sky);
  color: var(--blue-deep);
}
.match-item.matched {
  border-color: var(--blue);
  background: linear-gradient(90deg, #edf3ff, #e8f0ff);
  color: var(--blue-deep);
  cursor: default;
}
.match-item:disabled {
  opacity: 1;
}
</style>
