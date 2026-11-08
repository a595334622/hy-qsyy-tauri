<template>
  <div class="login-page">
    <main class="login-shell">
      <section class="login-left">
        <div class="brand-row">
          <img src="/logo.png" alt="洽思英语" class="brand-logo" />
          <span class="brand-name">洽思英语</span>
        </div>
        <div class="hero-panel">
          <div class="eyebrow">Qiasi English</div>
          <h1>今天的课，从这里开始</h1>
          <p>认读速记、听音辩词、拼写训练放在同一个学习台里，打开就能接着上次的进度学。</p>
          <div class="hero-tags">
            <span>认读速记</span>
            <span>听音辩词</span>
            <span>拼写训练</span>
          </div>
        </div>
      </section>

      <section class="login-right">
        <div class="mobile-brand">
          <img src="/logo.png" alt="洽思英语" class="mobile-brand-logo" />
          <span class="mobile-brand-name">洽思英语</span>
        </div>
        <form class="form-wrapper" @submit.prevent="submit">
          <div class="form-brand">
            <img src="/logo.png" alt="洽思英语" class="form-logo" />
          </div>
          <h2 class="form-title">学员登录</h2>
          <div class="form-badges">
            <span>安全登录</span>
            <span>学习记录</span>
            <span>生词本</span>
          </div>

          <div class="login-tabs" role="tablist">
            <button type="button" role="tab" :class="{ on: tab === 'password' }" :aria-selected="tab === 'password'" @click="tab = 'password'">密码登录</button>
            <button type="button" role="tab" :class="{ on: tab === 'quick' }" :aria-selected="tab === 'quick'" @click="tab = 'quick'">快捷登录</button>
          </div>

          <div class="tab-stage">
          <div class="tab-panel" :class="{ on: tab === 'password' }" :inert="tab !== 'password'">
          <label class="field">
            <span class="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </span>
            <input v-model="phone" inputmode="tel" autocomplete="tel" placeholder="请输入手机号" />
          </label>
          <label class="field">
            <span class="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
              </svg>
            </span>
            <input v-model="password" :type="showPwd ? 'text' : 'password'" autocomplete="current-password" placeholder="请输入密码" />
            <button type="button" class="peek" @click="showPwd = !showPwd">{{ showPwd ? "隐藏" : "显示" }}</button>
          </label>
          <div class="captcha-row">
            <label class="field">
              <span class="field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                </svg>
              </span>
              <input v-model="captcha" maxlength="4" autocomplete="off" placeholder="请输入验证码" />
            </label>
            <button type="button" class="captcha" @click="refreshCaptcha">
              <img v-if="captchaImg" :src="captchaImg" alt="验证码" />
              <span v-else>点击获取</span>
            </button>
          </div>

          <p v-if="tab === 'password' && error" class="error" role="alert">{{ error }}</p>
          <button class="submit" :disabled="loading">{{ loading ? "登录中..." : "登录" }}</button>
          <p class="login-tip">验证码不清晰时，点击图片即可刷新</p>
          </div>

          <div class="tab-panel remembered" :class="{ on: tab === 'quick' }" :inert="tab !== 'quick'" role="tabpanel">
            <div v-if="remembered.length" class="faces">
              <div v-for="item in remembered" :key="item.phone" class="face">
                <button type="button" class="face-main" :disabled="entering === item.phone" @click="enterByAvatar(item)">
                  <img class="face-ava" :src="avatarUrl(item.avatar)" alt="" />
                  <span>{{ item.realname }}</span>
                </button>
                <button type="button" class="face-x" aria-label="从这台设备移除" @click="removeRemembered(item)">×</button>
              </div>
            </div>
            <p v-else class="quick-empty">这台设备还没有登录过的学员。先用密码登录一次，下次就能点头像进入。</p>
            <button v-if="!remembered.length" type="button" class="to-password" @click="tab = 'password'">去密码登录</button>
            <p v-if="tab === 'quick' && error" class="error" role="alert">{{ error }}</p>
          </div>
          </div>
          <p class="support-line">技术支持：WH</p>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api, avatarUrl, forgetStudent, rememberedStudents, rememberStudent, retireRememberKey, setSession, type RememberedStudent } from "@/api";

const phone = ref("");
const password = ref("");
const captcha = ref("");
const captchaKey = ref("");
const captchaImg = ref("");
const showPwd = ref(false);
const error = ref("");
const loading = ref(false);
const entering = ref("");
const remembered = ref<RememberedStudent[]>(rememberedStudents());
const tab = ref<"password" | "quick">(remembered.value.length ? "quick" : "password");
const router = useRouter();

