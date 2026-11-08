import type { RequestConfig, RequestMethod, Result } from "./types";

export type { RequestConfig, RequestMethod, Result } from "./types";
export { HttpError } from "./types";

const DEFAULT_TIMEOUT = 300000;

const getBaseURL = (): string => {
  const { protocol, hostname } = window.location;

  if (import.meta.env.DEV) {
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:8081`;
    }
    return `${protocol}//${hostname}:8081`;
  }

  const { port } = window.location;
  const portStr = port ? `:${port}` : "";
  return `${protocol}//${hostname}${portStr}`;
};

export const getImageBaseURL = getBaseURL;

class WebHttp {
  private baseURL = getBaseURL();

  public updateBaseURL(baseURL?: string): void {
    this.baseURL = baseURL || getBaseURL();
  }

  public getBaseURL(): string {
    return this.baseURL;
  }

  public async request<T>(
    method: RequestMethod,
    url: string,
    config: RequestConfig = {}
  ): Promise<Result<T>> {
    const controller = new AbortController();
    const timeout = config.timeout || DEFAULT_TIMEOUT;
    const timer = window.setTimeout(() => controller.abort(), timeout);
    const requestUrl = this.buildUrl(url, config.params);
    const headers = this.buildHeaders(config);

    try {
      const response = await fetch(requestUrl, {
        ...config,
        method,
        headers,
        body: this.buildBody(config.data, headers),
        signal: config.signal || controller.signal
      });
      return await this.handleResponse<T>(response);
    } finally {
      window.clearTimeout(timer);
    }
  }

  public get<T>(url: string, config?: RequestConfig): Promise<Result<T>> {
    return this.request<T>("GET", url, config);
  }

  public post<T>(url: string, config?: RequestConfig): Promise<Result<T>> {
    return this.request<T>("POST", url, config);
  }

  public put<T>(url: string, config?: RequestConfig): Promise<Result<T>> {
    return this.request<T>("PUT", url, config);
  }

  public delete<T>(url: string, config?: RequestConfig): Promise<Result<T>> {
    return this.request<T>("DELETE", url, config);
  }

  private buildUrl(url: string, params?: Record<string, unknown>): string {
    const fullUrl = /^https?:\/\//.test(url) ? new URL(url) : new URL(url, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          return;
        }
        if (Array.isArray(value)) {
          value.forEach((item) => fullUrl.searchParams.append(key, String(item)));
          return;
        }
        fullUrl.searchParams.set(key, String(value));
      });
    }
    return fullUrl.toString();
  }

  private buildHeaders(config: RequestConfig): Headers {
    const headers = new Headers(config.headers);
    headers.set("Accept", headers.get("Accept") || "application/json, text/plain, */*");
    headers.set("X-Requested-With", headers.get("X-Requested-With") || "XMLHttpRequest");
    if (!headers.has("Lang") && !headers.has("X-Language")) {
      headers.set("Lang", this.getCurrentLanguage());
    }
    return headers;
  }

  private buildBody(data: unknown, headers: Headers): BodyInit | undefined {
    if (data === undefined || data === null) {
      return undefined;
    }
    if (data instanceof FormData || data instanceof Blob || typeof data === "string") {
      return data;
    }
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return JSON.stringify(data);
  }

  private async handleResponse<T>(response: Response): Promise<Result<T>> {
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    if (!response.ok) {
      throw new Error(typeof data === "string" ? data : data?.message || "请求失败");
    }
    return data as Result<T>;
  }

  private getCurrentLanguage(): string {
    return document.documentElement.lang || navigator.language || "zh-CN";
  }
}

export const http = new WebHttp();
