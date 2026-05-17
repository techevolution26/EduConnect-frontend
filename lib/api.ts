import { getAccessToken } from "@/lib/auth";
import type {
  AdminDashboardStats,
  AdminUser,
  AdminUserListResponse,
  Category,
  Content,
  ContentDetail,
  ContentListResponse,
  FeedResponse,
  Hub,
  TokenResponse,
  User,
  UserRole,
  WriterProfile,
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

  // forYouFeed() {
  //   return apiRequest<FeedResponse>("/feed/for-you", {
  //     auth: true,
  //   });
  // },

  contentDetail(slug: string) {
    return apiRequest<ContentDetail>(`/content/${slug}`, {
      auth: true,
    });
  },

  updateMe(payload: {
    full_name?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
  }) {
    return apiRequest<User>("/users/me", {
      method: "PATCH",
      body: payload,
      auth: true,
    });
  },

  categories() {
    return apiRequest<Category[]>("/categories");
  },

  hubs() {
    return apiRequest<Hub[]>("/hubs");
  },

  hubDetail(slug: string) {
    return apiRequest<Hub>(`/hubs/${slug}`);
  },

  forYouFeed() {
    return apiRequest<FeedResponse>("/feed/for-you", {
      auth: true,
    });
  },

  categoryFeed(categoryId: string) {
    return apiRequest<FeedResponse>(`/feed/by-category/${categoryId}`);
  },

  hubFeed(hubId: string) {
    return apiRequest<FeedResponse>(`/feed/by-hub/${hubId}`);
  },

  createContent(payload: {
    title: string;
    slug: string;
    excerpt?: string;
    body: string;
    content_type: string;
    visibility: string;
    is_premium: boolean;
    category_id?: string;
    hub_id?: string;
    cover_image_url?: string;
  }) {
    return apiRequest<Content>("/content", {
      method: "POST",
      body: payload,
      auth: true,
    });
  },

  submitContentForReview(contentId: string) {
    return apiRequest<Content>(`/content/${contentId}/submit-review`, {
      method: "POST",
      auth: true,
    });
  },

  pendingContent() {
    return apiRequest<ContentListResponse>("/admin/content/pending", {
      auth: true,
    });
  },

  approveContent(contentId: string) {
    return apiRequest<Content>(`/admin/content/${contentId}/approve`, {
      method: "POST",
      auth: true,
    });
  },

  rejectContent(contentId: string, reason: string) {
    return apiRequest<Content>(`/admin/content/${contentId}/reject`, {
      method: "POST",
      body: { reason },
      auth: true,
    });
  },

  writers() {
    return apiRequest<WriterProfile[]>("/writers");
  },

  writerDetail(writerId: string) {
    return apiRequest<WriterProfile>(`/writers/${writerId}`);
  },

  writerContent(writerId: string) {
    return apiRequest<ContentListResponse>(`/writers/${writerId}/content`);
  },

  adminDashboard() {
    return apiRequest<AdminDashboardStats>("/admin/dashboard", {
      auth: true,
    });
  },

  adminUsers(params?: {
    skip?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return apiRequest<AdminUserListResponse>(
      `/admin/users${query ? `?${query}` : ""}`,
      {
        auth: true,
      },
    );
  },

  updateAdminUserRole(
    userId: string,
    payload: {
      role: UserRole;
      is_verified?: boolean;
    },
  ) {
    return apiRequest<AdminUser>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: payload,
      auth: true,
    });
  },

  updateAdminUserStatus(
    userId: string,
    payload: {
      is_active: boolean;
    },
  ) {
    return apiRequest<AdminUser>(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: payload,
      auth: true,
    });
  },

  createCategory(payload: {
    name: string;
    slug: string;
    description?: string | null;
  }) {
    return apiRequest<Category>("/categories", {
      method: "POST",
      body: payload,
      auth: true,
    });
  },

  updateCategory(
    categoryId: string,
    payload: {
      name?: string;
      slug?: string;
      description?: string | null;
      is_active?: boolean;
    },
  ) {
    return apiRequest<Category>(`/categories/${categoryId}`, {
      method: "PATCH",
      body: payload,
      auth: true,
    });
  },

  createHub(payload: {
    name: string;
    slug: string;
    description?: string | null;
    cover_image_url?: string | null;
  }) {
    return apiRequest<Hub>("/hubs", {
      method: "POST",
      body: payload,
      auth: true,
    });
  },

  updateHub(
    hubId: string,
    payload: {
      name?: string;
      slug?: string;
      description?: string | null;
      cover_image_url?: string | null;
      is_active?: boolean;
    },
  ) {
    return apiRequest<Hub>(`/hubs/${hubId}`, {
      method: "PATCH",
      body: payload,
      auth: true,
    });
  },

  adminCategories() {
    return apiRequest<Category[]>("/categories?include_inactive=true", {
      auth: true,
    });
  },

  adminHubs() {
    return apiRequest<Hub[]>("/hubs?include_inactive=true", {
      auth: true,
    });
  },

  adminContent(params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
    content_type?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return apiRequest<ContentListResponse>(
      `/admin/content${query ? `?${query}` : ""}`,
      {
        auth: true,
      },
    );
  },

  comments(contentId: string) {
    return apiRequest<Comment[]>(`/content/${contentId}/comments`);
  },

  createComment(contentId: string, payload: { body: string; parent_id?: string }) {
    return apiRequest<Comment>(`/content/${contentId}/comments`, {
      method: "POST",
      body: payload,
      auth: true,
    });
  },

  likeContent(contentId: string) {
    return apiRequest<{ message: string }>(`/content/${contentId}/like`, {
      method: "POST",
      auth: true,
    });
  },

  bookmarkContent(contentId: string) {
    return apiRequest<{ message: string }>(`/content/${contentId}/bookmark`, {
      method: "POST",
      auth: true,
    });
  },

  myContent(params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
  }) {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return apiRequest<ContentListResponse>(
      `/content/mine${query ? `?${query}` : ""}`,
      {
        auth: true,
      },
    );
  },
};