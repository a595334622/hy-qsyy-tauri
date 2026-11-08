import { readonly, ref, watch } from "vue";
import { emptySiteContact, querySiteContact, type WebSiteContact } from "@/api/siteContact";
import { useI18n } from "@/i18n";

const siteContact = ref<WebSiteContact>(emptySiteContact);
const loading = ref(false);
let requestVersion = 0;
let initialized = false;

const { currentLanguage } = useI18n();

const loadSiteContact = async () => {
  const currentVersion = ++requestVersion;
  loading.value = true;
  try {
    const result = await querySiteContact(currentLanguage.value);
    if (currentVersion === requestVersion) {
      siteContact.value = result;
    }
  } catch {
    if (currentVersion === requestVersion) {
      siteContact.value = emptySiteContact;
    }
  } finally {
    if (currentVersion === requestVersion) {
      loading.value = false;
    }
  }
};

const initSiteContactWatcher = () => {
  if (initialized) {
    return;
  }
  initialized = true;
  watch(currentLanguage, loadSiteContact, { immediate: true });
};

export function useSiteContact() {
  initSiteContactWatcher();

  return {
    siteContact: readonly(siteContact),
    siteContactLoading: readonly(loading),
    loadSiteContact
  };
}
