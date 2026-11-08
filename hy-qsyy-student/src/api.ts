import { ref } from "vue";

const TOKEN = "qsyy-student-token";
const PROFILE = "qsyy-student-profile";

/** 系统内置头像，和后端 StudentAvatars 一致 */
export const AVATARS = ["01", "02", "03", "04", "05", "06", "07", "08"];
export const DEFAULT_AVATAR = "01";

/** 本地登录资料变了就加一，让顶栏头像跟着刷新 */
export const sessionVersion = ref(0);

export function avatarCode(code?: string) {
  return code && AVATARS.includes(code) ? code : DEFAULT_AVATAR;
}

export function avatarUrl(code?: string) {
  return `/avatar/${avatarCode(code)}.svg`;
}

/** 开发走本机 8081；打包后跟当前页面的域名和端口（测试环境由 Nginx 反代，不再写死 8081）。 */
export function apiBase() {
  const { protocol, hostname, port } = window.location;
  if (import.meta.env.DEV) {
    return `${protocol}//${hostname}:8081`;
  }
  return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
}

export function fileUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${apiBase()}/${path.replace(/^\//, "")}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN) || "";
}

export function setSession(token: string, profile: { realname: string; phone: string; avatar?: string }) {
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(PROFILE, JSON.stringify({ ...profile, avatar: avatarCode(profile.avatar) }));
  sessionVersion.value += 1;
}

export function profile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE) || "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(PROFILE);
  sessionVersion.value += 1;
}

/** 换头像后，当前登录和这台设备记住的头像一起改 */
export function saveAvatar(code: string) {
  const current = profile();
  const avatar = avatarCode(code);
  if (current) {
    localStorage.setItem(PROFILE, JSON.stringify({ ...current, avatar }));
    const list = rememberedStudents().map(item => (item.phone === current.phone ? { ...item, avatar } : item));
    localStorage.setItem(REMEMBERED, JSON.stringify(list));
  }
  sessionVersion.value += 1;
}

export interface RememberedStudent {
  id: number;
  realname: string;
  phone: string;
  rememberKey: string;
  avatar?: string;
}

const REMEMBERED = "qsyy-remembered-students";

/** 这台设备上登录过的学生 */
export function rememberedStudents(): RememberedStudent[] {
  try {
    const list = JSON.parse(localStorage.getItem(REMEMBERED) || "[]");
    if (!Array.isArray(list)) return [];
    return list.filter(item => item && item.phone && item.realname);
  } catch {
    return [];
  }
}

/** 记住这次登录的学生，同一手机号只留最新一条 */
export function rememberStudent(student: RememberedStudent) {
  const list = rememberedStudents().filter(item => item.phone !== student.phone);
  list.unshift(student);
  localStorage.setItem(REMEMBERED, JSON.stringify(list.slice(0, 12)));
}

/** 从这台设备拿掉这个学生 */
export function forgetStudent(phone: string) {
  localStorage.setItem(REMEMBERED, JSON.stringify(rememberedStudents().filter(item => item.phone !== phone)));
}

/** 密码改了之后，头像还在，但要点进去必须重新输密码 */
export function retireRememberKey(phone: string) {
  const list = rememberedStudents().map(item => item.phone === phone ? { ...item, rememberKey: "" } : item);
  localStorage.setItem(REMEMBERED, JSON.stringify(list));
}

export async function api<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["X-Auth-Token"] = token;
  const response = await fetch(`${apiBase()}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json();
  if (data && data.success === false && String(data.message || "").includes("登录")) {
    clearSession();
    if (!location.hash.includes("/login")) location.hash = "#/login";
  }
  return data;
}
