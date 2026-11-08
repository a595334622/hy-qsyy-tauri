<template>
  <div class="page">
    <section v-if="picking" class="sheet">
      <div class="panel-head">
        <div>
          <p class="tag">{{ title }}</p>
          <h2 class="display h">换单元</h2>
        </div>
        <button v-if="unitId" class="btn ghost" type="button" @click="picking = false">返回</button>
      </div>
      <div class="units">
        <button v-for="(unit, i) in units" :key="unit.id" class="unit" :class="{ on: unit.id === unitId }" type="button" @click="openUnit(unit.id)">
          <em>{{ String(i + 1).padStart(2, "0") }}</em>
          <span>{{ unit.name }}</span>
          <i v-if="unit.progressStatus === 3" class="st done">已学完</i>
          <i v-else-if="unit.progressStatus === 2" class="st doing">在学{{ unit.wordTotal ? ` ${unit.wordDone}/${unit.wordTotal}` : "" }}</i>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>
      <p v-if="!units.length" class="muted empty">这本教材还没有单元</p>
    </section>

    <section v-else-if="loading" class="sheet empty-state">
      <p class="tag">{{ title }}</p>
      <h2 class="display h">正在打开单元…</h2>
    </section>

    <section v-else-if="!unitId" class="sheet empty-state">
      <p class="tag">{{ title }}</p>
      <h2 class="display h">这本教材还没有单元</h2>
      <router-link class="btn ghost" to="/">换一本教材</router-link>
    </section>

    <section v-else-if="unitEmpty" class="sheet empty-state">
      <p class="tag">{{ title }} · {{ unitName }}</p>
      <h2 class="display h">这个单元还没有单词</h2>
      <button class="btn ghost" type="button" @click="picking = true">换单元</button>
    </section>

    <section v-else-if="!words.length" class="sheet empty-state">
      <p class="tag">{{ title }} · {{ unitName }}</p>
      <h2 class="display h">这个单元没有可学的词</h2>
      <button class="btn ghost" type="button" @click="picking = true">换单元</button>
    </section>

    <section v-else-if="examPaper" class="sheet exam">
      <div class="head">
        <p class="tag">{{ examPaper.contentName }} · {{ unitName }}</p>
        <div class="head-side">
          <span class="count">{{ examIndex + 1 }} / {{ examPaper.total }}</span>
          <span class="count good">正确 {{ examRight }}</span>
          <span class="count bad">错误 {{ examWrong }}</span>
        </div>
      </div>
      <div class="exam-body">
        <h2 v-if="examCurrent.word" class="word">{{ examCurrent.word }}</h2>
        <p v-if="examCurrent.phonetic" class="phonetic">{{ examCurrent.phonetic }}</p>
        <p v-if="examCurrent.meaning" class="exam-mean">{{ examCurrent.meaning }}</p>
        <button v-if="examCurrent.audio" class="btn" type="button" @click="play(examCurrent.audio)">听发音</button>
        <p class="prompt">{{ examCurrent.prompt }}</p>
        <div v-if="examCurrent.options?.length" class="choices">
          <button
            v-for="option in examCurrent.options"
            :key="option"
            type="button"
            class="choice"
            :class="{ right: examMark && option === examMark.correctAnswer, wrong: examMark && examPicks[examCurrent.seq] === option && option !== examMark.correctAnswer }"
            :disabled="!!examMark"
            @click="answerExam(option)"
          >
            {{ option }}
          </button>
        </div>
        <label v-else class="exam-write">
          <input v-model="examTyped" :disabled="!!examMark" placeholder="写出这个单词" @keyup.enter="answerExam(examTyped)" />
          <button class="btn" type="button" :disabled="!!examMark" @click="answerExam(examTyped)">检查</button>
        </label>
        <p v-if="examMark && !examCurrent.options?.length" class="tip" :class="examMark.correct ? 'ok' : 'bad'">
          {{ examMark.correct ? "对了" : `正确答案：${examMark.correctAnswer}` }}
        </p>
        <div class="actions">
          <button v-if="examIndex < examPaper.questions.length - 1" class="btn" type="button" :disabled="!examMark" @click="nextExam">下一题</button>
          <button v-else class="btn" type="button" :disabled="!examMark || busy" @click="finishExam">交卷</button>
        </div>
      </div>
    </section>

    <section v-else-if="gate === 'match'" class="match-sheet">
      <WordMatchPanel
        :words="matchGroupWords"
        :group-index="matchGroupIndex"
        :group-total="matchChunks.length"
        @done="advanceMatch"
      />
    </section>

    <section v-else-if="finished" class="sheet empty-state">
      <p class="tag good">{{ title }} · {{ unitName }} · 完成</p>
      <h2 class="display h">本单元学完了</h2>
      <p v-if="showTally" class="tally done">
        <span>本单元</span>
        <span class="fresh">生词 {{ tally.unitNew }}</span>
        <span class="known">熟词 {{ tally.unitFamiliar }}</span>
        <span>总数 {{ tally.unitTotal }}</span>
        <span class="split">本课程</span>
        <span class="fresh">生词 {{ tally.courseNew }}</span>
        <span class="known">熟词 {{ tally.courseFamiliar }}</span>
        <span>总数 {{ tally.courseTotal }}</span>
      </p>
      <p class="muted">一共过了 {{ wordTotal }} 个词</p>
      <div class="actions">
        <button v-if="nextUnit" class="btn" type="button" @click="openUnit(nextUnit.id)">下一单元 · {{ nextUnit.name }}</button>
        <button class="btn" :class="{ ghost: nextUnit }" type="button" @click="restart">再学一遍</button>
        <button class="btn ghost" type="button" @click="picking = true">换单元</button>
      </div>
    </section>

    <section v-else class="sheet study" @click="replayWord">
      <div class="head">
        <button v-if="card?.kind === 'retain'" class="unit-btn plain" type="button" disabled>
          <span>{{ unitName }}</span>
        </button>
        <button v-else class="unit-btn" type="button" title="换单元" @click="picking = true">
          <span>{{ unitName }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div class="head-side">
          <button class="again" type="button" @click="restart">从头开始</button>
          <span v-if="stepLabel" class="count">{{ stepLabel }}</span>
          <span class="count">{{ mastered }} / {{ wordTotal }}</span>
        </div>
      </div>
      <p v-if="card?.kind === 'retain'" class="retain-scope">只复习本书·{{ title }}的生词，不与其他教材或模块混合</p>
      <p v-if="showTally" class="tally">
        <template v-if="tally.review">
          <span class="fresh">生词 {{ tally.unitNew }}</span>
          <span class="known">熟词 {{ tally.unitFamiliar }}</span>
          <span>总数 {{ tally.unitTotal }}</span>
        </template>
        <template v-else>
          <span>本单元</span>
          <span class="fresh">生词 {{ tally.unitNew }}</span>
          <span class="known">熟词 {{ tally.unitFamiliar }}</span>
          <span>总数 {{ tally.unitTotal }}</span>
          <span class="split">本课程</span>
          <span class="fresh">生词 {{ tally.courseNew }}</span>
          <span class="known">熟词 {{ tally.courseFamiliar }}</span>
          <span>总数 {{ tally.courseTotal }}</span>
        </template>
      </p>
      <div class="bar"><div :style="{ width: progress + '%' }"></div></div>

      <div class="word-area" :class="[mode, { cols: showSide, pinned: mode === 'recite', hearing: wordHidden, blanking: mode === 'spell' && phase !== 'learn' && phase !== 'pass' }]" :key="mode === 'recite' ? current?.id : `${current?.id}-${phase}`">
        <template v-if="wordHidden">
          <div class="ear">
            <p class="prompt">{{ choosing ? "听发音，选出词义" : "听发音，判断你是否认识" }}</p>
            <button class="big-play" :class="{ compact: choosing }" type="button" @click="play(current.audio || current.phoneticAudio)">
              <span class="rings" aria-hidden="true"><i></i></span>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.8.8 0 0 0 1.3-.6V5.5a.8.8 0 0 0-1.3-.6L7 8.5H4a1 1 0 0 0-1 1Z" />
                <path d="M15.5 8.7a5 5 0 0 1 0 6.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M17.8 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
              <span>播放</span>
            </button>
          </div>
        </template>

        <template v-else-if="mode === 'spell' && phase !== 'learn' && phase !== 'pass'">
          <div class="cloze">
            <p class="prompt">{{ phase === "copy" ? "对照答案，再写一遍" : "看句子，拼出空着的单词" }}</p>
            <p v-if="current.meaning" class="cloze-mean">
              <i v-if="current.pos">{{ current.pos }}</i>
              {{ current.meaning }}
            </p>
            <p v-if="cloze?.found" class="cloze-en">
              <span>{{ cloze.before }}</span><span class="slot" :class="{ shown: phase === 'copy' }" :style="{ width: blankWidth }">{{ phase === "copy" ? spelled : "" }}</span><span>{{ cloze.after }}</span>
              <button class="play" type="button" :title="current.exampleAudio ? '听句子' : '听单词'" @click="play(spellClip(current))">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.8.8 0 0 0 1.3-.6V5.5a.8.8 0 0 0-1.3-.6L7 8.5H4a1 1 0 0 0-1 1Z" />
                  <path d="M15.5 8.7a5 5 0 0 1 0 6.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M17.8 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </button>
            </p>
            <p v-else-if="current.exampleEn" class="cloze-en">
              {{ current.exampleEn }}
              <button class="play" type="button" :title="current.exampleAudio ? '听句子' : '听单词'" @click="play(spellClip(current))">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.8.8 0 0 0 1.3-.6V5.5a.8.8 0 0 0-1.3-.6L7 8.5H4a1 1 0 0 0-1 1Z" />
                  <path d="M15.5 8.7a5 5 0 0 1 0 6.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M17.8 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </button>
            </p>
            <p v-else class="cloze-miss">这个词还没有例句</p>
            <p v-if="current.exampleZh" class="cloze-zh">{{ current.exampleZh }}</p>
            <p v-if="cloze?.capital" class="cap-tip">这个词在句首，首字母要大写</p>
            <button v-if="!cloze?.found && !current.exampleEn" class="play" type="button" title="听单词" @click="play(spellClip(current))">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.8.8 0 0 0 1.3-.6V5.5a.8.8 0 0 0-1.3-.6L7 8.5H4a1 1 0 0 0-1 1Z" />
                <path d="M15.5 8.7a5 5 0 0 1 0 6.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M17.8 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
            <label v-if="phase === 'test' || phase === 'copy'" class="ruled">
              <input
                ref="spellInput"
                v-model="answer"
                class="spell"
                aria-label="拼写单词"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                @keyup.enter="checkSpell"
                @paste.prevent
              />
            </label>
          </div>
        </template>

        <template v-else>
          <div class="stage">
            <div class="stage-main">
              <div class="title-line">
                <h2 class="word" :class="wordTone">{{ current.word }}</h2>
                <p v-if="mode === 'recite' && current.phonetic" class="phonetic">{{ current.phonetic }}</p>
                <button v-if="mode === 'recite' && showMeaning && current.audio" class="play" type="button" title="听单词" @click="play(current.audio)">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.8.8 0 0 0 1.3-.6V5.5a.8.8 0 0 0-1.3-.6L7 8.5H4a1 1 0 0 0-1 1Z" />
                    <path d="M15.5 8.7a5 5 0 0 1 0 6.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <path d="M17.8 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </button>
              </div>
              <p v-if="mode === 'recite' && showMeaning && (current.pos || current.meaning)" class="meaning">
                <i v-if="current.pos">{{ current.pos }}</i>{{ current.meaning }}
              </p>
              <div v-if="mode !== 'recite'" class="ph-row">
                <p class="phonetic">{{ current.phonetic }}</p>
                <button v-if="showMeaning && current.audio" class="play" type="button" title="听单词" @click="play(current.audio)">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.8.8 0 0 0 1.3-.6V5.5a.8.8 0 0 0-1.3-.6L7 8.5H4a1 1 0 0 0-1 1Z" />
                    <path d="M15.5 8.7a5 5 0 0 1 0 6.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <path d="M17.8 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                </button>
                <p v-if="showMeaning" class="meaning">{{ current.pos }} {{ current.meaning }}</p>
                <button v-if="showMeaning && current.phoneticAudio" class="pill ghost" type="button" @click="play(current.phoneticAudio)">音标</button>
              </div>

              <figure v-if="showMeaning && current.image" class="pic">
                <img :src="fileUrl(current.image)" alt="" loading="lazy" />
              </figure>

              <div v-if="showMeaning && mode !== 'recite' && phonemes.length" class="block">
                <p class="label">音素</p>
                <div class="chips">
                  <button v-for="part in phonemes" :key="part.id" class="chip" type="button" @click="play(part.audio)">
                    {{ part.partText }} <small>{{ part.partMark }}</small>
                  </button>
                </div>
              </div>
              <div v-if="mode === 'apply' && choosing" class="choices" role="radiogroup" aria-label="选出正确的词义">
                <p class="prompt choice-prompt">{{ applyChoicePrompt }}</p>
                <p v-if="pickedId != null" class="choice-result" :class="pickedCorrect ? 'ok' : 'bad'">
                  {{ pickedCorrect ? "选对了" : "选错了" }}
                </p>
                <button
                  v-for="opt in choices"
                  :key="opt.id"
                  type="button"
                  class="choice"
                  role="radio"
                  :aria-checked="pickedId === opt.id"
                  :class="{ on: pickedId === opt.id, right: pickedId != null && opt.correct, wrong: pickedId === opt.id && !opt.correct }"
                  :disabled="pickedId != null"
                  @click="pickChoice(opt)"
                >
                  <i aria-hidden="true"></i>
                  <span>{{ opt.text }}</span>
                </button>
              </div>
            </div>

            <aside v-if="showSide && mode !== 'apply'" class="stage-side">
              <div v-if="hasExample" class="block">
                <p class="label">例句</p>
                <div class="example">
                  <div class="ex-row">
                    <p v-if="current.exampleEn" class="ex-en">{{ current.exampleEn }}</p>
                    <button v-if="current.exampleAudio" class="play" type="button" title="听例句" @click="play(current.exampleAudio)">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.8.8 0 0 0 1.3-.6V5.5a.8.8 0 0 0-1.3-.6L7 8.5H4a1 1 0 0 0-1 1Z" />
                        <path d="M15.5 8.7a5 5 0 0 1 0 6.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                        <path d="M17.8 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p v-if="current.exampleZh" class="ex-zh">{{ current.exampleZh }}</p>
                </div>
              </div>
              <div v-if="mode === 'recite' && wordForms.length" class="block">
                <p class="label">词形变化</p>
                <p v-for="form in wordForms" :key="form.id" class="form-line">{{ form.formName }} {{ form.formValue }}</p>
              </div>
              <div v-if="showSplits" class="block">
                <p class="label">一拆</p>
                <p v-for="split in splitOne" :key="split.id" class="note">{{ splitText(split) }}</p>
                <p v-if="!splitOne.length" class="note">无</p>
              </div>
              <div v-if="showSplits" class="block">
                <p class="label">二拆</p>
                <p v-for="split in splitTwo" :key="split.id" class="note">{{ splitText(split) }}</p>
                <p v-if="!splitTwo.length" class="note">无</p>
              </div>
            </aside>
            <aside v-if="mode === 'apply' && applyShown.length" class="stage-side">
              <div class="block">
                <p class="label">{{ applyKindName }} · {{ applyIndex + 1 }}/{{ applyBoards.length }}</p>
                <article v-for="(item, i) in applyShown" :key="i" class="sentence" :class="{ asked: i === applyCursor && phase === 'test' }">
                  <div class="ex-row">
                    <p class="ex-en">
                      <i v-if="item.mark">{{ item.mark }}</i>
                      {{ item.en }}
                    </p>
                    <button v-if="item.audio" class="play" type="button" title="听" @click="play(item.audio)">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                        <path d="M3 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.8.8 0 0 0 1.3-.6V5.5a.8.8 0 0 0-1.3-.6L7 8.5H4a1 1 0 0 0-1 1Z" />
                        <path d="M15.5 8.7a5 5 0 0 1 0 6.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                        <path d="M17.8 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p v-if="applyReveal" class="ex-zh">{{ item.zh }}</p>
                </article>
              </div>
            </aside>
          </div>
        </template>
        <div v-if="choosing && mode !== 'apply'" class="choices" role="radiogroup" aria-label="选出正确的词义">
          <p v-if="!wordHidden" class="prompt choice-prompt">{{ mode === 'apply' ? applyChoicePrompt : '选出正确的词义' }}</p>
          <p v-if="pickedId != null" class="choice-result" :class="pickedCorrect ? 'ok' : 'bad'">
            {{ pickedCorrect ? "选对了" : "选错了" }}
          </p>
          <button
            v-for="opt in choices"
            :key="opt.id"
            type="button"
            class="choice"
            role="radio"
            :aria-checked="pickedId === opt.id"
            :class="{ on: pickedId === opt.id, right: pickedId != null && opt.correct, wrong: pickedId === opt.id && !opt.correct }"
            :disabled="pickedId != null"
            @click="pickChoice(opt)"
          >
            <i aria-hidden="true"></i>
            <span>{{ opt.text }}</span>
          </button>
        </div>
      </div>

      <p v-if="spellTip" class="tip" :class="spellOk ? 'ok' : 'bad'">{{ spellTip }}</p>

      <div class="actions" :class="{ 'slot-known': nextInKnownSlot }">
        <template v-if="phase === 'judge'">
          <button class="btn" type="button" :disabled="busy" @click="submit('known')">认识</button>
          <button class="btn danger" type="button" :disabled="busy" @click="submit('unknown')">不认识</button>
        </template>
        <template v-else-if="phase === 'learn' || phase === 'pass'">
          <button v-if="needFollow && !followed" class="btn" type="button" :disabled="busy" @click="followRead">跟读</button>
          <button v-else class="btn" type="button" :disabled="busy" @click="submit('next')">下一个</button>
        </template>
        <template v-else-if="mode === 'spell'">
          <button class="btn" type="button" :disabled="busy || checked" @click="checkSpell">检查</button>
        </template>
        <template v-else-if="mode === 'apply' && !applyBoards.length">
          <button class="btn" type="button" :disabled="busy" @click="submit('right')">下一个</button>
        </template>
      </div>
    </section>

    <div v-if="gate === 'pre'" class="mask">
      <div class="ask" role="dialog">
        <h3>学习提示</h3>
        <p>接下来将学习「{{ unitName }}」，是否进行学前测试？</p>
        <div class="ask-actions">
          <button type="button" @click="skipExam('pre')">取消</button>
          <button class="primary" type="button" @click="beginExam('pre')">学前测试</button>
        </div>
      </div>
    </div>
    <div v-if="gate === 'post'" class="mask">
      <div class="ask" role="dialog">
        <h3>本单元学完了</h3>
        <p>单词总数 {{ examInfo.wordTotal }} 个，其中生词 {{ examInfo.newCount }} 个。</p>
        <div class="ask-actions">
          <button type="button" @click="leaveCourse">返回课程</button>
          <button class="primary" type="button" @click="beginExam('post')">学后测试</button>
          <button type="button" @click="skipExam('post')">继续学习</button>
        </div>
      </div>
    </div>
    <div v-if="gate === 'result' && examResult" class="mask">
      <div class="ask" role="dialog">
        <h3>已完成{{ unitName }}{{ examResult.contentName }}</h3>
        <p>题数 {{ examResult.summary }}</p>
        <p>得分 {{ examResult.score }}</p>
        <div class="ask-actions">
          <button class="primary" type="button" @click="enterStudy">进入学习</button>
          <button type="button" @click="gate = 'detail'">测试详情</button>
        </div>
      </div>
    </div>
    <div v-if="gate === 'detail' && examResult" class="mask" @click.self="gate = 'result'">
      <div class="ask detail" role="dialog">
        <h3>{{ examResult.score }} 分</h3>
        <article v-for="item in examResult.questions" :key="item.seq">
          <b>{{ item.seq }}. {{ item.word || item.prompt }}</b>
          <p v-for="option in item.options" :key="option.text" :class="{ right: option.correct, wrong: option.picked && !option.correct }">{{ option.text }}</p>
          <p v-if="!item.options?.length">{{ item.correct ? "对了" : `正确答案：${item.correctAnswer}` }}，你的答案：{{ item.answer || "未填写" }}</p>
        </article>
        <div class="ask-actions">
          <button type="button" @click="gate = 'result'">返回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, fileUrl } from "@/api";
