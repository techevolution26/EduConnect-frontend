import type { User, UserRole } from "@/lib/types";

export function hasRole(user: User | null, roles: UserRole[]) {
    if (!user) return false;
    return roles.includes(user.role);
}

export function canPublish(user: User | null) {
    return hasRole(user, ["WRITER", "TEACHER", "ADMIN"]);
}

export function canModerate(user: User | null) {
    return hasRole(user, ["MODERATOR", "ADMIN"]);
}

export function isAdmin(user: User | null) {
    return hasRole(user, ["ADMIN"]);
}

export function canAccessChildrenFocus(user: User | null) {
    return hasRole(user, ["PARENT", "TEACHER", "ADMIN", "MODERATOR"]);
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
    };

    return labels[role];
}