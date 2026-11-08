import { getImageBaseURL } from "@/utils/http";

export function parseStringArray(value?: string): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
  } catch {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function resolveMediaUrl(path?: string): string {
  if (!path) return "";
  const value = path.trim();
  if (!value) return "";
  if (value.startsWith("data:") || /^https?:\/\//.test(value)) {
    return value;
  }
  // /media 等相对路径统一走后端上传目录
  return `${getImageBaseURL()}/${value.replace(/^\//, "")}`;
}
