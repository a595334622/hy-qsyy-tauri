import { ref } from "vue";
import { api } from "@/api";

/** 是否运行在 Tauri 桌面壳内 */
export function isTauriEnv() {
  return typeof window !== "undefined" && !!window.__TAURI__;
}

function uid() {
  return window.crypto.getRandomValues(new Uint32Array(1))[0];
}

function transformCallback(callback: (value: unknown) => void, once = false) {
  const identifier = uid();
  const prop = `_${identifier}`;
  Object.defineProperty(window, prop, {
    value: (result: unknown) => {
      if (once) {
        Reflect.deleteProperty(window, prop);
      }
      callback(result);
    },
    writable: false,
    configurable: true
  });
  return identifier;
}

/** 调用壳里的命令。走和 hg-tour-client 一样的 __TAURI_IPC__。 */
export function invoke<T>(cmd: string, args: Record<string, unknown> = {}) {
  return new Promise<T>((resolve, reject) => {
    if (!isTauriEnv() || !window.__TAURI_IPC__) {
      reject(new Error("非法访问"));
      return;
    }
    let errorName = "";
    const callback = transformCallback(value => {
      resolve(value as T);
      Reflect.deleteProperty(window, errorName);
    }, true);
    const error = transformCallback(value => {
      reject(value);
      Reflect.deleteProperty(window, `_${callback}`);
    }, true);
    errorName = `_${error}`;
    window.__TAURI_IPC__({
      cmd,
      callback,
      error,
      ...args
    });
  });
}

/** 本机唯一编码 */
export const machineCode = ref("");
/** 已经写进本机配置的秘钥 */
export const savedSecret = ref("");
/** 当前秘钥已经通过服务端校验 */
export const licensed = ref(false);
/** 已保存秘钥校验失败时的说明 */
export const licenseMessage = ref("");

/** 清掉网页缓存。本机秘钥文件不动 */
export function clearBrowserCache() {
  return invoke<void>("clear_browser_cache");
}

/** 关闭客户端 */
export function quitApp() {
  return invoke<void>("quit_app");
}

/** 把验证通过的秘钥记到本机配置 */
export async function saveClientSecret(secret: string) {
  const value = secret.trim();
  await invoke("save_client_secret", { secret: value });
  savedSecret.value = value;
}

/** 读取本机编码和已保存秘钥。有秘钥时先向服务端复核 */
export async function prepareShell() {
  machineCode.value = await invoke<string>("auth_code");
  const secret = await invoke<string>("client_secret");
  savedSecret.value = (secret || "").trim();
  if (!savedSecret.value) {
    licensed.value = false;
    licenseMessage.value = "";
    return;
  }
  try {
    const res = await api<{ success?: boolean; message?: string }>("/student/client/activate", {
      method: "POST",
      body: { secret: savedSecret.value, machineCode: machineCode.value }
    });
    licensed.value = !!res?.success;
    licenseMessage.value = res?.success ? "" : res?.message || "授权校验失败";
  } catch {
    licensed.value = false;
    licenseMessage.value = "授权校验失败，请稍后重试";
  }
}
