const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

export class ApiError extends Error {
  status: number;
  details?: { path: string; message: string }[];

  constructor(status: number, message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? "Erro inesperado", data.details);
  }

  return data as T;
}

export async function apiUpload<T>(
  path: string,
  file: File,
  token: string | null
): Promise<T> {
  const formData = new FormData();
  formData.append("image", file);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? "Erro inesperado");
  }
  return data as T;
}

export function imageUrl(attractionId: string): string {
  return `${API_URL}/attractions/${attractionId}/image`;
}