import WordMatchPanel from "@/components/WordMatchPanel.vue";

interface UnitRow {
  id: number;
  name: string;
  sort: number;
  progressStatus: number;
  wordDone: number;
  wordTotal: number;
}

interface RoundCard {
  wordId: number;
  kind: "new" | "review" | "ultimate" | "retain";
  phase: "judge" | "test" | "copy" | "learn" | "pass";
  colorName?: string;
}

const route = useRoute();
const router = useRouter();
const mode = computed(() => String(route.params.mode || "recite"));
const title = computed(() => ({ recite: "认读速记", listen: "听音辩词", spell: "拼写训练", apply: "三用" } as Record<string, string>)[mode.value] || "学习");
const units = ref<UnitRow[]>([]);
const words = ref<any[]>([]);
const unitId = ref<number | null>(null);
const unitEmpty = ref(false);
const picking = ref(false);
const loading = ref(true);
const busy = ref(false);
const card = ref<RoundCard | null>(null);
const phase = ref<"judge" | "test" | "copy" | "learn" | "pass">("judge");
const followed = ref(false);
const choices = ref<{ id: number; text: string; correct: boolean }[]>([]);
const pickedId = ref<number | null>(null);
const answer = ref("");
const checked = ref(false);
const spellOk = ref(false);
const spellTip = ref("");
const spellInput = ref<HTMLInputElement | null>(null);
const applyIndex = ref(0);
const applyCursor = ref(0);
const applyAnswers = ref<{ prompt: string; answer: string; correctAnswer: string; options: string[]; right: boolean }[]>([]);
const finished = ref(false);
const gate = ref<"" | "pre" | "post" | "result" | "detail" | "match">("");
/** 竖向一排超过一屏时改 8 个一组（027） */
function matchGroupSize() {
  if (typeof window === "undefined") return 10;
  return window.innerHeight < 900 ? 8 : 10;
}
const matchChunks = ref<any[][]>([]);
const matchGroupIndex = ref(0);
const matchGroupWords = computed(() => matchChunks.value[matchGroupIndex.value] || []);
const examInfo = ref({ wordTotal: 0, newCount: 0, needPre: false, needPost: false });
const examPaper = ref<any>(null);
const examIndex = ref(0);
const examRight = ref(0);
const examWrong = ref(0);
const examPicks = ref<Record<number, string>>({});
const examMark = ref<{ correct: boolean; correctAnswer: string } | null>(null);
const examTyped = ref("");
const examResult = ref<any>(null);
const examKind = ref<"pre" | "post">("pre");
const mastered = ref(0);
const total = ref(0);
const tally = ref({ show: false, review: false, unitNew: 0, unitFamiliar: 0, unitTotal: 0, courseNew: 0, courseFamiliar: 0, courseTotal: 0 });
let player: HTMLAudioElement | null = null;