function refreshRemembered() {
  remembered.value = rememberedStudents();
}

function finishLogin(result: any) {
  rememberStudent({
    id: result.id,
    realname: result.realname,
    phone: result.phone,
    rememberKey: result.rememberKey || "",
    avatar: result.avatar
  });
  setSession(result.token, { realname: result.realname, phone: result.phone, avatar: result.avatar });
  router.push("/");
}

async function enterByAvatar(item: RememberedStudent) {
  error.value = "";
  if (!item.rememberKey) {
    phone.value = item.phone;
    tab.value = "password";
    error.value = "请输入密码和验证码";
    return;
  }
  entering.value = item.phone;
  try {
    const res: any = await api("/student/remember", {
      method: "POST",
      body: { rememberKey: item.rememberKey }
    });
    if (!res?.success) {
      phone.value = item.phone;
      tab.value = "password";
      error.value = res?.message || "请重新输入密码";
      retireRememberKey(item.phone);
      refreshRemembered();
      return;
    }
    finishLogin(res.result);
  } finally {
    entering.value = "";
  }
}

function removeRemembered(item: RememberedStudent) {
  forgetStudent(item.phone);
  refreshRemembered();
}

async function refreshCaptcha() {
  captchaKey.value = Date.now().toString();
  captcha.value = "";
  const res: any = await api(`/student/randomImage/${captchaKey.value}`);
  captchaImg.value = res?.result || res?.message || "";
}

onMounted(refreshCaptcha);

async function submit() {
  if (tab.value !== "password") return;
  error.value = "";
  if (!phone.value.trim() || !password.value || !captcha.value.trim()) {
    error.value = "请填写手机号、密码和验证码";
    return;
  }
  loading.value = true;
  try {
    const res: any = await api("/student/login", {
      method: "POST",
      body: {
        phone: phone.value.trim(),
        password: password.value,
        captcha: captcha.value.trim(),
        checkKey: captchaKey.value
      }
    });
    if (!res?.success) {
      error.value = res?.message || "登录失败";
      refreshCaptcha();
      return;
    }
    finishLogin(res.result);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  color: #102a43;
  background:
    radial-gradient(circle at 16% 84%, rgba(40, 121, 255, 0.22), transparent 28%),
    radial-gradient(circle at 88% 88%, rgba(32, 184, 255, 0.18), transparent 24%),
    linear-gradient(135deg, #eaf4ff 0%, #d8eaff 46%, #f7fbff 100%);
}

.login-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(420px, 0.82fr);
  gap: 48px;
  align-items: center;
  min-height: 100vh;
  padding: 58px 74px 42px;
}

.login-left {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  min-height: 680px;
  padding: 34px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(248, 252, 255, 0.96) 0%, rgba(239, 248, 255, 0.84) 43%, rgba(230, 243, 255, 0.18) 100%),
    url("/login-hero.jpg") center / cover no-repeat;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 8px;
  box-shadow: 0 28px 80px rgba(16, 82, 150, 0.16);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
}

.brand-logo {
  height: 36px;
  width: auto;
  max-width: 128px;
  object-fit: contain;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  color: #0757a8;
}

.hero-panel {
  max-width: 560px;
  padding: 36px 20px 18px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  margin-bottom: 20px;
  font-size: 13px;
  font-weight: 700;
  color: #0a64bc;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.86);
  border-radius: 999px;
}

.hero-panel h1 {
  max-width: 540px;
  margin: 0;
  font-size: 46px;
  font-weight: 800;
  line-height: 1.22;
  color: #073763;
}

.hero-panel p {
  max-width: 520px;
  margin: 20px 0 0;
  font-size: 17px;
  line-height: 1.9;
  color: rgba(7, 55, 99, 0.72);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.hero-tags span {
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  color: #0c5ea8;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 999px;
}

.login-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 32px;
}

.mobile-brand-logo {
  height: 32px;
  width: auto;
  max-width: 118px;
  object-fit: contain;
}

.mobile-brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #073763;
}

.form-wrapper {
  width: 100%;
  max-width: 470px;
  padding: 52px 54px 36px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.86);
  border-radius: 8px;
  box-shadow: 0 32px 88px rgba(13, 82, 151, 0.18);
  backdrop-filter: blur(18px);
}

.form-brand {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 800;
  color: #0757a8;
}

.form-logo {
  width: 148px;
  height: auto;
  object-fit: contain;
}

.form-title {
  margin: 0 0 10px;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.25;
  color: #073763;
  text-align: center;
}

.form-badges {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 18px 0 30px;
}

