<template>
  <div class="page">
    <section v-if="view === 'books'" class="sheet">
      <p class="tag">生词本</p>
      <h2 class="display h">按教材和模块查看</h2>
      <p v-if="!books.length" class="empty">答错或不认识的词会留在这里。抗遗忘做完不会把它移走。</p>
      <article v-for="book in books" :key="book.textbookId" class="book">
        <img v-if="book.cover" :src="coverOf(book.cover)" alt="" />
        <div class="book-main">
          <b>{{ book.name }}</b>
          <div class="mods">
            <button v-for="item in modulesOf(book)" :key="item.value" type="button" class="mod" :disabled="!item.count" @click="openUnits(book, item)">
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
              <em>查看</em>
            </button>
          </div>
        </div>
      </article>
    </section>

    <section v-else-if="view === 'units'" class="sheet">
      <div class="panel-head">
        <div>
          <p class="tag">{{ currentBook?.name }} · {{ currentModule?.label }}</p>
          <h2 class="display h">按单元</h2>
        </div>
        <button class="btn ghost" type="button" @click="view = 'books'">返回</button>
      </div>
      <div class="export-row">
        <label class="check"><input v-model="withExample" type="checkbox" />导出时带例句和词形变化</label>
        <label class="check"><input ref="allBox" type="checkbox" :checked="allPicked" @change="toggleAll" />全选</label>
        <button class="btn" type="button" :disabled="!picked.length || exporting" @click="downloadPicked()">批量导出</button>
      </div>
      <div class="units">
        <article v-for="(unit, index) in units" :key="unit.id" class="unit">
          <input v-model="picked" type="checkbox" :value="unit.id" />
          <em>{{ String(index + 1).padStart(2, "0") }}</em>
          <span>{{ unit.name }}</span>
          <i>{{ unit.count }} 个</i>
          <button type="button" @click="openWords(unit)">查看</button>
          <button type="button" :disabled="exporting" @click="download(unit)">导出</button>
        </article>
      </div>
    </section>

    <section v-else class="sheet">
      <div class="panel-head">
        <div>
          <p class="tag">{{ currentBook?.name }} · {{ currentModule?.label }} · {{ currentUnit?.name }}</p>
          <h2 class="display h">{{ words.length }} 个生词</h2>
        </div>
        <button class="btn ghost" type="button" @click="view = 'units'">返回</button>
      </div>
      <article v-for="(item, index) in words" :key="item.id" class="word">
        <header>
          <b>{{ index + 1 }}. {{ item.word }}</b>
          <i v-if="item.phonetic">{{ item.phonetic }}</i>
          <button v-if="item.audio" type="button" class="play" @click="play(item.audio)">听发音</button>
        </header>
        <p class="mean"><span v-if="item.pos">{{ item.pos }}</span>{{ item.meaning }}</p>
        <p v-if="item.example" class="eg">例句 {{ item.example }}</p>
        <p v-for="(form, formIndex) in item.forms" :key="formIndex" class="form">词形 {{ form.name }} {{ form.value }}</p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { api, apiBase, fileUrl, getToken } from "@/api";

interface Book {
  textbookId: number;
  name: string;
  cover: string;
  recite: number;
  listen: number;
  spell: number;
  apply: number;
}

interface ModuleChip {
  value: string;
  label: string;
  count: number;
}

interface UnitRow {
  id: number;
  name: string;
  count: number;
}

interface WordRow {
  id: number;
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  audio: string;
  example: string;
  forms: { name: string; value: string }[];
}

const modules = [
  { value: "recite", label: "认读速记" },
  { value: "listen", label: "听音辩词" },
  { value: "spell", label: "拼写训练" },
  { value: "apply", label: "三用" }
];

const view = ref<"books" | "units" | "words">("books");
const books = ref<Book[]>([]);
const units = ref<UnitRow[]>([]);
const words = ref<WordRow[]>([]);
const currentBook = ref<Book | null>(null);
const currentModule = ref<ModuleChip | null>(null);
const currentUnit = ref<UnitRow | null>(null);
const withExample = ref(true);
const exporting = ref(false);
const picked = ref<number[]>([]);
const allBox = ref<HTMLInputElement | null>(null);
const allPicked = computed(() => units.value.length > 0 && picked.value.length === units.value.length);
let player: HTMLAudioElement | null = null;

function modulesOf(book: Book) {
  return modules.map(item => ({ ...item, count: Number(book[item.value as keyof Book] || 0) }));
}

function coverOf(path: string) {
  return /^https?:\/\//.test(path) ? path : fileUrl(path);
}

onMounted(loadBooks);

async function loadBooks() {
  const res: any = await api("/student/learn/notebook");
  books.value = res?.success ? res.result || [] : [];
}

async function openUnits(book: Book, module: ModuleChip) {
  currentBook.value = book;
  currentModule.value = module;
  view.value = "units";
  const res: any = await api(`/student/learn/notebook/units?textbookId=${book.textbookId}&module=${module.value}`);
  units.value = res?.success ? res.result || [] : [];
  picked.value = units.value.map(item => item.id);
  await nextTick();
  markAllBox();
}