const wordTotal = computed(() => total.value);
const showTally = computed(() => tally.value.show);
const nextInKnownSlot = computed(() => phase.value === "pass" && card.value?.colorName !== "红色");
const current = computed(() => words.value.find(item => item.id === card.value?.wordId));
const progress = computed(() => wordTotal.value ? (mastered.value / wordTotal.value) * 100 : 0);
const stepLabel = computed(() => {
  if (card.value?.kind === "retain") return "抗遗忘";
  if (card.value?.kind === "ultimate") return "选择";
  if (card.value?.kind === "new") return "新词";
  return "";
});
const showMeaning = computed(() => mode.value === "apply" || phase.value === "learn" || phase.value === "pass");
const unitIndex = computed(() => units.value.findIndex(unit => unit.id === unitId.value));
const unitName = computed(() => units.value[unitIndex.value]?.name || "");
const nextUnit = computed(() => (unitIndex.value >= 0 ? units.value[unitIndex.value + 1] : undefined));
const examCurrent = computed(() => examPaper.value?.questions?.[examIndex.value] || { options: [] });
const examModes = computed(() => mode.value === "recite" || mode.value === "listen" || mode.value === "spell");
// 认读、辨音、拼写同一套颜色。红色和选择轮才作答，拼写这两处是填空
const choosing = computed(() => phase.value === "test" && mode.value !== "spell");
const pickedCorrect = computed(() => choices.value.some(item => item.id === pickedId.value && item.correct));
// 辨音在作答结束前不露单词。详情页才露出
const wordHidden = computed(() => mode.value === "listen" && phase.value !== "learn" && phase.value !== "pass");
const needFollow = computed(() => (mode.value === "recite" || mode.value === "listen") && phase.value === "learn");
const wordTone = computed(() => {
  const name = card.value?.colorName;
  if (name === "红色") return "tone-red";
  if (name === "棕色") return "tone-brown";
  if (name === "绿色") return "tone-green";
  if (name === "青蓝") return "tone-cyan";
  if (name === "紫色") return "tone-purple";
  if (name === "深蓝") return "tone-navy";
  return "";
});

function sourceList() {
  return words.value;
}

