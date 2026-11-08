/// <reference types="vite/client" />

interface Window {
  /** Tauri 注入。浏览器里没有 */
  __TAURI__?: unknown;
  __TAURI_IPC__?: (message: Record<string, unknown>) => void;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<object, object, unknown>;
  export default component;
}
