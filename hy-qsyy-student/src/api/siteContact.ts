import { getApi } from "@/api/common";

export interface SiteContactSocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export interface SiteContactRecord {
  id?: number;
  languageCode?: string;
  contactName?: string;
  email?: string;
  whatsapp?: string;
  whatsappLink?: string;
  phone?: string;
  address?: string;
  officeHours?: string;
  mapLink?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  socialLinks?: string;
  inquiryTip?: string;
}

export interface WebSiteContact {
  contactName: string;
  email: string;
  whatsapp: string;
  whatsappLink: string;
  phone: string;
  address: string;
  officeHours: string;
  mapLink: string;
  latitude: number | null;
  longitude: number | null;
  socialLinks: SiteContactSocialLink[];
  inquiryTip: string;
}

export const emptySiteContact: WebSiteContact = {
  contactName: "",
  email: "",
  whatsapp: "",
  whatsappLink: "",
  phone: "",
  address: "",
  officeHours: "",
  mapLink: "",
  latitude: null,
  longitude: null,
  socialLinks: [],
  inquiryTip: ""
};

export async function querySiteContact(languageCode: string): Promise<WebSiteContact> {
  const res = await getApi<SiteContactRecord>("/api/common/siteContact", {
    params: { languageCode }
  });
  return normalizeSiteContact(res.result);
}

export function normalizeSiteContact(record?: SiteContactRecord | null): WebSiteContact {
  if (!record) {
    return emptySiteContact;
  }
  return {
    contactName: record.contactName || "",
    email: record.email || "",
    whatsapp: record.whatsapp || "",
    whatsappLink: record.whatsappLink || buildWhatsappLink(record.whatsapp),
    phone: record.phone || "",
    address: record.address || "",
    officeHours: record.officeHours || "",
    mapLink: record.mapLink || "",
    latitude: parseCoordinate(record.latitude),
    longitude: parseCoordinate(record.longitude),
    socialLinks: parseSocialLinks(record.socialLinks),
    inquiryTip: record.inquiryTip || ""
  };
}

function parseCoordinate(value?: number | string | null): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSocialLinks(value?: string): SiteContactSocialLink[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => ({
        platform: String(item?.platform || "").trim(),
        url: String(item?.url || "").trim(),
        icon: String(item?.icon || "").trim()
      }))
      .filter((item) => item.platform && item.url);
  } catch {
    return [];
  }
}

function buildWhatsappLink(value?: string): string {
  if (!value) {
    return "";
  }
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}
