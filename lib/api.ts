import { getAccessToken } from "@/lib/auth";
import type {
  ContentDetail,
  FeedResponse,
  TokenResponse,
  User,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured.");
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const token = getAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let detail = "Something went wrong.";

    try {
      const data = await response.json();
      detail = data.detail ?? detail;
    } catch {
      detail = response.statusText;
    }

    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  register(payload: {
    email: string;
    full_name: string;
    username?: string;
    password: string;
  }) {
    return apiRequest<TokenResponse>("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  login(payload: { email: string; password: string }) {
    return apiRequest<TokenResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  me() {
    return apiRequest<User>("/auth/me", {
      auth: true,
    });
  },

  discoverFeed(params?: {
    skip?: number;
    limit?: number;
    content_type?: string;
    category_id?: string;
    hub_id?: string;
  }) {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return apiRequest<FeedResponse>(
      `/feed/discover${query ? `?${query}` : ""}`,
    );
  },

  forYouFeed() {
    return apiRequest<FeedResponse>("/feed/for-you", {
      auth: true,
    });
  },

  contentDetail(slug: string) {
    return apiRequest<ContentDetail>(`/content/${slug}`, {
      auth: true,
    });
  },
};