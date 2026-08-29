export type UserRole =
  | "READER"
  | "WRITER"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "MODERATOR"
  | "ADMIN"
  | "SUPER_ADMIN";

export type ContentType =
  | "ARTICLE"
  | "STORY"
  | "FICTION"
  | "POEM"
  | "FAITH"
  | "EDUCATION"
  | "CHILDREN"
  | "NEWS"
  | "AUDIO"
  | "WRITING_TIPS"
  | "SELF_IMPROVEMENT"
  | "RELATIONSHIP"
  | "MONEY_FINANCE"
  | "MEDICINE"
  | "PSYCHOLOGY"
  | "MENTAL_HEALTH"
  | "HUMOR"
  | "WOMEN"
  | "FITNESS"
  | "SELF_AWARENESS"
  | "PARENTING"
  | "TECHNOLOGY"
  | "SCIENCE"
  | "CARS";

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
  is_featured: boolean;
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
  published_at: string | null;
  assets?: {
    id: string;
    asset_type: "IMAGE" | "FILE";
    url: string;
    filename?: string | null;
    mime_type?: string | null;
  }[];
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
  total_super_admins: number;

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
  price_kes: number | null;
  duration_days: number | null;
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

export type PartnershipPaymentStatus =
  | "INITIATED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

export type PartnershipPayment = {
  id: string;
  partnership_id: string;
  user_id: string;
  provider: string;
  status: PartnershipPaymentStatus;
  plan: string;
  amount: number;
  currency: string;
  phone_number: string;
  checkout_request_id: string | null;
  mpesa_receipt_number: string | null;
  created_at: string;
};

// Response shape from POST /partnerships/start. `payment` is null only for
// the FREE plan, which activates immediately with no payment step.
export type PartnershipCheckoutResponse = {
  partnership: Partnership;
  payment: PartnershipPayment | null;
  message: string;
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

export type MessageResponse = {
  message: string;
};

export type CreateContentPayload = {
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
  images?: File[];
  files?: File[];
};

// ─────────────────────────────────────────────────────────────────────────
// Granular admin permissions
// See backend app/core/permissions.py::Permission -- SUPER_ADMIN implicitly
// holds every permission; a plain ADMIN holds only what's explicitly
// granted here.
// ─────────────────────────────────────────────────────────────────────────

export type Permission =
  | "users.view"
  | "users.manage"
  | "content.moderate"
  | "content.manage"
  | "catalog.manage"
  | "role_requests.review"
  | "partnerships.manage"
  | "payouts.manage"
  | "events.manage"
  | "events.moderate"
  | "students.verify"
  | "badges.manage"
  | "reports.manage"
  | "system.settings";

export const ALL_PERMISSIONS: Permission[] = [
  "users.view",
  "users.manage",
  "content.moderate",
  "content.manage",
  "catalog.manage",
  "role_requests.review",
  "partnerships.manage",
  "payouts.manage",
  "events.manage",
  "events.moderate",
  "students.verify",
  "badges.manage",
  "reports.manage",
  "system.settings",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "users.view": "View users",
  "users.manage": "Manage user roles & status",
  "content.moderate": "Moderate content (approve/reject)",
  "content.manage": "Manage content (feature/delete any)",
  "catalog.manage": "Manage categories & hubs",
  "role_requests.review": "Review role upgrade requests",
  "partnerships.manage": "Manually activate partnerships",
  "payouts.manage": "Manage referral commission payouts",
  "events.manage": "Manage any event (not just own)",
  "events.moderate": "Review event submissions & attendance",
  "students.verify": "Manually verify students",
  "badges.manage": "Create & edit badges",
  "reports.manage": "Manage user-submitted reports",
  "system.settings": "System settings",
};

export type AdminPermissionListResponse = {
  user_id: string;
  permissions: Permission[];
};

// ─────────────────────────────────────────────────────────────────────────
// Marketing events: competitions, workshops, book clubs
// ─────────────────────────────────────────────────────────────────────────

export type EventType = "COMPETITION" | "WORKSHOP" | "BOOK_CLUB";

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export type ParticipationStatus =
  | "RSVP"
  | "ATTENDED"
  | "SUBMITTED"
  | "COMPLETED"
  | "WITHDREW";

export type EduEvent = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: EventType;
  status: EventStatus;
  host_id: string;
  curriculum_tags: string[];
  student_only: boolean;
  school_id: string | null;
  requires_partnership: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_participants: number | null;
  cover_image_url: string | null;
  created_at: string;
};

export type EduEventDetail = EduEvent & {
  metadata: Record<string, unknown>;
};

export type EduEventListResponse = {
  items: EduEvent[];
  total: number;
  skip: number;
  limit: number;
};

export type EventParticipant = {
  id: string;
  event_id: string;
  user_id: string;
  status: ParticipationStatus;
  xp_awarded: number;
  submission: Record<string, unknown> | null;
  created_at: string;
};

export type EventCreatePayload = {
  title: string;
  description?: string;
  type: EventType;
  curriculum_tags?: string[];
  student_only?: boolean;
  school_id?: string;
  requires_partnership?: boolean;
  starts_at?: string;
  ends_at?: string;
  max_participants?: number;
  metadata?: Record<string, unknown>;
  cover_image_url?: string;
};

export type EventSubmissionPayload = {
  content_id?: string;
  note?: string;
  url?: string;
};

// ─────────────────────────────────────────────────────────────────────────
// Student identity: schools, verification
// ─────────────────────────────────────────────────────────────────────────

export type SchoolType = "PRIMARY" | "SECONDARY" | "COLLEGE" | "UNIVERSITY";

export type School = {
  id: string;
  name: string;
  county: string | null;
  type: SchoolType | null;
};

export type StudentProfile = {
  user_id: string;
  school_id: string | null;
  grade_level: string | null;
  curriculum: string | null;
  verified: boolean;
  verified_at: string | null;
};

// ─────────────────────────────────────────────────────────────────────────
// Gamification: XP, leaderboard, badges
// ─────────────────────────────────────────────────────────────────────────

export type LeaderboardEntry = {
  user_id: string;
  full_name: string | null;
  total_xp: number;
  rank: number;
};

export type LeaderboardResponse = {
  period: "all_time" | "month";
  school_id: string | null;
  entries: LeaderboardEntry[];
};

export type MyXP = {
  total_xp: number;
  rank: number | null;
  school_rank: number | null;
};

export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
};

export type UserBadge = {
  badge: Badge;
  awarded_at: string;
};

// ─────────────────────────────────────────────────────────────────────────
// Monetization: referral commissions
// ─────────────────────────────────────────────────────────────────────────

export type ReferralEarningStatus = "PENDING" | "PAID" | "VOID";

export type ReferralEarning = {
  id: string;
  partnership_id: string;
  source_amount_kes: number;
  commission_rate_bps: number;
  commission_amount_kes: number;
  status: ReferralEarningStatus;
  created_at: string;
};

export type ReferralSummary = {
  pending_kes: number;
  paid_kes: number;
  total_referrals: number;
};

export type ReferralEarningListResponse = {
  items: ReferralEarning[];
  total: number;
  skip: number;
  limit: number;
};