function markAllBox() {
  if (!allBox.value) return;
  allBox.value.indeterminate = picked.value.length > 0 && picked.value.length < units.value.length;
}

function toggleAll(event: Event) {
  const on = (event.target as HTMLInputElement).checked;
  picked.value = on ? units.value.map(item => item.id) : [];
  markAllBox();
}

watch(picked, () => nextTick(markAllBox), { deep: true });

async function openWords(unit: UnitRow) {
  if (!currentBook.value || !currentModule.value) return;
  currentUnit.value = unit;
  view.value = "words";
  const res: any = await api(`/student/learn/notebook/words?textbookId=${currentBook.value.textbookId}&module=${currentModule.value.value}&unitId=${unit.id}`);
  const rows = res?.success ? res.result?.records || [] : [];
  words.value = rows;
}

function play(path: string) {
  const url = fileUrl(path);
  if (!url) return;
  player?.pause();
  player = new Audio(url);
  player.play().catch(() => {});
}

function downloadPicked() {
  const chosen = units.value.filter(item => picked.value.includes(item.id));
  if (chosen.length === 1) {
    download(chosen[0]);
    return;
  }
  download(undefined, chosen.length === units.value.length ? [] : chosen.map(item => item.id));
}

async function download(unit?: UnitRow, unitIds: number[] = []) {
  if (!currentBook.value || !currentModule.value || exporting.value) return;
  exporting.value = true;
  try {
    const params = new URLSearchParams({
      textbookId: String(currentBook.value.textbookId),
      module: currentModule.value.value,
      example: String(withExample.value)
    });
    if (unit) params.set("unitId", String(unit.id));
    else if (unitIds.length) params.set("unitIds", unitIds.join(","));
    const response = await fetch(`${apiBase()}/student/learn/notebook/export?${params}`, {
      headers: { "X-Auth-Token": getToken() }
    });
    const blob = await response.blob();
    if (blob.type.includes("json") || blob.type.includes("text")) {
      return;
    }
    const chosen = unit ? [unit] : unitIds.length ? units.value.filter(item => unitIds.includes(item.id)) : units.value;
    const total = chosen.reduce((sum, item) => sum + item.count, 0);
    const unitPart = unit ? "-" + unit.name : unitIds.length ? `-已选${unitIds.length}个单元` : "";
    const name = `${currentBook.value.name}${unitPart}-${currentModule.value.label}-共${total}个生词.docx`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    exporting.value = false;
  }
}
</script>

<style scoped>
.h { margin-top: 12px; font-size: clamp(26px, 4vw, 36px); }
.empty { margin: 20px 0 0; color: var(--muted); }
.book { display: flex; gap: 16px; align-items: center; margin-top: 16px; padding: 16px; border-radius: 16px; background: var(--wash); }
.book img { width: 54px; height: 72px; object-fit: cover; border-radius: 8px; background: var(--sky); }
.book-main { flex: 1; min-width: 0; }
.book b { display: block; font-size: 16px; }
.mods { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.mod {
  min-width: 108px;
  padding: 8px 12px;
  border: 1px solid #f0c2bc;
  border-radius: 12px;
  background: #fff;
  color: var(--bad);
  text-align: left;
  cursor: pointer;
}
.mod:disabled { opacity: 0.45; cursor: default; }
.mod span, .mod em { display: block; font-size: 12px; font-style: normal; }
.mod strong { display: block; margin: 2px 0; font-size: 20px; }
.panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.export-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 18px; }
.check { color: var(--muted); font-size: 14px; }
.units { display: grid; gap: 10px; margin-top: 16px; }
.unit { display: grid; grid-template-columns: 18px 42px 1fr auto auto auto; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 14px; background: var(--wash); }
.unit em { font-family: var(--en); font-style: normal; color: var(--muted); }
.unit i { font-style: normal; color: var(--bad); font-weight: 700; }
.unit button { border: 0; background: transparent; color: var(--blue); font-weight: 700; cursor: pointer; }
.word { margin-top: 14px; padding: 16px; border-radius: 16px; background: var(--wash); }
.word header { display: flex; align-items: baseline; gap: 10px; }
.word b { font-family: var(--en); font-size: 22px; }
.word i { color: var(--muted); font-style: normal; }
.play { margin-left: auto; border: 0; background: transparent; color: var(--bad); font-weight: 700; cursor: pointer; }
.mean { margin: 8px 0 0; font-weight: 700; }
.mean span { margin-right: 8px; color: var(--muted); font-weight: 600; }
.eg, .form { margin: 6px 0 0; color: var(--muted); white-space: pre-line; }
.btn { padding: 8px 14px; border: 0; border-radius: 999px; background: var(--blue); color: #fff; font-weight: 700; cursor: pointer; }
.btn.ghost { background: var(--sky); color: var(--blue-deep); }
.btn:disabled { opacity: 0.6; cursor: default; }
</style>
