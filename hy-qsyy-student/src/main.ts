import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { isTauriEnv, prepareShell } from "@/utils/tauri";
import "./styles/student.css";

/** 不在壳里时挡住页面 */
function showBlocked(title: string, detail: string) {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) return;
  root.replaceChildren();

  const page = document.createElement("div");
  page.className = "blocked";

  const card = document.createElement("div");
  card.className = "blocked-card";

  const logo = document.createElement("img");
  logo.className = "blocked-logo";
  logo.src = "/logo.png";
  logo.alt = "洽思英语";

  const mark = document.createElement("div");
  mark.className = "blocked-mark";
  mark.innerHTML =
    '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="22" width="20" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M18 22v-4a6 6 0 0 1 12 0v4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  const heading = document.createElement("h1");
  heading.textContent = title;

  const text = document.createElement("p");
  text.textContent = detail;

  card.append(logo, mark, heading, text);
  page.append(card);
  root.append(page);
}

if (!isTauriEnv()) {
  showBlocked("非法访问", "请打开洽思英语客户端，再进入学习。");
} else {
  prepareShell()
    .then(() => {
      createApp(App).use(router).mount("#app");
    })
    .catch(error => {
      const detail = typeof error === "string" && error ? error : "请打开洽思英语客户端，再进入学习。";
      showBlocked("非法访问", detail);
    });
}
