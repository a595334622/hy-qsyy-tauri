import { ref } from "vue";

/** 是否正在确认离开学习 */
export const leaveAsk = ref(false);

let pending: Promise<boolean> | null = null;
let resolver: ((ok: boolean) => void) | null = null;

/** 认读、辨音、拼写、三用、星图、微语篇算正在学习，离开前要确认 */
export function inStudy(path: string) {
  if (!sessionStorage.getItem("qsyy-book")) return false;
  return path.startsWith("/learn/") || path === "/starmap" || path === "/passage";
}

/** 弹出「是否退出当前学习」，点退出才返回 true */
export function confirmLeaveStudy() {
  if (pending) return pending;
  leaveAsk.value = true;
  pending = new Promise<boolean>(resolve => {
    resolver = (ok: boolean) => {
      leaveAsk.value = false;
      pending = null;
      resolver = null;
      resolve(ok);
    };
  });
  return pending;
}

/** 关闭离开确认。ok 为 true 表示退出 */
export function answerLeave(ok: boolean) {
  resolver?.(ok);
}
