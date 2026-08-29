import type { User, UserRole } from "@/lib/types";

export function hasRole(user: User | null, roles: UserRole[]) {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * True for ADMIN and SUPER_ADMIN. Mirrors the backend's
 * app/core/permissions.py::is_admin_tier -- use this instead of checking
 * `role === "ADMIN"` directly anywhere a role hierarchy matters.
 *
 * FIX: this codebase previously had the same bug the backend had before
 * this pass -- canPublish/canModerate/isAdmin all checked `role === "ADMIN"`
 * directly, which excludes SUPER_ADMIN. A super admin account had less
 * effective UI access than a plain admin (RoleGuard would block them from
 * every admin/writer page). Fixed here and in every RoleGuard
 * `allowedRoles` list across the app.
 */
export function isAdminTier(user: User | null) {
  if (!user) return false;
  return user.role === "ADMIN" || user.role === "SUPER_ADMIN";
}

export function isSuperAdmin(user: User | null) {
  return hasRole(user, ["SUPER_ADMIN"]);
}

export function canPublish(user: User | null) {
  return hasRole(user, ["WRITER", "TEACHER"]) || isAdminTier(user);
}

export function canModerate(user: User | null) {
  return hasRole(user, ["MODERATOR"]) || isAdminTier(user);
}

export function isAdmin(user: User | null) {
  // NOTE: kept for backward compatibility with existing call sites, but
  // now correctly includes SUPER_ADMIN. Prefer isAdminTier() in new code
  // for clarity about what this actually checks.
  return isAdminTier(user);
}

export function canAccessChildrenFocus(user: User | null) {
  return hasRole(user, ["PARENT", "TEACHER", "MODERATOR"]) || isAdminTier(user);
}

/**
 * Who can host marketing events (competitions, workshops, book clubs).
 * Mirrors the backend's ensure_can_host_events in services/event_service.py.
 */
export function canHostEvents(user: User | null) {
  return hasRole(user, ["WRITER", "TEACHER"]) || isAdminTier(user);
}

export function isStudent(user: User | null) {
  return hasRole(user, ["STUDENT"]);
}

export function isTeacher(user: User | null) {
  return hasRole(user, ["TEACHER"]);
}

/**
 * Whether `user` is eligible for a given role-restricted partnership
 * discount plan. Mirrors the backend's ROLE_RESTRICTED_PLANS check in
 * services/partnership_service.py::ensure_plan_eligibility -- used to grey
 * out ineligible plans client-side rather than letting the user hit a 403
 * at checkout.
 */
export function isEligibleForPlan(
  user: User | null,
  plan: "FREE" | "MONTHLY_PARTNER" | "ANNUAL_PARTNER" | "STUDENT_PARTNER" | "TEACHER_PARTNER",
) {
  if (isAdminTier(user)) return true;
  if (plan === "STUDENT_PARTNER") return isStudent(user);
  if (plan === "TEACHER_PARTNER") return isTeacher(user);
  return true;
}

export function getRoleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    READER: "Reader",
    WRITER: "Writer",
    TEACHER: "Teacher",
    STUDENT: "Student",
    PARENT: "Parent",
    MODERATOR: "Moderator",
    ADMIN: "Admin",
    SUPER_ADMIN: "Super Admin",
  };

  return labels[role];
}