function blankOf(sentence: string, token: string) {
  const text = String(sentence || "");
  const word = String(token || "").trim();
  if (!text || !word) return { before: text, after: "", found: false, capital: false };
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`\\b${escaped}\\b`, "i"));
  if (!match || match.index == null) return { before: text, after: "", found: false, capital: false };
  const before = text.slice(0, match.index);
  const head = before.replace(/[\s\u00a0"'“”‘’„«»()\[\]（）【】—–\-.:;!?]+/g, "");
  const letter = match[0].charAt(0);
  return {
    before,
    after: text.slice(match.index + match[0].length),
    found: true,
    capital: head.length === 0 && letter.toLowerCase() !== letter.toUpperCase()
  };
}

const cloze = computed(() => {
  const word = current.value;
  if (!word) return null;
  return blankOf(String(word.exampleEn || ""), String(word.word || ""));
});
/** 挖空按单词长短留白，长词组的横线跟着变宽，避免看起来像只缺一个短词 */
const blankWidth = computed(() => {
  const n = [...String(current.value?.word || "")].length;
  return `max(4.2em, ${Math.min(Math.max(n, 1), 24) * 0.62}em)`;
});
const spelled = computed(() => {
  const raw = String(current.value?.word || "").trim();
  return cloze.value?.capital && raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;
});

const applyBoards = computed(() => {
  const word = current.value;
  if (!word) return [] as ("family" | "phrase" | "sentence")[];
  const list: ("family" | "phrase" | "sentence")[] = [];
  if ((word.relations || []).some((item: any) => item.relWord)) list.push("family");
  if ((word.phrases || []).length) list.push("phrase");
  if ((word.sentences || []).length) list.push("sentence");
  return list;
});
const applyBoard = computed(() => applyBoards.value[applyIndex.value] || "");
const applyShown = computed(() => {
  const word = current.value;
  const board = applyBoard.value;
  if (!word || !board) return [] as { en: string; zh: string; mark: string; audio: string }[];
  if (board === "family") {
    return (word.relations || []).filter((item: any) => item.relWord).map((item: any) => ({
      en: item.relWord as string,
      zh: [item.pos, item.meaning].filter(Boolean).join(" "),
      mark: relName(item.relType),
      audio: item.audio || ""
    }));
  }
  if (board === "phrase") {
    return (word.phrases || []).map((item: any) => ({ en: item.phraseEn || "", zh: item.phraseZh || "", mark: "", audio: item.audio || "" }));
  }
  return (word.sentences || []).map((item: any) => ({ en: item.sentenceEn || "", zh: item.sentenceZh || "", mark: "", audio: item.audio || "" }));
});
const applyKindName = computed(() => applyBoard.value === "family" ? "词族" : applyBoard.value === "phrase" ? "短语" : applyBoard.value === "sentence" ? "句子" : "");
const applyTarget = computed(() => applyShown.value[applyCursor.value] || null);
const applyChoicePrompt = computed(() => {
  if (!applyTarget.value) return "选出正确的意思";
  if (applyBoard.value === "sentence") return `选出第 ${applyCursor.value + 1} 句的意思`;
  return `选出「${applyTarget.value.en}」的意思`;
});
const applyReveal = computed(() => mode.value === "apply" && (phase.value === "learn" || phase.value === "pass"));

function relName(type: number) {
  return type === 1 ? "派生" : type === 2 ? "近义" : type === 3 ? "反义" : "";
}
const phonemes = computed(() => {
  const splits = (current.value?.splits || []).filter((item: any) => item.splitType === 1 && item.splitMode === 3);
  return splits.flatMap((item: any) => item.parts || []);
});
const wordSplits = computed(() => current.value?.splits || []);
const splitOne = computed(() => wordSplits.value.filter((item: any) => item.splitType !== 2));
const splitTwo = computed(() => wordSplits.value.filter((item: any) => item.splitType === 2));
const hasExample = computed(() => {
  const word = current.value;
  return !!(word && (word.exampleEn || word.exampleZh || word.exampleAudio));
});
const wordForms = computed(() => (current.value?.forms || []).filter((item: any) => item?.formName || item?.formValue));
const showSplits = computed(() => showMeaning.value && mode.value !== "apply" && mode.value !== "recite" && wordSplits.value.length > 0);
const showSide = computed(() => {
  if (mode.value === "apply") return applyShown.value.length > 0;
  if (mode.value === "recite") return showMeaning.value && (hasExample.value || wordForms.value.length > 0);
  return showMeaning.value && (hasExample.value || showSplits.value);
});

watch(mode, enter);
watch(
  () => [mode.value, phase.value, current.value?.id, gate.value, loading.value, picking.value, finished.value] as const,
  () => focusSpellInput()
);
onMounted(enter);

let ticket = 0;

onUnmounted(() => {
  ticket += 1;
  clearMark();
});

// 每个词一出现就播单词发音，换词再播
watch(
  () => [loading.value, finished.value, picking.value, current.value?.id] as const,
  () => speakCurrent()
);

/** 打开默认单元。没有可学的词就顺延，学完的单元停在完成页 */
async function enter() {
  clearMark();
  const my = ++ticket;
  // 1. 没有教材就回首页
  const bookId = sessionStorage.getItem("qsyy-book");
  if (!bookId) {
    router.replace("/");
    return;
  }
  // 2. 拉单元，打开默认的那一课
  loading.value = true;
  picking.value = false;
  unitId.value = null;
  words.value = [];
  finished.value = false;
  const res: any = await api(`/student/learn/units?textbookId=${bookId}&module=${mode.value}`);
  if (my !== ticket) return;
  const data = res?.success ? res.result || {} : {};
  units.value = data.units || [];
  const defaultId: number | undefined = data.defaultUnitId;
  if (defaultId) {
    await openUnit(defaultId, true);
    if (my !== ticket) return;
    // 3. 默认单元没有词就顺延到后面第一个有词的单元
    let i = units.value.findIndex(unit => unit.id === defaultId);
    while (!words.value.length && i >= 0 && i + 1 < units.value.length) {
      i += 1;
      await openUnit(units.value[i].id, true);
      if (my !== ticket) return;
    }
  }
  if (my !== ticket) return;
  loading.value = false;
}

async function openUnit(id: number, entered = false) {
  clearMark();
  examPaper.value = null;
  gate.value = "";
  matchChunks.value = [];
  matchGroupIndex.value = 0;
  const fromBook = entered ? "&enter=true" : "";
  const res: any = await api(`/student/learn/round?unitId=${id}&module=${mode.value}${fromBook}`);
  if (!res?.success) return;
  applyRound(res.result || {}, id);
  picking.value = false;
  if (card.value?.kind !== "retain") {
    await maybeExam(finished.value);
  }
}

/** 新单元问学前测，学完问学后测。认读、听音、拼写才测 */
async function maybeExam(showPost: boolean, afterRetain = false) {
  if (!examModes.value || unitId.value == null || examPaper.value || card.value?.kind === "retain") return;
  const retainFlag = afterRetain ? "&afterRetain=1" : "";
  const res: any = await api(`/student/learn/unit-exam?unitId=${unitId.value}&module=${mode.value}${retainFlag}`);
  if (!res?.success) return;
  examInfo.value = res.result || examInfo.value;
  if (examInfo.value.needPre && !finished.value) gate.value = "pre";
  else if (showPost && examInfo.value.needPost) gate.value = "post";
}

/** 拼写作答页自动聚焦输入框 */
function focusSpellInput() {
  nextTick(() => {
    if (loading.value || picking.value || finished.value || gate.value) return;
    if (mode.value !== "spell") return;
    if (phase.value !== "test" && phase.value !== "copy") return;
    spellInput.value?.focus();
  });
}

function chunkMatch(list: any[], size: number) {
  const rows: any[][] = [];
  for (let i = 0; i < list.length; i += size) rows.push(list.slice(i, i + size));
  return rows;
}

/** 认读学完先做连连看，再弹学后测 */
function beginWordMatch() {
  const list = words.value.filter(row => row?.id);
  if (!list.length) {
    void maybeExam(true);
    return;
  }
  matchChunks.value = chunkMatch(list, matchGroupSize());
  matchGroupIndex.value = 0;
  gate.value = "match";
}

async function advanceMatch() {
  if (matchGroupIndex.value + 1 < matchChunks.value.length) {
    matchGroupIndex.value += 1;
    return;
  }
  gate.value = "";
  await maybeExam(true);
}

async function skipExam(kind: "pre" | "post") {
  if (unitId.value == null) return;
  await api("/student/learn/unit-exam/skip", { method: "POST", body: { unitId: unitId.value, module: mode.value, kind } });
  gate.value = "";
  if (kind === "post") restart();
}

function leaveCourse() {
  if (unitId.value != null) {
    api("/student/learn/unit-exam/skip", { method: "POST", body: { unitId: unitId.value, module: mode.value, kind: "post" } });
  }
  router.push("/");
}

async function beginExam(kind: "pre" | "post") {
  if (unitId.value == null || busy.value) return;
  busy.value = true;
  examKind.value = kind;
  try {
    const res: any = await api("/student/learn/unit-exam/start", { method: "POST", body: { unitId: unitId.value, module: mode.value, kind } });
    if (!res?.success) return;
    examPaper.value = res.result;
    examIndex.value = 0;
    examRight.value = 0;
    examWrong.value = 0;
    examPicks.value = {};
    examMark.value = null;
    examTyped.value = "";
    examResult.value = null;
    gate.value = "";
  } finally {
    busy.value = false;
  }
}

async function answerExam(answer: string) {
  const question = examCurrent.value;
  if (!examPaper.value || !question?.seq || examMark.value || busy.value) return;
  busy.value = true;
  try {
    const res: any = await api("/student/learn/unit-exam/answer", {
      method: "POST",
      body: { id: examPaper.value.id, seq: question.seq, answer }
    });
    if (!res?.success) return;
    examPicks.value[question.seq] = answer;
    examMark.value = { correct: !!res.result?.correct, correctAnswer: res.result?.correctAnswer || "" };
    if (res.result?.correct) examRight.value += 1;
    else examWrong.value += 1;
  } finally {
    busy.value = false;
  }
}

function nextExam() {
  if (!examMark.value) return;
  examIndex.value += 1;
  examMark.value = null;
  examTyped.value = "";
}

async function finishExam() {
  if (!examPaper.value || busy.value) return;
  busy.value = true;
  try {
    const res: any = await api("/student/learn/course-test/submit", {
      method: "POST",
      body: {
        id: examPaper.value.id,
        answers: examPaper.value.questions.map((item: any) => ({ seq: item.seq, answer: examPicks.value[item.seq] || "" }))
      }
    });
    if (!res?.success) return;
    examResult.value = res.result;
    examPaper.value = null;
    gate.value = "result";
  } finally {
    busy.value = false;
  }
}

function enterStudy() {
  gate.value = "";
  examResult.value = null;
}

/** 服务端算出的当前卡片写回页面 */
function applyRound(round: any, id: number) {
  const keepTip = spellTip.value;
  const previousId = card.value?.wordId;
  // 1. 写回本课材料和当前卡片
  unitId.value = id;
  words.value = round.words || [];
  unitEmpty.value = !!round.unitEmpty;
  mastered.value = round.mastered || 0;
  total.value = round.total || 0;
  finished.value = !!round.finished;
  const count = round.tally || {};
  tally.value = {
    show: !!count.show,
    review: !!count.review,
    unitNew: count.unitNew || 0,
    unitFamiliar: count.unitFamiliar || 0,
    unitTotal: count.unitTotal || 0,
    courseNew: count.courseNew || 0,
    courseFamiliar: count.courseFamiliar || 0,
    courseTotal: count.courseTotal || 0
  };
  card.value = round.card || null;
  phase.value = card.value?.phase || "judge";
  choices.value = [];
  pickedId.value = null;
  applyAnswers.value = [];
  answer.value = "";
  checked.value = false;
  spellOk.value = false;
  applyIndex.value = 0;
  applyCursor.value = 0;
  spellTip.value = phase.value === "copy" ? `正确答案：${spelled.value}` : phase.value === "learn" ? keepTip : "";
  followed.value = false;
  // 2. 作答阶段在页面上组选项。同一张词进详情或再次判断时补播一次
  if (phase.value === "test" && mode.value === "apply") prepareApply();
  else if (phase.value === "test" && mode.value !== "spell") makeChoices();
  const sameWord = card.value?.wordId === previousId;
  const reading = mode.value === "recite" || mode.value === "listen";
  if (!loading.value && sameWord && reading && (phase.value === "learn" || phase.value === "pass")) speakCurrent();
  else if (!loading.value && phase.value === "judge" && sameWord) speakCurrent();
  // 3. 单元列表上的进度跟着通关数走，已学完不退回
  if (card.value?.kind === "retain") return;
  const row = units.value.find(unit => unit.id === id);
  if (!row || !total.value) return;
  row.wordDone = mastered.value;
  row.wordTotal = total.value;
  if (finished.value) row.progressStatus = 3;
  else if (row.progressStatus !== 3) row.progressStatus = 2;
  focusSpellInput();
}

/** 认识、作答、看完、重开。失败就留在这一张 */
async function submit(act: "known" | "unknown" | "right" | "wrong" | "next" | "restart") {
  clearMark();
  if (busy.value || unitId.value == null || gate.value === "pre") return false;
  busy.value = true;
  const tip = spellTip.value;
  const wasFinished = finished.value;
  const wasRetain = card.value?.kind === "retain";
  try {
    // 1. 把这一步交给服务端
    const res: any = await api("/student/learn/round", {
      method: "POST",
      body: {
        unitId: unitId.value,
        module: mode.value,
        act,
        wordId: act === "restart" ? undefined : current.value?.id,
        ...(act === "right" || act === "wrong" ? answerBody(act) : {})
      }
    });
    // 2. 没记下来就留在这一张。拼写答错时把正确答案带回来
    if (!res?.success) {
      if (mode.value === "apply" && applyAnswers.value.length) applyAnswers.value.pop();
      pickedId.value = null;
      checked.value = false;
      spellOk.value = false;
      spellTip.value = res?.message || "没有记下来";
      return false;
    }
    applyRound(res.result || {}, unitId.value);
    if (wasRetain && card.value?.kind !== "retain") {
      await maybeExam(false, true);
    } else if (!wasFinished && finished.value) {
      if (mode.value === "recite") beginWordMatch();
      else await maybeExam(true);
    }
    if (act === "wrong" && tip) spellTip.value = tip;
    return true;
  } finally {
    busy.value = false;
  }
}

function restart() {
  submit("restart");
}

function prepareApply() {
  applyIndex.value = 0;
  applyCursor.value = 0;
  if (applyBoards.value.length) makeApplyChoices();
}

function play(path?: string) {
  const url = fileUrl(path);
  if (!url) return;
  if (player) player.pause();
  player = new Audio(url);
  player.play().catch(() => {});
}

function splitText(split: any) {
  return split.story || split.summary || split.note || "无";
}

function speakCurrent() {
  if (loading.value || finished.value || picking.value || !current.value) {
    player?.pause();
    return;
  }
  play(mode.value === "spell" ? spellClip(current.value) : current.value.audio || current.value.phoneticAudio);
}

/** 认读、辨音不认识或答错后的第二次跟读，只重播单词 */
function followRead() {
  followed.value = true;
  speakCurrent();
}

let markTimer = 0;

function clearMark() {
  if (!markTimer) return;
  window.clearTimeout(markTimer);
  markTimer = 0;
}

function spellClip(word: any) {
  return word?.exampleAudio || word?.audio || word?.phoneticAudio;
}

/** 点单词或卡片空白处重播当前词；按钮和输入框保持各自的操作 */
function replayWord(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (target?.closest("button, a, input, textarea, .actions, .head")) return;
  if (!current.value) return;
  play(mode.value === "spell" ? spellClip(current.value) : current.value.audio || current.value.phoneticAudio);
}

/** 拼写对错在页面上判。写错先对照空格里的答案再抄一遍，抄完才进入六色 */
function checkSpell() {
  const expect = spelled.value;
  const typed = answer.value.trim();
  const same = typed.toLowerCase() === expect.toLowerCase();
  const first = typed.charAt(0);
  const capped = !cloze.value?.capital || (first === first.toUpperCase() && first !== first.toLowerCase());
  const ok = same && capped;
  // 1. 抄写这一步必须和答案一致，才算看完
  if (phase.value === "copy") {
    spellOk.value = ok;
    spellTip.value = ok ? "写对了" : `请按空格里的答案再写一遍：${expect}`;
    if (ok) submit("next");
    return;
  }
  // 2. 写对通过。写错记下生词，停在这一张抄一遍
  spellOk.value = ok;
  spellTip.value = ok ? "拼写正确" : `正确答案：${expect}`;
  checked.value = true;
  submit(ok ? "right" : "wrong");
}

/** 三用当前这一项的四个意思 */
function makeApplyChoices() {
  // 1. 正确意思留在本题，同一板里已经出现的中文不再当干扰项
  const item = applyTarget.value;
  const word = current.value;
  const board = applyBoard.value;
  if (!item || !word || !board) {
    choices.value = [];
    pickedId.value = null;
    return;
  }
  const correctText = item.zh || item.en;
  const used = new Set<string>([correctText]);
  for (const row of applyShown.value) if (row.zh) used.add(row.zh);
  // 2. 另外三项从本单元其他词里随机抽
  const bag: string[] = [];
  for (const other of sourceList()) {
    if (other.id === word.id) continue;
    if (board === "family") {
      for (const row of other.relations || []) {
        const text = [row.pos, row.meaning].filter(Boolean).join(" ") || row.relWord;
        if (text) bag.push(text);
      }
    } else if (board === "phrase") {
      for (const row of other.phrases || []) if (row.phraseZh) bag.push(row.phraseZh);
    } else {
      for (const row of other.sentences || []) if (row.sentenceZh) bag.push(row.sentenceZh);
    }
  }
  const distractors: { id: number; text: string; correct: boolean }[] = [];
  while (bag.length && distractors.length < 3) {
    const text = bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
    if (!text || used.has(text)) continue;
    used.add(text);
    distractors.push({ id: distractors.length + 2, text, correct: false });
  }
  const merged = [{ id: 1, text: correctText, correct: true }, ...distractors];
  for (let i = merged.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = merged[i];
    merged[i] = merged[j];
    merged[j] = tmp;
  }
  choices.value = merged;
  pickedId.value = null;
}

/** 认读、辨音的四个词义 */
function makeChoices() {
  // 1. 正确词义留在本题
  const word = current.value;
  const textOf = (item: any) => [item?.pos, item?.meaning].filter(Boolean).join(" ").trim() || String(item?.word || "");
  const correctText = textOf(word);
  const used = new Set<string>([correctText]);
  // 2. 另外三项从本单元其他词里随机抽，词义相同的跳过
  const bag = sourceList().filter(item => item.id !== word?.id);
  const distractors: { id: number; text: string; correct: boolean }[] = [];
  while (bag.length && distractors.length < 3) {
    const item = bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
    const text = textOf(item);
    if (!text || used.has(text)) continue;
    used.add(text);
    distractors.push({ id: item.id, text, correct: false });
  }
  const merged = word ? [{ id: word.id, text: correctText, correct: true }, ...distractors] : [];
  for (let i = merged.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = merged[i];
    merged[i] = merged[j];
    merged[j] = tmp;
  }
  choices.value = merged;
  pickedId.value = null;
}

/** 认读、辨音选完即判；三用要本词每一项都对才算对 */
function answerBody(act: "right" | "wrong") {
  if (mode.value === "spell") {
    const item = spellAnswer();
    return { prompt: item.prompt, answer: item.answer, correctAnswer: item.correctAnswer, options: item.options, answers: [item] };
  }
  if (mode.value === "apply") {
    return { answers: applyAnswers.value.slice(0, 40) };
  }
  const item = choiceAnswer(act === "right");
  return { prompt: item.prompt, answer: item.answer, correctAnswer: item.correctAnswer, options: item.options, answers: [item] };
}

function choiceAnswer(right: boolean) {
  const picked = choices.value.find(item => item.id === pickedId.value);
  const correct = choices.value.find(item => item.correct);
  const word = current.value;
  const target = applyTarget.value;
  const prompt = mode.value === "apply"
    ? (target?.en ? `${applyChoicePrompt.value}：${target.en}` : applyChoicePrompt.value)
    : mode.value === "listen"
      ? "听发音，选出词义"
      : [word?.word, word?.phonetic].filter(Boolean).join("  ");
  return {
    prompt,
    answer: picked?.text || "",
    correctAnswer: correct?.text || target?.zh || "",
    options: choices.value.map(item => item.text),
    right
  };
}

function spellAnswer() {
  const raw = String(current.value?.word || "").trim();
  const expect = cloze.value?.capital && raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;
  const sentence = cloze.value?.found
    ? `${cloze.value.before}____${cloze.value.after}`
    : current.value?.exampleEn || current.value?.meaning || raw;
  return {
    prompt: sentence,
    answer: answer.value.trim(),
    correctAnswer: expect,
    options: [] as string[],
    right: spellOk.value
  };
}

function pickChoice(option: { id: number; correct: boolean }) {
  if (pickedId.value != null || busy.value) return;
  pickedId.value = option.id;
  // 1. 认读、辨音选对马上进详情。选错先标出正确答案，再进详情
  if (mode.value !== "apply") {
    if (option.correct) {
      submit("right");
      return;
    }
    clearMark();
    markTimer = window.setTimeout(() => {
      markTimer = 0;
      submit("wrong");
    }, 1000);
    return;
  }
  // 2. 三用每一项都记下。任一项错，整词算错
  applyAnswers.value.push(choiceAnswer(option.correct));
  if (!option.correct) {
    submit("wrong");
    return;
  }
  // 3. 这一项对了就做下一项，这一类做完换下一类，全部做完才算对
  if (applyCursor.value < applyShown.value.length - 1) {
    applyCursor.value += 1;
    pickedId.value = null;
    makeApplyChoices();
    return;
  }
  if (applyIndex.value < applyBoards.value.length - 1) {
    applyIndex.value += 1;
    applyCursor.value = 0;
    pickedId.value = null;
    makeApplyChoices();
    return;
  }
  submit("right");
}
</script>

<style scoped>
.h { margin-top: 12px; font-size: clamp(26px, 4vw, 38px); }
.empty { margin-top: 22px; }
.empty-state { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }

.units {
  display: grid;
  gap: 10px;
  margin-top: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
.unit {
  width: 100%;
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  text-align: left;
  background: var(--wash);
  border: 1.5px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.12s ease;
}
.unit:hover { border-color: var(--blue); }
.unit:active { transform: scale(0.99); }
.unit em {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--sky);
  color: var(--blue-deep);
  font-family: var(--en);
  font-style: normal;
  font-size: 13px;
  font-weight: 700;
}
.unit span { flex: 1; font-size: 16px; font-weight: 600; }
.unit svg { width: 18px; height: 18px; color: var(--muted); flex: 0 0 auto; }
.unit.on { border-color: var(--blue); background: var(--sky); }
.unit.on em { background: var(--blue); color: #fff; }
.st {
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.st.done { background: var(--good-soft); color: var(--good); }
.st.doing { background: var(--sun-soft); color: var(--sun-deep); }

.panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }

/* 卡片固定占满顶栏与底部菜单之间：100dvh 减去顶栏 64、页面上下留白 22 + 116；内容多了在卡内滚动 */
.study { display: flex; flex-direction: column; height: calc(100dvh - 202px); cursor: pointer; }
.study .head,
.study .actions { cursor: default; }
.study input { cursor: text; }
.study button,
.study a { cursor: pointer; }
.head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.retain-scope {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
}
.tally {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}
.tally.done { justify-content: center; margin: 8px 0 0; }
.tally .split { margin-left: 8px; }
.tally .fresh { color: var(--bad); }
.tally .known { color: var(--good); }
.head-side { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.again {
  padding: 6px 12px;
  border: 1.5px solid var(--line);
  border-radius: 999px;
  background: var(--card);
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.again:hover { border-color: var(--blue); color: var(--blue-deep); }
.again:active { background: var(--wash); }
.unit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 7px 12px 7px 14px;
  border: 1.5px solid var(--line);
  border-radius: 999px;
  background: var(--card);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.unit-btn:hover:not(:disabled) { border-color: var(--blue); }
.unit-btn:active:not(:disabled) { background: var(--wash); }
.unit-btn.plain:disabled { cursor: default; opacity: 1; }
.unit-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.unit-btn svg { width: 16px; height: 16px; color: var(--muted); flex: 0 0 auto; }
.count {
  padding: 5px 13px;
  border-radius: 999px;
  background: var(--sky);
  color: var(--blue-deep);
  font-family: var(--en);
  font-size: 13px;
  font-weight: 700;
}
.bar { height: 8px; margin: 14px 0 8px; border-radius: 999px; background: #e0eaf8; overflow: hidden; }
.bar > div { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--blue-deep), var(--blue)); transition: width 0.35s ease; }

.word-area {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding-top: clamp(26px, 6vh, 64px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: rise 0.28s ease;
}
.word-area.cols {
  max-width: none;
  align-items: stretch;
  padding: 18px clamp(36px, 5vw, 72px) 0;
}
.word-area.apply {
  overflow: hidden;
  max-width: none;
  padding-top: 8px;
  align-items: stretch;
}
.word-area.apply .word { font-size: clamp(40px, 5vw, 64px); }
.word-area.apply .stage { flex: 1; min-height: 0; align-items: stretch; }
.word-area.apply .stage-side { height: 100%; }
.word-area.apply .stage-side .block {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.word-area.apply .sentence {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
  padding: 20px 22px;
}
.word-area.apply .stage-main { align-items: stretch; text-align: left; }
.word-area.apply .ph-row { justify-content: flex-start; }
.word-area.apply .choices { width: 100%; max-width: none; margin-top: 18px; }
.word-area.apply .choice { padding: 9px 12px; }
.word-area.apply .choice-prompt { margin: 0 0 8px; text-align: left; font-size: 15px; }
.stage { width: 100%; display: flex; flex-direction: column; align-items: center; }
.stage-main { width: 100%; display: flex; flex-direction: column; align-items: center; }
.word-area.cols .stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px 32px;
  align-items: stretch;
  height: 100%;
  min-height: 0;
}
.word-area.apply.cols .stage {
  flex: 1;
  min-height: 0;
  align-items: stretch;
}
.word-area.cols .stage-main {
  align-self: stretch;
  align-items: center;
  justify-content: safe center;
  height: 100%;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  text-align: center;
}
.word-area.cols .ph-row { justify-content: center; max-width: 100%; }
.word-area.cols .stage-main .block { text-align: center; }
.word-area.cols .stage-main .chips { justify-content: center; }
.word-area.cols .pic {
  width: min(320px, 100%);
  max-width: 320px;
  flex: 0 1 240px;
  min-height: 0;
  max-height: 240px;
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.word-area.cols .pic img { width: auto; max-width: 100%; height: auto; max-height: 100%; object-fit: contain; }
.stage-side { display: flex; flex-direction: column; gap: 16px; min-width: 0; text-align: left; }
.stage-side .block { margin-top: 0; }
.stage-side .example { margin-top: 0; }
@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.prompt { margin: 34px 0 22px; font-size: 21px; font-weight: 700; }
.word-area.hearing,
.word-area.blanking {
  justify-content: center;
  padding-top: 0;
}
.word-area.hearing { max-width: 640px; }
.word-area.blanking { max-width: 760px; }
.cloze { width: min(680px, 100%); display: flex; flex-direction: column; align-items: center; }
.word-area.blanking .prompt { margin: 0 0 8px; font-size: 18px; letter-spacing: 0.04em; }
.step-no { margin: 0 0 16px; color: var(--muted); font-size: 13px; font-weight: 700; letter-spacing: 0.08em; }
.cloze-mean { margin: 0; font-size: 26px; font-weight: 800; line-height: 1.35; }
.cloze-mean i {
  margin-right: 8px;
  padding: 2px 8px;
  border-radius: 8px;
  background: var(--sun-soft);
  color: var(--sun-deep);
  font-style: normal;
  font-size: 13px;
  font-weight: 700;
  vertical-align: 3px;
}
.cloze-en {
  width: 100%;
  margin: 18px 0 0;
  padding: 22px 26px;
  border-radius: 18px;
  background: var(--sky);
  font-family: var(--en);
  font-size: 22px;
  font-weight: 600;
  line-height: 1.85;
  text-align: center;
}
.word-area.spell.blanking .cloze-en { font-size: 26px; line-height: 1.75; }
.cloze-en .play { margin-left: 8px; vertical-align: middle; }
.stage-side .ex-en { flex: 1; min-width: 0; margin: 0; text-align: left; }
.slot {
  display: inline-block;
  min-width: 4.2em;
  max-width: 68%;
  height: 1.15em;
  margin: 0 4px -0.15em;
  border-bottom: 2.5px solid var(--blue);
  vertical-align: baseline;
}
.slot.shown {
  height: auto;
  min-height: 1.15em;
  color: var(--blue-deep);
  font-weight: 800;
  line-height: 1.2;
  font-size: 1.12em;
  user-select: none;
  -webkit-user-select: none;
}
.cloze-zh { margin: 12px 0 0; color: var(--muted); font-size: 15px; line-height: 1.6; }
.cloze-miss { margin: 18px 0 0; color: var(--muted); }
.listen {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 4px 14px 4px 4px;
  border: 0;
  border-radius: 999px;
  background: var(--sky);
  color: var(--blue-deep);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.listen i {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--blue);
  color: #fff;
}
.listen:active { transform: scale(0.97); }
.cap-tip { margin: 14px 0 0; color: var(--sun-deep); font-size: 13px; font-weight: 700; }
.ruled {
  --fs: 56px;
  position: relative;
  width: min(640px, 100%);
  height: calc(var(--fs) * 1.8);
  margin-top: 18px;
  overflow: visible;
  font-size: var(--fs);
}
.ruled::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(#e15b64, #e15b64) 0 0 / 100% 2px no-repeat,
    repeating-linear-gradient(90deg, #6d97e6 0 6px, transparent 6px 12px) 0 33.333% / 100% 1.5px no-repeat,
    repeating-linear-gradient(90deg, #6d97e6 0 6px, transparent 6px 12px) 0 66.666% / 100% 1.5px no-repeat,
    linear-gradient(#e15b64, #e15b64) 0 100% / 100% 2px no-repeat;
}
.ruled:focus-within::before {
  background:
    linear-gradient(#d64550, #d64550) 0 0 / 100% 2px no-repeat,
    repeating-linear-gradient(90deg, var(--blue) 0 6px, transparent 6px 12px) 0 33.333% / 100% 1.5px no-repeat,
    repeating-linear-gradient(90deg, var(--blue) 0 6px, transparent 6px 12px) 0 66.666% / 100% 1.5px no-repeat,
    linear-gradient(#d64550, #d64550) 0 100% / 100% 2px no-repeat;
}
.ear { display: flex; flex-direction: column; align-items: center; width: 100%; }
.word-area.hearing .prompt { margin: 0 0 48px; font-size: 18px; letter-spacing: 0.06em; }
.big-play {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 168px;
  height: 168px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 36% 32%, #6d93f0, var(--blue) 58%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 18px 40px rgba(62, 111, 227, 0.32);
  transition: transform 0.12s ease;
}
.big-play.compact { width: 112px; height: 112px; font-size: 13px; }
.big-play.compact svg { width: 36px; height: 36px; }
.big-play.compact .rings { display: none; }
.big-play:active { transform: scale(0.96); }
.big-play svg { width: 52px; height: 52px; }
.rings {
  position: absolute;
  inset: -34px;
  border-radius: 50%;
  border: 1.5px solid rgba(62, 111, 227, 0.14);
  pointer-events: none;
}
.rings i {
  position: absolute;
  inset: 14px;
  border-radius: 50%;
  border: 1.5px solid rgba(62, 111, 227, 0.28);
}
.word-area.hearing:has(.big-play.compact) .prompt { margin-bottom: 28px; }
.word-area.hearing .choices { width: 100%; max-width: 520px; margin-top: 44px; }
@media (prefers-reduced-motion: no-preference) {
  .rings { animation: pulse-ring 2.4s ease-out infinite; }
}
@keyframes pulse-ring {
  0% { transform: scale(0.92); opacity: 0.35; }
  70% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.04); opacity: 0.45; }
}

.ruled .spell {
  position: absolute;
  left: 0;
  right: 0;
  /* 字盒高出横线，避免 g、y 这类字母被裁掉 */
  top: calc(66.666% - 1.05em);
  width: 100%;
  height: 1.45em;
  margin: 0;
  padding: 0 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-sizing: border-box;
  overflow: visible;
  font-family: var(--en);
  font-size: var(--fs);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.45;
  text-align: center;
  color: var(--ink);
}
.ruled .spell:focus,
.ruled .spell:focus-visible { outline: none; border: 0; }
.ruled .spell:disabled { color: var(--ink); opacity: 1; }

.word {
  margin: 6px 0 0;
  max-width: 100%;
  font-family: var(--en);
  font-size: clamp(46px, 9vw, 78px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.16;
  text-wrap: balance;
  overflow-wrap: break-word;
}
/* 认读三页共用详情页的左上角。字号和字重不变，音标跟在单词后面 */
.word.tone-red { color: #d64545; }
.word.tone-brown { color: #9a7d32; }
.word.tone-green { color: #1c9a48; }
.word.tone-cyan { color: #1a86c9; }
.word.tone-purple { color: #7a45b8; }
.word.tone-navy { color: #1e3a8a; }
.word-area.recite .phonetic { font-size: 22px; }
.ph-row { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
.phonetic { margin: 0; color: var(--muted); font-family: var(--en); font-size: 19px; }
.pic {
  margin: 22px 0 0;
  padding: 0;
  max-width: 320px;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: var(--wash);
}
.pic img { display: block; width: 100%; max-height: 220px; object-fit: contain; }
.pill {
  padding: 8px 14px;
  border: 1.5px solid var(--line);
  border-radius: 999px;
  background: var(--card);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.pill:active { background: var(--wash); }
.meaning { margin: 0; font-size: 18px; font-weight: 700; }
.example { align-self: stretch; margin-top: 20px; padding: 15px 17px; border-radius: 14px; background: var(--sky); text-align: left; }
.ex-row { display: flex; align-items: center; gap: 12px; }
.ex-en { margin: 0; font-family: var(--en); font-size: 17px; font-weight: 600; line-height: 1.5; }
.ex-zh { margin: 8px 0 0; color: var(--muted); font-size: 14px; }
.example .play { background: #fff; flex: 0 0 auto; }

.block { align-self: stretch; margin-top: 26px; text-align: left; }
.label {
  margin: 0 0 10px;
  display: inline-block;
  padding: 4px 11px;
  border-radius: 999px;
  background: var(--wash);
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  padding: 9px 13px;
  background: var(--wash);
  border: 1.5px solid transparent;
  border-radius: 999px;
  font-family: var(--en);
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease;
}
.chip:hover { border-color: var(--blue); }
.chip small { color: var(--muted); font-size: 12px; margin-left: 2px; }
.note {
  margin: 0 0 10px;
  padding: 13px 15px;
  border-radius: 12px;
  background: var(--sun-soft);
  line-height: 1.65;
  font-size: 15px;
  color: #6b5310;
}
.line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 10px;
  padding: 11px 14px;
  border-radius: 12px;
  background: var(--wash);
  line-height: 1.6;
}
.line i { margin-right: 6px; color: var(--sun-deep); font-style: normal; font-size: 12px; font-weight: 700; }
.sentence { margin: 0 0 10px; padding: 13px 15px; border-radius: 12px; background: var(--wash); line-height: 1.65; }
.sentence.asked { box-shadow: inset 3px 0 0 var(--blue); }
.sentence p { margin: 0; }
.text-btn {
  padding: 0;
  flex: 0 0 auto;
  border: 0;
  background: none;
  color: var(--blue);
  font-weight: 600;
  cursor: pointer;
}

.choices {
  width: min(560px, 100%);
  margin: 26px auto 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.prompt.choice-prompt { margin: 0 0 2px; font-size: 16px; }
.choice-result { margin: 0; font-size: 15px; font-weight: 700; }
.choice-result.ok { color: var(--good); }
.choice-result.bad { color: var(--bad); }
.choice {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  border: 1.5px solid var(--line);
  border-radius: 14px;
  background: #fff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
  cursor: pointer;
}
.choice:hover:not(:disabled) { border-color: var(--blue); }
.choice i {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  border: 2px solid #b7c6de;
  border-radius: 50%;
  background: #fff;
  box-sizing: border-box;
}
.choice.on { border-color: var(--blue); background: var(--sky); }
.choice.on i { border-color: var(--blue); box-shadow: inset 0 0 0 4px var(--blue); }
.choice.right { border-color: var(--good); background: var(--good-soft); }
.choice.right i { border-color: var(--good); background: var(--good); box-shadow: none; }
.choice.wrong { border-color: var(--bad); background: var(--bad-soft); }
.choice.wrong i { border-color: var(--bad); background: var(--bad); box-shadow: none; }
.choice:disabled { cursor: default; }
.choice:disabled:not(.right):not(.wrong) { opacity: 0.55; }

.tip {
  display: inline-block;
  margin: 14px 0 0;
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}
.tip.ok { background: var(--good-soft); color: var(--good); }
.tip.bad { background: var(--bad-soft); color: var(--bad); }
.word-area.spell.blanking ~ .tip {
  user-select: none;
  -webkit-user-select: none;
  font-size: 17px;
}

.actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; max-width: 640px; width: 100%; margin: 30px auto 0; }
/* 学习卡里的按钮钉在右下角。左位是认识，右位是不认识。非红词点认识后，下一个仍占左位 */
.study .actions { justify-content: flex-end; gap: 16px; max-width: none; margin: 22px 0 0; }
.study .actions .btn { min-width: 176px; min-height: 72px; padding: 0 28px; border-radius: 16px; font-size: 22px; }
.study .actions.slot-known { display: grid; grid-template-columns: 176px 176px; justify-content: end; }
.study .actions.slot-known .btn { grid-column: 1; width: 100%; }

/* 认读：认识、选择、详情三页单词都钉在左栏同一位置 */
.word-area.recite {
  max-width: none;
  margin: 0;
  align-items: stretch;
  text-align: left;
  padding: 8px clamp(36px, 5vw, 72px) 0;
}
.word-area.recite .stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px 32px;
  align-items: start;
  width: 100%;
  height: auto;
}
.word-area.recite .stage-main {
  align-items: flex-start;
  justify-content: flex-start;
  height: auto;
  text-align: left;
}
.word-area.recite .title-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
  max-width: 100%;
}
.word-area.recite .word {
  margin: 0;
  font-size: clamp(44px, 4.6vw, 60px);
  font-weight: 400;
  letter-spacing: 0;
}
.word-area.recite .title-line .play { align-self: center; }
.word-area.recite .stage-main > .meaning {
  margin: 16px 0 0;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.4;
}
.word-area.recite .stage-main > .meaning i {
  margin-right: 10px;
  font-style: normal;
}
.word-area.recite .pic { align-self: flex-start; }
.word-area.recite .choices {
  width: 100%;
  max-width: none;
  margin: 28px 0 0;
  gap: 12px;
}
.word-area.recite .choice-prompt { margin: 0 0 6px; text-align: left; font-size: 18px; }
.word-area.recite .choice {
  min-height: 68px;
  padding: 16px 22px;
  font-size: 22px;
}
.word-area.recite .stage-side .ex-en { font-size: 22px; font-weight: 500; line-height: 1.55; }
.word-area.recite .stage-side .ex-zh { margin-top: 10px; color: var(--ink); font-size: 20px; line-height: 1.55; }
.word-area.recite .form-line { margin: 0 0 10px; font-size: 20px; line-height: 1.5; }

@media (max-width: 1100px) {
  .study { height: calc(100dvh - 184px); }
}
@media (max-width: 860px) {
  .word-area.cols:not(.recite) .stage { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .study .actions .btn { min-width: 0; min-height: 60px; padding: 0 16px; font-size: 18px; flex: 1 1 0; }
  .study .actions .btn:only-child { flex: 0 0 calc(50% - 5px); }
  .study .actions.slot-known { grid-template-columns: 1fr 1fr; }
}
.count.good { color: var(--good); }
.count.bad { color: var(--bad); }
.exam .head .count { font-size: 15px; }
.exam-body { width: min(760px, 100%); margin: 24px auto 0; color: var(--ink); }
.exam-body .word { margin: 0; font-size: clamp(42px, 5vw, 54px); }
.exam-body .phonetic { margin: 10px 0 0; font-size: 22px; color: #4a5270; }
.exam-body .prompt { margin: 22px 0 0; font-size: 20px; font-weight: 700; color: var(--ink); }
.exam .choices {
  width: min(680px, 100%);
  margin: 24px auto 0;
  gap: 14px;
}
.exam .choice {
  padding: 18px 22px;
  border: 2px solid #bcc9e0;
  border-radius: 16px;
  font-size: 21px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.5;
  box-shadow: 0 2px 10px rgba(31, 42, 77, 0.05);
}
.exam .choice:hover:not(:disabled) {
  border-color: var(--blue);
  box-shadow: 0 6px 16px rgba(62, 111, 227, 0.14);
}
.exam .choice.right,
.exam .choice.wrong { border-width: 2.5px; }
.exam .choice.right { color: #0f5a40; }
.exam .choice.wrong { color: #9f3321; }
.exam .choice:disabled:not(.right):not(.wrong) { opacity: 0.82; color: var(--ink); }
.exam .actions { margin: 32px auto 0; }
.exam .actions .btn { min-height: 56px; padding: 0 36px; font-size: 20px; }
.exam-mean { margin: 8px 0 0; font-size: 28px; font-weight: 700; }
.exam-write { display: flex; gap: 10px; margin-top: 16px; }
.exam-write input {
  flex: 1;
  height: 54px;
  padding: 0 16px;
  border: 2px solid #bcc9e0;
  border-radius: 12px;
  font-size: 22px;
  color: var(--ink);
}
.mask { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 20px; background: rgba(16, 22, 44, 0.48); }
.ask { width: min(460px, 100%); padding: 22px; border-radius: 18px; background: #fff; }
.ask h3 { margin: 0; font-size: 20px; }
.ask > p { margin: 12px 0 0; line-height: 1.6; }
.ask-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.ask-actions button { height: 38px; padding: 0 14px; border: 0; border-radius: 999px; background: var(--sky); color: var(--blue-deep); font-weight: 700; cursor: pointer; }
.ask-actions .primary { background: var(--blue); color: #fff; }
.detail { max-height: 80vh; overflow: auto; }
.detail article { margin-top: 12px; }
.detail p.right { color: var(--good); }
.detail p.wrong { color: var(--bad); }
.match-sheet {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 4px 0 12px;
}
</style>
