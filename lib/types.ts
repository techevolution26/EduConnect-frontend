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
  updated_at: string;
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

export type NotificationType =
  | "CONTENT_APPROVED"
  | "CONTENT_REJECTED"
  | "NEW_FOLLOWER"
  | "COMMENT"
  | "PARTNERSHIP"
  | "SYSTEM";

export type Notification = {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationListResponse = {
  items: Notification[];
  total: number;
  unread_count: number;
};

export type ModerationAction =
  | "APPROVED"
  | "REJECTED"
  | "HIDDEN"
  | "RESTORED"
  | "FLAGGED";

export type ModerationLog = {
  id: string;
  moderator_id: string;
  content_id: string | null;
  action: ModerationAction;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type WriterAnalytics = {
  total_content: number;
  drafts: number;
  pending: number;
  published: number;
  rejected: number;
  followers: number;
  likes_received: number;
  comments_received: number;
  bookmarks_received: number;
};

export type CurriculumType =
  | "CBC"
  | "CBE"
  | "CAMBRIDGE"
  | "AMERICAN"
  | "HOMESCHOOL"
  | "OTHER";

export type EducationResourceType =
  | "LESSON_NOTE"
  | "REVISION"
  | "STUDY_GUIDE"
  | "SCHEME_OF_WORK"
  | "PRINTABLE"
  | "ASSESSMENT"
  | "ARTICLE";

export type EducationResource = {
  id: string;
  content_id: string;
  curriculum: CurriculumType;
  grade_level: string | null;
  subject: string | null;
  resource_type: EducationResourceType;
  download_url: string | null;
  created_at: string;
  updated_at: string;
  content?: Content | null;
};

export type ChildrenAgeGroup = "AGE_3_5" | "AGE_6_9" | "AGE_10_13";

export type ChildrenContent = {
  id: string;
  content_id: string;
  age_group: ChildrenAgeGroup;
  created_at: string;
  updated_at: string;
  content?: Content | null;
};

export type PartnershipPlan =
  | "FREE"
  | "MONTHLY_PARTNER"
  | "ANNUAL_PARTNER"
  | "STUDENT_PARTNER"
  | "TEACHER_PARTNER";

export type PartnershipStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "PENDING";

export type PartnershipPlanRead = {
  plan: PartnershipPlan;
  label: string;
  description: string;
  recommended_for: string;
};

export type PartnershipAccess = {
  has_active_partnership: boolean;
  active_plan: PartnershipPlan | null;
  expires_at: string | null;
};

export type Partnership = {
  id: string;
  user_id: string;
  plan: PartnershipPlan;
  status: PartnershipStatus;
  referral_creator_id: string | null;
  provider: string | null;
  provider_reference: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WriterRelationship = {
  following: boolean;
  is_self: boolean;
};

export type RoleRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RoleUpgradeRequest = {
  id: string;
  user_id: string;
  requested_role: UserRole;
  reason: string;
  status: RoleRequestStatus;
  admin_note: string | null;
  reviewed_by_id: string | null;
  created_at: string;
  updated_at: string;
  user?: User | null;
};

export type RoleUpgradeRequestListResponse = {
  items: RoleUpgradeRequest[];
  total: number;
};

export type GlobalSearchResponse = {
  query: string;
  content: Content[];
  writers: WriterProfile[];
  hubs: Hub[];
  categories: Category[];
  education_resources: EducationResource[];
  children_content: ChildrenContent[];
};