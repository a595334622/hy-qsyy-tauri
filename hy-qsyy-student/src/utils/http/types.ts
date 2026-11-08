export type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface Result<T = unknown> {
  success: boolean;
  message: string;
  code: number;
  result: T;
  timestamp: number;
}

export interface RequestConfig extends Omit<RequestInit, "body" | "method"> {
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
  skipError?: boolean;
}

export class HttpError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
  }
}
