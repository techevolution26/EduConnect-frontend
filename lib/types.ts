export type UserRole =
  | "READER"
  | "WRITER"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "MODERATOR"
  | "ADMIN";

export type ContentType =
  | "ARTICLE"
  | "STORY"
  | "POEM"
  | "FAITH"
  | "EDUCATION"
  | "CHILDREN"
  | "NEWS"
  | "AUDIO";

export type ContentStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

export type ContentVisibility = "PUBLIC" | "PARTNERS_ONLY" | "PRIVATE";

export type User = {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Hub = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Content = {
  id: string;
  author_id: string;
  category_id: string | null;
  hub_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  content_type: ContentType;
  status: ContentStatus;
  visibility: ContentVisibility;
  is_premium: boolean;
  reading_time_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentDetail = Content & {
  author: User;
  category: Category | null;
  hub: Hub | null;
  requires_partnership: boolean;
  has_access: boolean;
  preview_body: string | null;
};

export type FeedResponse = {
  items: Content[];
  total: number;
  skip: number;
  limit: number;
};

export type TokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type ApiErrorResponse = {
  detail?: string;
};

export type ContentCreatePayload = {
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  content_type: ContentType;
  visibility: ContentVisibility;
  is_premium: boolean;
  category_id?: string;
  hub_id?: string;
  cover_image_url?: string;
};

export type ContentListResponse = {
  items: Content[];
  total: number;
};

export type WriterProfile = User & {
  followers_count: number;
  published_count: number;
};

export type AdminDashboardStats = {
  total_users: number;
  total_readers: number;
  total_writers: number;
  total_teachers: number;
  total_students: number;
  total_parents: number;
  total_moderators: number;
  total_admins: number;

  total_content: number;
  pending_content: number;
  published_content: number;
  rejected_content: number;

  total_categories: number;
  total_hubs: number;
  total_partnerships: number;
  active_partnerships: number;
};

export type AdminUser = User & {
  updated_at: string;
};

export type AdminUserListResponse = {
  items: AdminUser[];
  total: number;
  skip: number;
  limit: number;
};

export type Comment = {
  id: string;
  content_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};