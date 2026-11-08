import { createRouter, createWebHashHistory } from "vue-router";
import { getToken } from "@/api";
import { answerLeave, confirmLeaveStudy, inStudy, leaveAsk } from "@/learnSession";
import { licensed } from "@/utils/tauri";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/activate", component: () => import("@/views/ActivatePage.vue"), meta: { public: true, title: "输入秘钥" } },
    { path: "/login", component: () => import("@/views/LoginPage.vue"), meta: { public: true, title: "学生登录" } },
    {
      path: "/",
      component: () => import("@/views/StudentLayout.vue"),
      children: [
        { path: "", component: () => import("@/views/HomePage.vue"), meta: { title: "学习中心" } },
        { path: "learn/:mode", component: () => import("@/views/LearnPage.vue"), meta: { title: "学习" } },
        { path: "starmap", redirect: "/" },
        { path: "passage", redirect: "/" },
        { path: "newwords", component: () => import("@/views/NewwordsPage.vue"), meta: { title: "生词本" } },
        { path: "profile", component: () => import("@/views/ProfilePage.vue"), meta: { title: "个人中心" } }
      ]
    }
  ]
});

router.beforeEach(async (to, from) => {
  if (!licensed.value) {
    if (leaveAsk.value) answerLeave(false);
    return to.path === "/activate" ? true : "/activate";
  }
  if (to.path === "/activate") return getToken() ? "/" : "/login";
  if (to.meta.public) {
    if (leaveAsk.value) answerLeave(false);
    return true;
  }
  if (!getToken()) return "/login";
  const mode = String(to.params.mode || "");
  if (to.path.startsWith("/learn/") && !["recite", "listen", "spell"].includes(mode)) return "/";
  // 学习过程中去别的页面，先问是否退出；刷新是整页重载，不会走到这里
  if (inStudy(from.path) && from.path !== to.path) {
    const ok = await confirmLeaveStudy();
    if (!ok) return false;
  }
  return true;
});

export default router;
