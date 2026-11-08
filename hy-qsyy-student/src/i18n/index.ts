import { computed, ref, watch } from "vue";
import { messages } from "./messages";

export type LocaleCode = "zh-CN" | "en-US" | "fr-FR" | "ru-RU" | "ar-SA" | "es-ES";

const STORAGE_KEY = "wb-locale";

const localeOptions = [
  { value: "zh-CN" as const, label: "中文" },
  { value: "en-US" as const, label: "English" },
  { value: "fr-FR" as const, label: "Francais" },
  { value: "ru-RU" as const, label: "Русский" },
  { value: "ar-SA" as const, label: "العربية" },
  { value: "es-ES" as const, label: "Espanol" }
];

const saved = localStorage.getItem(STORAGE_KEY) as LocaleCode | null;
const currentLanguage = ref<LocaleCode>(
  localeOptions.some((item) => item.value === saved) ? saved! : "zh-CN"
);

watch(currentLanguage, (value) => {
  localStorage.setItem(STORAGE_KEY, value);
  document.documentElement.lang = value;
  document.documentElement.dir = value === "ar-SA" ? "rtl" : "ltr";
}, { immediate: true });

function resolve(tree: Record<string, unknown>, key: string): string {
  const value = key.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, tree);
  return typeof value === "string" ? value : key;
}

export function useI18n() {
  const isRtl = computed(() => currentLanguage.value === "ar-SA");

  const t = (key: string) => resolve(messages[currentLanguage.value] as Record<string, unknown>, key);

  const metaTitle = computed(() => t("site.metaTitle"));
  const metaDescription = computed(() => t("site.metaDescription"));

  return {
    currentLanguage,
    localeOptions,
    isRtl,
    t,
    metaTitle,
    metaDescription
  };
}
