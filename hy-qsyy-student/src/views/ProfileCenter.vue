<template>
  <section class="sheet center">
    <div class="tabs">
      <button type="button" :class="{ on: tab === 'stats' }" @click="openStats">学习统计</button>
      <button type="button" :class="{ on: tab === 'tests' }" @click="openTests">测试记录</button>
      <button type="button" :class="{ on: tab === 'course' }" @click="openCourse">课程测试</button>
    </div>

    <div v-if="tab === 'stats'" class="panel">
      <div class="filters">
        <button v-for="item in ranges" :key="item.value" type="button" :class="{ on: range === item.value }" @click="pickRange(item.value)">{{ item.label }}</button>
        <label>从 <input v-model="begin" type="date" @change="pickCustom" /></label>
        <label>到 <input v-model="end" type="date" @change="pickCustom" /></label>
        <span>{{ stats.span }}</span>
      </div>
      <div class="totals">
        <p><b>{{ stats.learnedTotal }}</b><span>学习单词数量</span></p>
        <p class="review"><b>{{ stats.reviewedTotal }}</b><span>复习单词数量</span></p>
      </div>
      <p class="chart-legend" aria-hidden="true">
        <span class="learn-dot"></span>学习
        <span class="review-dot"></span>复习
      </p>
      <div class="chart">
        <div v-for="(label, index) in stats.labels" :key="label + index" class="col">
          <div class="pair">
            <i :style="{ height: barHeight(stats.learned[index]) }"></i>
            <i class="review" :style="{ height: barHeight(stats.reviewed[index]) }"></i>
          </div>
          <span>{{ label }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="tab === 'tests'" class="panel">
      <div class="filters">
        <select v-model="testQuery.module">
          <option value="">学习模式</option>
          <option v-for="item in modules" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <select v-model="testQuery.content">
          <option value="">测试内容</option>
          <option value="pre">学前测</option>
          <option value="post">学后测</option>
          <option value="course">课程测试</option>
        </select>
        <label>从 <input v-model="testQuery.begin" type="date" /></label>
        <label>到 <input v-model="testQuery.end" type="date" /></label>
        <button type="button" class="go" @click="searchTests">搜索</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>测试时间</th>
            <th>课本</th>
            <th>单元</th>
            <th>模式</th>
            <th>内容</th>
            <th>题量</th>
            <th>分数</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in tests" :key="row.id">
            <td>{{ (pageNo - 1) * 10 + index + 1 }}</td>
            <td>{{ row.time }}</td>
            <td>{{ row.textbookName }}</td>
            <td>{{ row.unitName }}</td>
            <td>{{ row.moduleName }}</td>
            <td :class="row.content">{{ row.contentName }}</td>
            <td>{{ row.summary }}</td>
            <td class="score" :class="scoreClass(row.score)">{{ row.score }}</td>
            <td><button type="button" @click="openDetail(row.id)">查看</button></td>
          </tr>
          <tr v-if="!tests.length">
            <td colspan="9" class="empty">还没有测试记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="panel">
      <form v-if="!paper" class="course" @submit.prevent="startTest">
        <p class="line"><b>测试教材</b></p>
        <label v-for="book in books" :key="book.id" class="choice">
          <input v-model="form.textbookId" type="radio" name="book" :value="book.id" @change="loadUnits" />
          {{ book.name }}
        </label>
        <p v-if="!books.length" class="empty">还没有授权教材</p>
        <p class="line"><b>测试题量</b></p>
        <label v-for="count in counts" :key="count" class="choice">
          <input v-model="form.count" type="radio" name="count" :value="count" />
          {{ count }}
        </label>
        <p class="line"><b>测试类型</b></p>
        <label v-for="item in modules" :key="item.value" class="choice">
          <input v-model="form.module" type="radio" name="module" :value="item.value" @change="loadUnits" />
          {{ item.label }}
        </label>
        <p class="line"><b>测试单元</b></p>
        <label class="choice">
          <input v-model="whole" type="checkbox" @change="toggleWhole" />
          整本教材
        </label>
        <p class="group">已学完单元 · 学后测</p>
        <label v-for="unit in learned" :key="unit.id" class="choice">
          <input v-model="form.unitIds" type="checkbox" :value="unit.id" :disabled="whole" />
          {{ unit.name }}
        </label>
        <p v-if="!learned.length" class="empty">还没有学完的单元</p>
        <p class="group">未学完单元 · 学前测</p>
        <label v-for="unit in fresh" :key="unit.id" class="choice">
          <input v-model="form.unitIds" type="checkbox" :value="unit.id" :disabled="whole" />
          {{ unit.name }}
        </label>
        <p v-if="tip" class="tip">{{ tip }}</p>
        <button class="primary" type="submit" :disabled="busy">{{ busy ? "出题中..." : "确定" }}</button>
      </form>

      <div v-else-if="result" class="result">
        <p class="tag">{{ result.contentName }}</p>
        <h3>{{ result.score }}</h3>
        <p>{{ result.textbookName }} · {{ result.moduleName }} · {{ result.summary }}</p>
        <button type="button" class="primary" @click="finishPaper">回到测试记录</button>
      </div>

      <div v-else class="quiz">
        <p class="tag">{{ paper.contentName }} · {{ index + 1 }}/{{ paper.questions.length }}</p>
        <h3 v-if="current.word">{{ current.word }}</h3>
        <p v-if="current.phonetic" class="phonetic">{{ current.phonetic }}</p>
        <p v-if="current.meaning" class="meaning">{{ current.meaning }}</p>
        <button v-if="current.audio" type="button" class="play" @click="play(current.audio)">听发音</button>
        <p class="prompt">{{ current.prompt }}</p>
        <button
          v-for="option in current.options"
          :key="option"
          type="button"
          class="option"
          :class="{ on: picks[current.seq] === option }"
          @click="picks[current.seq] = option"
        >
          {{ option }}
        </button>
        <div class="ask-actions">
          <button type="button" :disabled="index === 0" @click="index -= 1">上一题</button>
          <button v-if="index < paper.questions.length - 1" type="button" class="primary" @click="index += 1">下一题</button>
          <button v-else type="button" class="primary" :disabled="busy" @click="submitPaper">{{ busy ? "提交中..." : "交卷" }}</button>
        </div>
      </div>
    </div>

    <div v-if="detail" class="mask" @click.self="detail = null">
      <div class="ask detail" role="dialog">
        <h3>{{ detail.score }} 分</h3>
        <p>{{ detail.textbookName }} {{ detail.unitName }} · {{ detail.moduleName }} · {{ detail.contentName }}</p>
        <p>{{ detail.summary }}</p>
        <article v-for="item in detail.questions" :key="item.seq">
          <b>{{ item.seq }}. {{ item.word || item.prompt }}</b>
          <p v-for="option in item.options" :key="option.text" :class="{ right: option.correct, wrong: option.picked && !option.correct }">
            {{ option.text }}
          </p>
        </article>
        <div class="ask-actions">
          <button type="button" @click="detail = null">关闭</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { api, fileUrl } from "@/api";

const modules = [
  { value: "recite", label: "认读速记" },
  { value: "listen", label: "听音辩词" },
  { value: "spell", label: "拼写训练" }
];
const ranges = [
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
  { value: "year", label: "本年" }
];
const counts = [20, 40, 60, 80, 100];

const tab = ref<"stats" | "tests" | "course">("stats");
const range = ref("week");
const begin = ref("");
const end = ref("");
const stats = reactive({ span: "", labels: [] as string[], learned: [] as number[], reviewed: [] as number[], learnedTotal: 0, reviewedTotal: 0 });
const tests = ref<any[]>([]);
const pageNo = ref(1);
const testQuery = reactive({ module: "", content: "", begin: "", end: "" });
const detail = ref<any>(null);
const books = ref<any[]>([]);
const units = ref<any[]>([]);
const whole = ref(false);
const form = reactive({ textbookId: 0, module: "recite", count: 20, unitIds: [] as number[] });
const tip = ref("");
const busy = ref(false);
const paper = ref<any>(null);
const index = ref(0);
const picks = reactive<Record<number, string>>({});
const result = ref<any>(null);
let player: HTMLAudioElement | null = null;

const learned = computed(() => units.value.filter(item => item.progressStatus === 3));
const fresh = computed(() => units.value.filter(item => item.progressStatus !== 3));
const current = computed(() => paper.value?.questions?.[index.value] || { options: [] });
const peak = computed(() => Math.max(1, ...stats.learned, ...stats.reviewed));

onMounted(loadStats);

function barHeight(value: number) {
  return `${Math.round((Number(value || 0) / peak.value) * 132)}px`;
}

function scoreClass(score: number) {
  if (score >= 90) return "good";
  if (score >= 60) return "mid";
  return "bad";
}

async function loadStats() {
  const query = range.value === "custom" ? `range=custom&begin=${begin.value}&end=${end.value}` : `range=${range.value}`;
  const res: any = await api(`/student/learn/stats?${query}`);
  const data = res?.success ? res.result || {} : {};
  stats.span = data.span || "";
  stats.labels = data.labels || [];
  stats.learned = data.learned || [];
  stats.reviewed = data.reviewed || [];
  stats.learnedTotal = data.learnedTotal || 0;
  stats.reviewedTotal = data.reviewedTotal || 0;
}

function openStats() {
  tab.value = "stats";
  loadStats();
}

function pickRange(value: string) {
  range.value = value;
  begin.value = "";
  end.value = "";
  loadStats();
}

function pickCustom() {
  if (!begin.value || !end.value) return;
  range.value = "custom";
  loadStats();
}

function openTests() {
  tab.value = "tests";
  searchTests();
}

async function searchTests() {
  const params = new URLSearchParams({ pageNo: "1", pageSize: "10" });
  if (testQuery.module) params.set("module", testQuery.module);
  if (testQuery.content) params.set("content", testQuery.content);
  if (testQuery.begin) params.set("begin", testQuery.begin);
  if (testQuery.end) params.set("end", testQuery.end);
  const res: any = await api(`/student/learn/tests?${params}`);
  tests.value = res?.success ? res.result?.records || [] : [];
  pageNo.value = 1;
}

async function openDetail(id: number) {
  const res: any = await api(`/student/learn/test?id=${id}`);
  detail.value = res?.success ? res.result : null;
}

async function openCourse() {
  tab.value = "course";
  if (books.value.length) return;
  const res: any = await api("/student/learn/textbooks");
  books.value = res?.success ? res.result || [] : [];
  if (books.value.length && !form.textbookId) {
    form.textbookId = books.value[0].id;
    await loadUnits();
  }
}

async function loadUnits() {
  units.value = [];
  form.unitIds = [];
  whole.value = false;
  if (!form.textbookId) return;
  const res: any = await api(`/student/learn/units?textbookId=${form.textbookId}&module=${form.module}`);
  units.value = res?.success ? res.result?.units || [] : [];
}

function toggleWhole() {
  form.unitIds = whole.value ? units.value.map(item => item.id) : [];
}

async function startTest() {
  tip.value = "";
  if (!form.textbookId) {
    tip.value = "请选择教材";
    return;
  }
  if (!whole.value && !form.unitIds.length) {
    tip.value = "请选择单元";
    return;
  }
  busy.value = true;
  try {
    const res: any = await api("/student/learn/course-test", {
      method: "POST",
      body: {
        textbookId: form.textbookId,
        module: form.module,
        count: form.count,
        unitIds: whole.value ? [] : form.unitIds
      }
    });
    if (!res?.success) {
      tip.value = res?.message || "没有出成题";
      return;
    }
    paper.value = res.result;
    index.value = 0;
    result.value = null;
    for (const key of Object.keys(picks)) delete picks[Number(key)];
  } finally {
    busy.value = false;
  }
}

function play(path: string) {
  const url = fileUrl(path);
  if (!url) return;
  player?.pause();
  player = new Audio(url);
  player.play().catch(() => {});
}

async function submitPaper() {
  if (!paper.value || busy.value) return;
  busy.value = true;
  try {
    const res: any = await api("/student/learn/course-test/submit", {
      method: "POST",
      body: {
        id: paper.value.id,
        answers: paper.value.questions.map((item: any) => ({ seq: item.seq, answer: picks[item.seq] || "" }))
      }
    });
    if (!res?.success) {
      tip.value = res?.message || "没有交上";
      return;
    }
    result.value = res.result;
  } finally {
    busy.value = false;
  }
}

function finishPaper() {
  paper.value = null;
  result.value = null;
  openTests();
}
</script>

<style scoped>
.center { margin-top: 16px; }
.tabs { display: flex; gap: 8px; }
.tabs button, .filters button, .go, .primary, .option, .play, table button {
  border: 0;
  border-radius: 999px;
  background: var(--sky);
  color: var(--blue-deep);
  font-weight: 700;
  cursor: pointer;
}
.tabs button { height: 36px; padding: 0 16px; }
.tabs button.on, .filters button.on, .primary { background: var(--blue); color: #fff; }
.panel { margin-top: 16px; }
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.filters button, .go { height: 34px; padding: 0 14px; }
.filters label { color: var(--muted); font-size: 13px; }
.filters input, .filters select {
  height: 34px;
  margin-left: 4px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
}
.totals { display: flex; gap: 12px; margin-top: 16px; }
.totals p {
  min-width: 140px;
  margin: 0;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--sky);
}
.totals b { display: block; font-size: 28px; }
.totals span { color: var(--muted); font-size: 13px; }
.totals .review { background: #fdecec; }
.chart-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}
.learn-dot,
.review-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 4px;
  border-radius: 3px;
  vertical-align: middle;
}
.learn-dot { background: var(--blue); }
.review-dot { background: #e15b64; margin-left: 8px; }
.chart {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding: 0 4px 6px;
  overflow-x: auto;
  min-height: 178px;
  align-items: flex-end;
}
.col { display: flex; flex-direction: column; align-items: center; min-width: 40px; flex: 0 0 auto; }
.pair { display: flex; align-items: flex-end; gap: 4px; height: 132px; }
.pair i {
  width: 12px;
  border-radius: 6px 6px 0 0;
  background: var(--blue);
  pointer-events: none;
}
.pair i.review { background: #e15b64; }
.col span { margin-top: 8px; color: var(--muted); font-size: 12px; white-space: nowrap; }
table { width: 100%; margin-top: 14px; border-collapse: collapse; font-size: 13px; }
th, td { padding: 8px 6px; border-bottom: 1px solid var(--line); text-align: left; }
.score { font-weight: 800; }
.score.good, td.post { color: #1f8a4c; }
.score.mid { color: #b86e00; }
.score.bad, td.pre { color: #d23b3b; }
.empty { color: var(--muted); text-align: center; }
.course { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.line, .group { margin: 8px 0 0; }
.group { color: var(--muted); font-size: 13px; }
.choice { display: flex; align-items: center; gap: 8px; }
.tip { color: var(--bad); }
.primary { height: 40px; padding: 0 18px; }
.quiz h3, .result h3 { margin: 8px 0; font-size: 36px; font-weight: 500; }
.phonetic, .meaning, .prompt { margin: 6px 0; }
.option, .play { display: block; width: min(640px, 100%); margin-top: 8px; padding: 12px 14px; border-radius: 12px; text-align: left; }
.option.on { outline: 2px solid var(--blue); }
.ask-actions { display: flex; gap: 8px; margin-top: 16px; }
.ask-actions button { height: 36px; padding: 0 14px; border: 0; border-radius: 999px; background: var(--sky); color: var(--blue-deep); font-weight: 700; cursor: pointer; }
.ask-actions .primary { background: var(--blue); color: #fff; }
.mask { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 20px; background: rgba(16, 22, 44, 0.48); }
.detail { width: min(640px, 100%); max-height: 80vh; overflow: auto; padding: 22px; border-radius: 18px; background: #fff; }
.detail article { margin-top: 12px; }
.detail p.right { color: #1f8a4c; }
.detail p.wrong { color: #d23b3b; }
</style>
