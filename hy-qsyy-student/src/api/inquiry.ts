import { postApi } from "@/api/common";

export interface InquiryPayload {
  name: string;
  email?: string;
  phone?: string;
  message: string;
  languageCode?: string;
  sourcePage?: string;
}

export async function submitInquiry(payload: InquiryPayload): Promise<void> {
  const res = await postApi<string>("/api/inquiry/submit", payload);
  if (!res.success) {
    throw new Error(res.message || "Submit failed");
  }
}