.form-badges span {
  padding: 7px 12px;
  font-size: 13px;
  color: #0c5ea8;
  background: rgba(231, 242, 255, 0.78);
  border-radius: 999px;
}

.login-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin: 0 0 22px;
  padding: 4px;
  background: rgba(231, 242, 255, 0.9);
  border-radius: 10px;
}

.login-tabs button {
  height: 40px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #5b7894;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.login-tabs button.on {
  background: #fff;
  color: #073763;
  box-shadow: 0 4px 12px rgba(15, 92, 169, 0.1);
}

.tab-stage {
  display: grid;
}

.tab-panel {
  grid-area: 1 / 1;
}

.tab-panel:not(.on) {
  visibility: hidden;
}

.remembered {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.quick-empty {
  margin: 8px 0 0;
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(7, 55, 99, 0.68);
}

.to-password {
  display: block;
  width: 100%;
  height: 48px;
  margin-top: 18px;
  border: 0;
  border-radius: 8px;
  background: #e7f2ff;
  color: #0757a8;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.to-password:hover {
  background: #d7e8ff;
}

.faces {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px 18px;
}

.face {
  position: relative;
  width: 76px;
}

.face-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.face-main:disabled {
  opacity: 0.6;
  cursor: default;
}

.face-ava {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  box-shadow: 0 8px 16px rgba(15, 92, 169, 0.18);
}

.face-main span {
  max-width: 76px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  color: #0d3458;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.face-x {
  position: absolute;
  top: -4px;
  right: 4px;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #fff;
  color: #7a8095;
  font-size: 14px;
  line-height: 18px;
  box-shadow: 0 2px 6px rgba(31, 42, 77, 0.16);
  cursor: pointer;
}

.field {
  position: relative;
  display: block;
  margin-bottom: 16px;
}

.field input {
  width: 100%;
  height: 52px;
  padding: 0 64px 0 44px;
  color: #0d3458;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(206, 226, 245, 0.92);
  border-radius: 8px;
  box-shadow: 0 8px 22px rgba(15, 92, 169, 0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field input:hover {
  border-color: rgba(41, 132, 224, 0.56);
}

.field input:focus {
  border-color: #0a66d0;
  box-shadow: 0 0 0 3px rgba(10, 102, 208, 0.12);
}

.field-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  display: grid;
  place-items: center;
  color: #5b7894;
  transform: translateY(-50%);
  pointer-events: none;
}

.field-icon svg {
  width: 16px;
  height: 16px;
}

.peek {
  position: absolute;
  right: 14px;
  top: 50%;
  padding: 0;
  border: 0;
  background: transparent;
  color: #6e879f;
  font-size: 13px;
  font-weight: 600;
  transform: translateY(-50%);
  cursor: pointer;
}

.peek:hover {
  color: #0a66d0;
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.captcha-row .field {
  flex: 1;
  margin-bottom: 16px;
}

.captcha-row input {
  padding-right: 16px;
}

.captcha {
  width: 128px;
  height: 52px;
  padding: 4px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(206, 226, 245, 0.92);
  border-radius: 8px;
  color: #6e879f;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.captcha:hover {
  border-color: #0a66d0;
  box-shadow: 0 10px 26px rgba(15, 92, 169, 0.1);
}

.captcha img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}

.error {
  margin: 0 0 12px;
  padding: 9px 13px;
  border-radius: 8px;
  background: #fdebe6;
  color: #e2533b;
  font-size: 13px;
}

.submit {
  width: 100%;
  height: 52px;
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #075ec2, #1097e6);
  border: 0;
  border-radius: 8px;
  box-shadow: 0 16px 30px rgba(8, 104, 207, 0.28);
  cursor: pointer;
}

.submit:hover {
  background: linear-gradient(135deg, #064fa5, #0a85d8);
}

.submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-tip {
  margin: 16px 0 22px;
  font-size: 13px;
  color: rgba(7, 55, 99, 0.62);
}

.support-line {
  margin: 0;
  padding-top: 20px;
  font-size: 13px;
  color: rgba(7, 55, 99, 0.58);
  text-align: center;
  border-top: 1px dashed rgba(9, 97, 188, 0.22);
}

@media screen and (max-width: 1180px) {
  .login-shell {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 72px 28px 36px;
  }

  .login-left {
    display: none;
  }

  .mobile-brand {
    display: flex;
  }
}

@media screen and (max-width: 560px) {
  .login-shell {
    padding: 48px 16px 24px;
  }

  .form-wrapper {
    padding: 34px 22px 28px;
  }

  .form-title {
    font-size: 26px;
  }

  .form-badges {
    flex-wrap: wrap;
  }

  .captcha {
    width: 112px;
  }
}
</style>
