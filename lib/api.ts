import { getAccessToken, clearAuthSession } from "@/lib/auth";
import type {
  AdminDashboardStats,
  AdminUser,
  AdminUserListResponse,
  Category,
  Comment,
  Content,
  ContentDetail,
  ContentListResponse,
  FeedResponse,
  Hub,
  TokenResponse,
  User,
  UserRole,
  WriterProfile,
  NotificationListResponse,
  Notification,
  ModerationLog,
  WriterAnalytics,
  EducationResource,
  ChildrenContent,
  Partnership,
  PartnershipPlan,
  PartnershipAccess,
  PartnershipPlanRead,
  WriterRelationship,
  RoleRequestStatus,
  RoleUpgradeRequest,
  RoleUpgradeRequestListResponse,
  GlobalSearchResponse,
  MessageResponse,
  CreateContentPayload,
} from "@/lib/types";
// import { request } from "https";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";

const API_PREFIX = "/api/v1";

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  isFormData?: boolean;
};

type ReadSessionRead = {
  id: string;
  content_id: string;
  user_id: string;
  started_at: string;
  last_active_at: string;
  ended_at: string | null;
  active_seconds: number;
  max_scroll_percent: number;
  tab_visible: boolean;
  is_completed: boolean;
  is_qualified: boolean;
  created_at: string;
  updated_at: string;
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

function normalizeApiDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => normalizeApiDetail(item))
      .filter(Boolean)
      .join(", ");
  }

  if (detail && typeof detail === "object") {
    const value = detail as Record<string, unknown>;
    if (typeof value.msg === "string") return value.msg;
    if (typeof value.detail === "string") return value.detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return "Something went wrong.";
    }
  }

  return "Something went wrong.";
}

function apiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${cleanPath}`;
}

async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {};

  if (!options.isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(apiUrl(path), {
    method: options.method ?? "GET",
    headers,
    body: options.body
      ? options.isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body)
      : undefined,
  });

  if (!response.ok) {
    let detail = "Something went wrong.";

    // If server says unauthorized, clear local session so UI updates
    if (response.status === 401) {
      try {
        clearAuthSession();
      } catch { }
    }

    try {
      const data = await response.json();
      detail = normalizeApiDetail((data as { detail?: unknown }).detail ?? data);
    } catch {
      detail = response.statusText || detail;
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
  }) {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();
    return apiRequest<FeedResponse>(`/feed/discover${query ? `?${query}` : ""}`);
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
    cover_image_url?: string | null;
  }) {
    return apiRequest<Content>("/content", {
      method: "POST",
      body: {
        title: payload.title,
        slug: payload.slug,
        excerpt: payload.excerpt,
        body: payload.body,
        content_type: payload.content_type,
        visibility: payload.visibility,
        is_premium: payload.is_premium,
        category_id: payload.category_id,
        hub_id: payload.hub_id,
        cover_image_url: payload.cover_image_url ?? null,
      },
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

  myContentDetail(contentId: string) {
    return apiRequest<Content>(`/content/mine/${contentId}`, {
      auth: true,
    });
  },

  updateContent(
    contentId: string,
    payload: {
      title?: string;
      slug?: string;
      excerpt?: string | null;
      body?: string;
      content_type?: string;
      visibility?: string;
      is_premium?: boolean;
      category_id?: string | null;
      hub_id?: string | null;
      cover_image_url?: string | null;
    },
  ) {
    return apiRequest<Content>(`/content/${contentId}`, {
      method: "PATCH",
      body: payload,
      auth: true,
    });
  },

  notifications() {
    return apiRequest<NotificationListResponse>("/notifications", {
      auth: true,
    });
  },

  markNotificationRead(notificationId: string) {
    return apiRequest<Notification>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
      auth: true,
    });
  },

  markAllNotificationsRead() {
    return apiRequest<{ message: string }>("/notifications/read-all", {
      method: "PATCH",
      auth: true,
    });
  },

  contentModerationLogs(contentId: string) {
    return apiRequest<ModerationLog[]>(`/content/mine/${contentId}/moderation`, {
      auth: true,
    });
  },

  writerAnalytics() {
    return apiRequest<WriterAnalytics>("/content/analytics/me", {
      auth: true,
    });
  },

  createEducationResource(payload: {
    content_id: string;
    curriculum: string;
    grade_level?: string | null;
    subject?: string | null;
    resource_type: string;
    download_url?: string | null;
  }) {
    return apiRequest<EducationResource>("/education/resources", {
      method: "POST",
      body: payload,
      auth: true,
    });
  },

  educationResources(params?: {
    curriculum?: string;
    subject?: string;
    grade_level?: string;
  }) {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return apiRequest<EducationResource[]>(
      `/education/resources${query ? `?${query}` : ""}`,
    );
  },

  createChildrenContent(payload: {
    content_id: string;
    age_group: string;
  }) {
    return apiRequest<ChildrenContent>("/children/content", {
      method: "POST",
      body: payload,
      auth: true,
    });
  },

  childrenContent(params?: {
    age_group?: string;
  }) {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return apiRequest<ChildrenContent[]>(
      `/children/content${query ? `?${query}` : ""}`,
    );
  },

  partnershipPlans() {
    return apiRequest<PartnershipPlanRead[]>("/partnerships/plans");
  },

  myPartnership() {
    return apiRequest<PartnershipAccess>("/partnerships/me", {
      auth: true,
    });
  },

  startPartnership(payload: {
    plan: PartnershipPlan;
    phone_number: string;
    referral_creator_id?: string | null;
  }) {
    return apiRequest("/partnerships/start", {
      method: "POST",
      auth: true,
      body: payload,
    });
  },

  cancelPartnership() {
    return apiRequest<Partnership>("/partnerships/cancel", {
      method: "POST",
      auth: true,
    });
  },


  contentEngagement(contentId: string) {
    return apiRequest<{ liked: boolean; bookmarked: boolean }>(
      `/content/${contentId}/engagement`,
      { auth: true },
    );
  },

  myBookmarks() {
    return apiRequest<Content[]>("/users/me/bookmarks", {
      auth: true,
    });
  },

  unbookmarkContent(contentId: string) {
    return apiRequest<void>(`/content/${contentId}/bookmark`, {
      method: "DELETE",
      auth: true,
    });
  },

  unlikeContent(contentId: string) {
    return apiRequest<void>(`/content/${contentId}/like`, {
      method: "DELETE",
      auth: true,
    });
  },

  contentCounts(contentId: string) {
    return apiRequest<{
      likes: number;
      bookmarks: number;
      comments: number;
      views: number;
    }>(`/content/${contentId}/counts`);
  },

  followWriter(writerId: string) {
    return apiRequest<{ message: string }>(`/writers/${writerId}/follow`, {
      method: "POST",
      auth: true,
    });
  },

  unfollowWriter(writerId: string) {
    return apiRequest<void>(`/writers/${writerId}/follow`, {
      method: "DELETE",
      auth: true,
    });
  },

  writerRelationship(writerId: string) {
    return apiRequest<WriterRelationship>(`/writers/${writerId}/relationship`, {
      auth: true,
    });
  },

  changePassword(payload: {
    current_password: string;
    new_password: string;
  }) {
    return apiRequest<{ message: string }>("/users/me/password", {
      method: "PATCH",
      body: payload,
      auth: true,
    });
  },

  createRoleRequest(payload: {
    requested_role: UserRole;
    reason: string;
  }) {
    return apiRequest<RoleUpgradeRequest>("/role-requests", {
      method: "POST",
      body: payload,
      auth: true,
    });
  },

  myRoleRequests() {
    return apiRequest<RoleUpgradeRequest[]>("/role-requests/me", {
      auth: true,
    });
  },

  adminRoleRequests(params?: {
    status_filter?: RoleRequestStatus;
  }) {
    const searchParams = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();

    return apiRequest<RoleUpgradeRequestListResponse>(
      `/role-requests/admin${query ? `?${query}` : ""}`,
      {
        auth: true,
      },
    );
  },

  approveRoleRequest(requestId: string, adminNote?: string | null) {
    return apiRequest<RoleUpgradeRequest>(
      `/role-requests/admin/${requestId}/approve`,
      {
        method: "POST",
        body: {
          admin_note: adminNote ?? null,
        },
        auth: true,
      },
    );
  },

  rejectRoleRequest(requestId: string, adminNote?: string | null) {
    return apiRequest<RoleUpgradeRequest>(
      `/role-requests/admin/${requestId}/reject`,
      {
        method: "POST",
        body: {
          admin_note: adminNote ?? null,
        },
        auth: true,
      },
    );
  },

  searchContent(params: {
    q: string;
    content_type?: string;
    category_id?: string;
    skip?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    return apiRequest<{
      query: string;
      items: Content[];
      total: number;
    }>(`/search/content?${searchParams.toString()}`);
  },

  globalSearch(params: { q: string; limit?: number }) {
    const searchParams = new URLSearchParams();

    searchParams.set("q", params.q);

    if (params.limit) {
      searchParams.set("limit", String(params.limit));
    }

    return apiRequest<GlobalSearchResponse>(
      `/search/global?${searchParams.toString()}`,
    );
  },

  toggleFeaturedContent(contentId: string) {
    return apiRequest<Content>(`/admin/content/${contentId}/feature`, {
      method: "POST",
      auth: true,
    });
  },

  likeComment(commentId: string) {
    return apiRequest<MessageResponse>(`/comments/${commentId}/like`, {
      method: "POST",
      auth: true,
    });
  },

  unlikeComment(commentId: string) {
    return apiRequest<void>(`/comments/${commentId}/like`, {
      method: "DELETE",
      auth: true,
    });
  },

  uploadContentAssets(
    contentId: string,
    payload: { images?: File[]; files?: File[] },
  ) {
    const formData = new FormData();

    payload.images?.forEach((file) => {
      formData.append("images", file);
    });

    payload.files?.forEach((file) => {
      formData.append("files", file);
    });

    return apiRequest(`/content/${contentId}/assets`, {
      method: "POST",
      body: formData,
      auth: true,
      isFormData: true,
    });
  },

  startReadSession(contentId: string) {
    return apiRequest<ReadSessionRead>("/read-sessions/start", {
      method: "POST",
      auth: true,
      body: { content_id: contentId },
    });
  },

  heartbeatReadSession(
    sessionId: string,
    payload: {
      active_seconds_delta?: number;
      scroll_percent?: number;
      tab_visible?: boolean;
    } = {},
  ) {
    return apiRequest<ReadSessionRead>(`/read-sessions/${sessionId}/heartbeat`, {
      method: "PATCH",
      auth: true,
      body: payload,
    });
  },

  finishReadSession(
    sessionId: string,
    payload: {
      active_seconds_delta?: number;
      scroll_percent?: number;
      tab_visible?: boolean;
    } = {},
  ) {
    return apiRequest<ReadSessionRead>(`/read-sessions/${sessionId}/finish`, {
      method: "POST",
      auth: true,
      body: payload,
    });
  },

};