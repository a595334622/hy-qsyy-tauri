<template>
  <div class="page passage">
    <section v-if="!list.length" class="sheet">
      <p class="tag">微语篇</p>
      <h2 class="display h">还没有微语篇</h2>
      <p class="muted empty-text">这本教材的短文录入后会出现在这里。</p>
    </section>

    <template v-else>
      <section class="sheet reading">
        <p class="tag">微语篇</p>
        <h2 class="display h">{{ current.title }}</h2>
        <p class="text">
          <template v-for="(seg, i) in segments" :key="i">
            <button v-if="seg.isWord" type="button" class="word" :class="{ marked: marked.has(seg.text.toLowerCase()) }" @click="mark(seg.text)">
              {{ seg.text }}
            </button>
            <span v-else>{{ seg.text }}</span>
          </template>
        </p>

        <div class="questions">
          <article v-for="(q, qi) in current.questionList || []" :key="qi" class="question">
            <p class="stem">{{ Number(qi) + 1 }}. {{ q.stem }}</p>
            <button
              v-for="option in q.options || []"
              :key="option"
              type="button"
              class="opt"
              :class="{ right: answers[Number(qi)] && option === q.answer, wrong: answers[Number(qi)] === option && option !== q.answer }"
              :disabled="!!answers[Number(qi)]"
              @click="answers[Number(qi)] = option"
            >
              {{ option }}
            </button>
            <p v-if="answers[Number(qi)]" class="verdict" :class="answers[Number(qi)] === q.answer ? 'ok' : 'bad'">
              {{ answers[Number(qi)] === q.answer ? "答对了" : "再看一遍" }}。{{ q.analysis }}
            </p>
          </article>
        </div>

        <button v-if="done && !showTrans" class="btn" type="button" @click="showTrans = true">查看译文</button>
        <p v-if="showTrans" class="trans">{{ current.translation }}</p>
      </section>

      <aside class="sheet vocab">
        <p class="tag warm">点过的词</p>
        <p v-if="!marked.size" class="muted hint">点正文里的单词，记在这里。</p>
        <div v-else class="chips">
          <span v-for="word in [...marked]" :key="word" class="chip">{{ word }}</span>
        </div>
      </aside>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { api } from "@/api";

const list = ref<any[]>([]);
const current = computed(() => list.value[0] || null);
const answers = reactive<Record<number, string>>({});
const showTrans = ref(false);
const marked = ref(loadMarks());
const done = computed(() => {
  const questions = current.value?.questionList || [];
  return questions.length > 0 && questions.every((_: any, index: number) => answers[index]);
});
const segments = computed(() => split(current.value?.content || ""));

onMounted(async () => {
  const bookId = sessionStorage.getItem("qsyy-book");
  if (!bookId) return;
  const res: any = await api(`/student/learn/passages?textbookId=${bookId}`);
  list.value = res?.success ? res.result || [] : [];
});

function split(raw: string) {
  const result: { text: string; isWord: boolean }[] = [];
  const re = /[A-Za-z']+/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    if (match.index > last) result.push({ text: raw.slice(last, match.index), isWord: false });
    result.push({ text: match[0], isWord: true });
    last = match.index + match[0].length;
  }
  if (last < raw.length) result.push({ text: raw.slice(last), isWord: false });
  return result;
}

function loadMarks() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem("qsyy-passage-words") || "[]"));
  } catch {
    return new Set<string>();
  }
}

function mark(word: string) {
  const next = new Set(marked.value);
  next.add(word.toLowerCase());
  marked.value = next;
  localStorage.setItem("qsyy-passage-words", JSON.stringify([...next]));
}
</script>

<style scoped>
.passage { display: grid; grid-template-columns: minmax(0, 1fr) clamp(290px, 24vw, 400px); gap: 16px; align-items: start; }
.h { margin-top: 12px; font-size: clamp(26px, 4vw, 40px); max-width: 16ch; }
.empty-text { margin-top: 18px; }
.text { max-width: 60rem; margin: 24px 0 0; font-family: var(--en); font-size: 21px; line-height: 2; }
.word {
  padding: 0 1px;
  background: none;
  border: 0;
  border-bottom: 2px dotted rgba(62, 111, 227, 0.5);
  font: inherit;
  color: var(--ink);
  cursor: pointer;
  border-radius: 3px 3px 0 0;
  transition: background 0.15s ease;
}
.word:hover { background: var(--sky); }
.word.marked {
  background: linear-gradient(180deg, transparent 42%, rgba(245, 190, 63, 0.55) 42%);
  border-bottom-color: transparent;
}
.questions { display: grid; gap: 6px; }
@media (min-width: 900px) {
  .questions { grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); column-gap: 26px; }
}
.question { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--line); }
.stem { margin: 0 0 10px; font-size: 16px; font-weight: 700; }
.opt {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 13px 15px;
  text-align: left;
  background: var(--wash);
  border: 1.5px solid transparent;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.opt:hover:not(:disabled) { border-color: var(--blue); }
.opt:disabled { opacity: 0.55; }
.opt.right { background: var(--good-soft); border-color: var(--good); color: var(--good); font-weight: 700; opacity: 1; }
.opt.wrong { background: var(--bad-soft); border-color: var(--bad); color: var(--bad); opacity: 1; }
.verdict { margin: 12px 2px 0; font-size: 14px; line-height: 1.7; }
.verdict.ok { color: var(--good); }
.verdict.bad { color: var(--bad); }
.trans {
  margin-top: 18px;
  padding: 15px 17px;
  border-radius: 14px;
  background: var(--wash);
  line-height: 1.8;
}
.vocab .hint { margin: 16px 0 0; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.chip {
  padding: 7px 13px;
  border-radius: 999px;
  background: var(--sun-soft);
  color: #6b5310;
  font-family: var(--en);
  font-size: 14px;
  font-weight: 600;
}
@media (max-width: 1100px) {
  .passage { grid-template-columns: 1fr; }
}
</style>
