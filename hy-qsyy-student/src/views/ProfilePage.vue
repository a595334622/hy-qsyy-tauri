<template>
  <div class="page me">
    <header class="sky-hero">
      <i
        v-for="(p, i) in slots"
        :key="i"
        class="st"
        :class="{ on: i < lit }"
        :style="{ left: p[0] + '%', top: p[1] + '%' }"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3Z" />
        </svg>
      </i>

      <div class="id">
        <p class="hi">{{ greeting }}</p>
        <span class="ava-wrap">
          <button class="ava" type="button" title="更换头像" @click="openAvatars">
            <img :src="face" alt="" />
          </button>
          <i class="pin">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3Z" />
            </svg>
          </i>
        </span>
        <h2 class="display nm">{{ name }}</h2>
        <p class="tel">{{ maskedPhone }}</p>
      </div>
      <p class="note">认读速记、听音辩词、拼写训练，接着上次的进度学</p>
      <button class="pwd-open" type="button" @click="openAvatars">更换头像</button>
      <button class="pwd-open" type="button" @click="openPassword">修改密码</button>
      <button class="out" type="button" @click="logout">退出登录</button>
    </header>

    <div class="right">
      <section class="sheet desk">
        <p class="tag">我的书桌</p>
        <router-link to="/" class="desk-row">
          <span class="cv" :class="{ ghost: !book }">
            <img v-if="book" :src="coverOf(book)" alt="" />
            <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" />
              <path d="M13 3h4.5A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 0-2.5-2.5H13V3Z" />
            </svg>
          </span>
          <span class="dk-txt">
            <b>{{ book ? book.name : "还没有选教材" }}</b>
            <span class="meta">{{ book ? meta(book) : "去首页挑一本，开始今天的学习" }}</span>
          </span>
          <span class="go">
            {{ book ? "继续学" : "去挑选" }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </span>
        </router-link>
      </section>
      <ProfileCenter />
    </div>

    <div v-if="avatarOpen" class="mask" @click.self="avatarOpen = false">
      <div class="ask faces" role="dialog" aria-modal="true" aria-labelledby="ava-title">
        <h3 id="ava-title">选择头像</h3>
        <p>从系统里选一张，不能自己上传。</p>
        <div class="picker">
          <button
            v-for="code in AVATARS"
            :key="code"
            type="button"
            class="pick"
            :class="{ on: code === avatar }"
            :disabled="avatarBusy"
            @click="chooseAvatar(code)"
          >
            <img :src="avatarUrl(code)" alt="" />
          </button>
        </div>
        <p v-if="avatarTip" class="tip">{{ avatarTip }}</p>
        <div class="ask-actions">
          <button type="button" @click="avatarOpen = false">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="pwdOpen" class="mask" @click.self="closePassword">
      <form class="ask" role="dialog" aria-modal="true" aria-labelledby="pwd-title" @submit.prevent="submitPassword">
        <h3 id="pwd-title">修改密码</h3>
        <p>改完需要重新登录。这台设备上的头像快捷登录也会失效。</p>
        <label>
          原密码
          <input v-model="pwd.oldPassword" type="password" autocomplete="current-password" />
        </label>
        <label>
          新密码
          <input v-model="pwd.newPassword" type="password" autocomplete="new-password" placeholder="不少于6位" />
        </label>
        <label>
          确认密码
          <input v-model="pwd.confirmPassword" type="password" autocomplete="new-password" />
        </label>
        <p v-if="pwdTip" class="pwd-tip" :class="{ ok: pwdOk }">{{ pwdTip }}</p>
        <div class="ask-actions">
          <button type="button" @click="closePassword">取消</button>
          <button class="primary" type="submit" :disabled="pwdBusy">{{ pwdBusy ? "保存中..." : "保存" }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { AVATARS, api, avatarUrl, clearSession, fileUrl, profile, retireRememberKey, saveAvatar, sessionVersion } from "@/api";
import { starState } from "@/stars";
import ProfileCenter from "./ProfileCenter.vue";

const router = useRouter();
const name = computed(() => profile()?.realname || "学员");
const face = computed(() => {
  sessionVersion.value;
  return avatarUrl(profile()?.avatar);
});
const avatar = computed(() => {
  sessionVersion.value;
  return profile()?.avatar;
});
const maskedPhone = computed(() => {
  const phone = profile()?.phone || "";
  return phone ? phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1 **** $2") : "未填写手机号";
});
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return "夜深了";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

const state = starState();
const lit = state.lit.length;
const slots: [number, number][] = [
  [78, 18], [90, 12], [86, 34], [72, 42], [94, 48]
];

const book = ref<any>(null);

onMounted(async () => {
  const me: any = await api("/student/me");
  if (me?.success) saveAvatar(me.result?.avatar);
  const id = Number(sessionStorage.getItem("qsyy-book") || 0);
  if (!id) return;
  const res: any = await api("/student/learn/textbooks");
  const list = res?.success ? res.result || [] : [];
  book.value = list.find((item: any) => item.id === id) || null;
});

function meta(item: any) {
  return [item.publisher, item.grade, item.volume].filter(Boolean).join(" · ") || "当前在学";
}

function coverOf(item: any) {
  const path = item.cover || `textbook/cover/textbook-${item.id}.svg`;
  return fileUrl(String(path).replace(/^\//, ""));
}

const avatarOpen = ref(false);
const avatarBusy = ref(false);
const avatarTip = ref("");

function openAvatars() {
  avatarTip.value = "";
  avatarOpen.value = true;
}

async function chooseAvatar(code: string) {
  if (avatarBusy.value) return;
  avatarBusy.value = true;
  avatarTip.value = "";
  try {
    const res: any = await api("/student/avatar", { method: "POST", body: { avatar: code } });
    if (!res?.success) {
      avatarTip.value = res?.message || "没有换成";
      return;
    }
    saveAvatar(code);
    avatarOpen.value = false;
  } finally {
    avatarBusy.value = false;
  }
}

const pwdOpen = ref(false);
const pwd = reactive({ oldPassword: "", newPassword: "", confirmPassword: "" });
const pwdBusy = ref(false);
const pwdTip = ref("");
const pwdOk = ref(false);

function openPassword() {
  pwd.oldPassword = "";
  pwd.newPassword = "";
  pwd.confirmPassword = "";
  pwdTip.value = "";
  pwdOk.value = false;
  pwdOpen.value = true;
}

function closePassword() {
  if (pwdBusy.value) return;
  pwdOpen.value = false;
}

async function submitPassword() {
  pwdTip.value = "";
  pwdOk.value = false;
  if (!pwd.oldPassword || !pwd.newPassword || !pwd.confirmPassword) {
    pwdTip.value = "请把密码填完整";
    return;
  }
  if (pwd.newPassword.length < 6) {
    pwdTip.value = "新密码不少于6位";
    return;
  }
  if (pwd.newPassword !== pwd.confirmPassword) {
    pwdTip.value = "两次输入的密码不一致";
    return;
  }
  pwdBusy.value = true;
  try {
    const res: any = await api("/student/changePassword", {
      method: "POST",
      body: {
        oldPassword: pwd.oldPassword,
        newPassword: pwd.newPassword,
        confirmPassword: pwd.confirmPassword
      }
    });
    if (!res?.success) {
      pwdTip.value = res?.message || "修改失败";
      return;
    }
    pwdOk.value = true;
    pwdTip.value = "密码已修改，请重新登录";
    const phone = profile()?.phone;
    if (phone) retireRememberKey(phone);
    clearSession();
    setTimeout(() => router.push("/login"), 800);
  } finally {
    pwdBusy.value = false;
  }
}

async function logout() {
  await api("/student/logout", { method: "POST" });
  clearSession();
  router.push("/login");
}
</script>

<style scoped>
/* 左·身份卡，右·书桌。高度随内容，不把空白撑满一屏 */
.me {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

/* —— 星空身份板 —— */
.sky-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 32px 30px 26px;
  border-radius: 20px;
  color: #fff;
  background:
    radial-gradient(1.5px 1.5px at 14% 22%, rgba(255, 255, 255, 0.5), transparent 60%),
    radial-gradient(1.2px 1.2px at 34% 12%, rgba(255, 255, 255, 0.4), transparent 60%),
    radial-gradient(1.6px 1.6px at 42% 52%, rgba(255, 255, 255, 0.3), transparent 60%),
    radial-gradient(1.3px 1.3px at 10% 78%, rgba(255, 255, 255, 0.4), transparent 60%),
    radial-gradient(1.2px 1.2px at 30% 90%, rgba(255, 255, 255, 0.35), transparent 60%),
    radial-gradient(1.5px 1.5px at 46% 80%, rgba(255, 255, 255, 0.3), transparent 60%),
    radial-gradient(1.4px 1.4px at 16% 68%, rgba(255, 255, 255, 0.35), transparent 60%),
    radial-gradient(1.2px 1.2px at 38% 88%, rgba(255, 255, 255, 0.3), transparent 60%),
    radial-gradient(110% 130% at 30% 0%, #2c3768 0%, var(--night) 58%, #131a38 100%);
}
.st {
  position: absolute;
  color: rgba(255, 255, 255, 0.15);
  transform: translate(-50%, -50%);
}
.st svg { display: block; width: 14px; height: 14px; }
.st:nth-child(2n) svg { width: 10px; height: 10px; }
.st.on { color: var(--sun); }
.st.on svg { animation: glow 3.2s ease-in-out infinite; }
@keyframes glow {
  0%, 100% { filter: drop-shadow(0 0 3px rgba(245, 174, 43, 0.45)); }
  50% { filter: drop-shadow(0 0 8px rgba(245, 174, 43, 0.85)); }
}

.id { position: relative; }
.hi { margin: 0; font-size: 13px; color: rgba(255, 255, 255, 0.72); }
.ava-wrap { position: relative; display: inline-block; margin-top: 18px; }
.ava {
  width: 84px;
  height: 84px;
  padding: 0;
  border-radius: 28px;
  border: 3px solid #fff;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(9, 13, 32, 0.45);
  cursor: pointer;
}
.ava img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pin {
  position: absolute;
  right: -8px;
  bottom: -6px;
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.88);
  background: linear-gradient(135deg, #ffd77e, var(--sun-deep));
  box-shadow: 0 3px 8px rgba(9, 13, 32, 0.4);
}
.pin svg { width: 13px; height: 13px; color: #fff; }
.nm { margin: 16px 0 0; font-size: 30px; color: #fff; }
.tel {
  margin: 8px 0 0;
  font-family: var(--en);
  font-size: 13.5px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.72);
}
.note {
  position: relative;
  margin: 22px 0 0;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.55);
}
.pwd-open,
.out {
  position: relative;
  width: 100%;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.pwd-open {
  margin-top: 18px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}
.pwd-open:hover { background: rgba(255, 255, 255, 0.26); }
.out {
  margin-top: 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  box-shadow: none;
}
.out:hover { background: rgba(226, 83, 59, 0.88); border-color: transparent; }
.out:active { background: #c9442e; }

/* —— 右侧内容 —— */
.right { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

/* —— 我的书桌 —— */
.desk { margin: 0; }
.desk-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding: 15px 16px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--wash);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.desk-row:hover { background: #fff; box-shadow: 0 10px 24px rgba(31, 42, 77, 0.08); }
.cv {
  flex: none;
  width: 54px;
  height: 75px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  overflow: hidden;
  background: var(--sky);
  color: var(--blue);
}
.cv.ghost {
  width: 64px;
  height: 88px;
  background: transparent;
  border: 1.5px dashed #b8ccec;
  color: #9db6e4;
}
.cv img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cv svg { width: 24px; height: 24px; }
.cv.ghost svg { width: 26px; height: 26px; }
.dk-txt { flex: 1; min-width: 0; }
.dk-txt b {
  display: block;
  font-size: 17px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta { display: block; margin-top: 6px; color: var(--muted); font-size: 12.5px; }
.go {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  padding: 9px 18px;
  border-radius: 999px;
  background: var(--sky);
  color: var(--blue-deep);
  font-size: 13px;
  font-weight: 700;
  transition: background 0.2s ease, color 0.2s ease;
}
.desk-row:hover .go { background: var(--blue); color: #fff; }
.go svg { width: 15px; height: 15px; }

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
  color: var(--ink);
}
.picker { display: grid; grid-template-columns: repeat(4, 72px); gap: 12px; margin-top: 16px; }
.pick {
  width: 72px;
  height: 72px;
  padding: 0;
  border: 3px solid transparent;
  border-radius: 22px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
}
.pick img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pick.on { border-color: var(--blue); }
.ask h3 { margin: 0; font-size: 18px; }
.ask > p { margin: 10px 0 0; color: var(--muted); font-size: 14px; line-height: 1.6; }
.ask label {
  display: grid;
  gap: 6px;
  margin-top: 14px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}
.ask input {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--wash);
  color: var(--ink);
  font-size: 14px;
}
.pwd-tip { margin: 12px 0 0; color: var(--bad); font-size: 13px; }
.pwd-tip.ok { color: var(--good); }
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
.ask-actions .primary { background: var(--blue); color: #fff; }
.ask-actions button:disabled { opacity: 0.6; cursor: default; }

@media (max-width: 860px) {
  .me { grid-template-columns: 1fr; }
}
</style>
