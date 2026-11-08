import { http } from "@/utils/http";
import type { RequestConfig, Result } from "@/utils/http";

export function getApi<T>(url: string, config?: RequestConfig): Promise<Result<T>> {
  return http.get<T>(url, config);
}

export function postApi<T>(
  url: string,
  data?: unknown,
  config?: RequestConfig
): Promise<Result<T>> {
  return http.post<T>(url, {
    ...config,
    data
  });
}
