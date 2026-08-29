# EduConnect Frontend — Aligned with Hardened Backend

Companion to `CHANGELOG_HARDENING.md` on the backend. Everything here was
verified with `tsc --noEmit` (0 errors), `eslint` (0 errors), and a full
`next build` (0 errors, all 39 routes compiled) in this session.

---

## 1. Same bug, same fix: SUPER_ADMIN was locked out of the UI too

The frontend had the exact same bug as the backend before this pass:
`lib/roles.ts::canPublish/canModerate/isAdmin` all checked `role === "ADMIN"`
directly, and `UserRole` didn't even include `"SUPER_ADMIN"` as a possible
value. Combined with 11 separate `<RoleGuard allowedRoles={[...]}>` calls
across admin and writer pages that listed `"ADMIN"` but not `"SUPER_ADMIN"`,
a super admin account would have been redirected away from the admin
dashboard, every admin sub-page, and every writer page — the same
powerlessness bug fixed on the backend, independently present here.

**Fixed:**
- `lib/types.ts` — added `"SUPER_ADMIN"` to the `UserRole` union
- `lib/roles.ts` — rewritten with `isAdminTier()` (mirrors the backend's
  `is_admin_tier`), used by `canPublish`, `canModerate`, `isAdmin`
- All 11 `RoleGuard allowedRoles` arrays updated to include `"SUPER_ADMIN"`
  alongside `"ADMIN"`: `admin/hubs`, `admin/review`, `admin/content`,
  `admin/categories`, `admin/role-requests`, `admin/dashboard`,
  `writer/publish`, `writer/content/[id]/edit`,
  `writer/content/[id]/education`, `writer/content/[id]/children`,
  `writer/dashboard`
- `app/(platform)/profile/page.tsx` — two `Record<UserRole, ...>` lookups
  (role descriptions and role-specific quick actions) were missing a
  `SUPER_ADMIN` case entirely — TypeScript caught this immediately once
  `SUPER_ADMIN` was added to the role union (see "How this was verified").

## 2. Admin dashboard: staff-role assignment now matches backend's hierarchy

The per-user role `<select>` in `AdminDashboardClient.tsx` previously listed
every role including `ADMIN` with no gating — any admin viewing the page
could attempt to promote a user to `ADMIN`, which the hardened backend now
rejects with a 403 for anyone but a super admin. Rather than let that
happen silently, the dropdown now:
- Shows only member roles (READER, WRITER, TEACHER, STUDENT, PARENT) to a
  plain admin
- Shows the full set including MODERATOR/ADMIN/SUPER_ADMIN only when the
  viewer is a super admin (checked via `isSuperAdmin(actingUser)` from
  `useAuthSession`)
- If a listed user already holds a staff role the viewer can't reassign,
  it's shown as a disabled option labeled "(super admin only)" instead of
  silently vanishing from the select

The role **filter** dropdown (for narrowing the user list, a read action)
is deliberately left unrestricted — filtering by any role is a `USERS_VIEW`
concern, not a `USERS_MANAGE` one, and shouldn't be limited the same way.

Also added: a `total_super_admins` stat card, and action-card links to the
two new admin pages below (permissions gated to super admin only; both new
pages are visible from the dashboard grid).

## 3. New pages: the frontend surface for every new backend system

| Page | Purpose |
|---|---|
| `/events` | Public listing of competitions/workshops/book clubs, filterable by type |
| `/events/[slug]` | Detail + RSVP/withdraw, competition submission form, host participant management (mark attended/completed) |
| `/writer/events` | A host's own events — publish/cancel |
| `/writer/events/create` | Event creation form (curriculum tags, student-only toggle, partnership-required toggle) |
| `/student/verify` | School search-or-add, affiliation, email verification code flow |
| `/leaderboard` | Global/monthly XP ranking, current user's rank + school rank, earned badges |
| `/admin/permissions` | **Super-admin only.** Grant/revoke the 14 granular permissions per admin — the direct UI counterpart to "factor admins down to specific functions" |
| `/admin/payouts` | Referral commission payout queue, mark-as-paid action |

`ConditionalAuthGuard`'s public-route list was extended to include
`/events` and `/leaderboard` (matching the backend's unauthenticated
`GET /events` and `GET /leaderboard`) — guest visitors can browse events
and the leaderboard without being redirected to login; RSVP/submit actions
still prompt login individually, consistent with how `ContentActions.tsx`
already handles like/bookmark for guests.

`Sidebar.tsx` navigation additions:
- **Public nav:** Events, Leaderboard (visible to everyone)
- **Workspace nav:** "My Events" for anyone who can host (writers, teachers,
  admin-tier), "Student Verification" for STUDENT-role accounts,
  "Permissions" and "Payouts" for super admins only

## 4. Monetization surfaces

- **Partnership page** (`app/(platform)/partnership/page.tsx`): the
  `STUDENT_PARTNER`/`TEACHER_PARTNER` cards now check
  `isEligibleForPlan(user, plan)` (new helper in `lib/roles.ts`, mirroring
  the backend's `ensure_plan_eligibility`) and show a locked "Students
  only" / "Teachers only" state instead of a checkout link that would 403.
  Guests and eligible users see the normal checkout flow unchanged.
- **Writer dashboard**: new referral earnings widget (pending / paid /
  total referral count), reading from the new
  `GET /partnerships/referrals/summary` endpoint — the frontend half of
  turning `referral_creator_id` into a real creator incentive.
- **Admin payouts page**: lists pending referral commissions and lets an
  admin (holding `payouts.manage`) mark them paid.

## 5. Bugs found and fixed that weren't part of the alignment ask

- **`startPartnership`'s response was completely untyped.** The original
  call had no `<T>` type parameter, so every caller received `unknown` and
  had to re-assert the shape themselves. Added
  `PartnershipCheckoutResponse` (partnership + payment + message) to
  `lib/types.ts` and typed the call properly in `lib/api.ts`.
- **Missing `PartnershipPayment` type** — needed for the above, added with
  the full payment status union.

## 6. New API client surface (`lib/api.ts`)

Every new backend endpoint from the hardening pass now has a typed
counterpart: `adminActivatePartnership`, `myReferralSummary`,
`myReferralEarnings`, `getUserPermissions`/`grantUserPermission`/
`revokeUserPermission`, `adminPendingPayouts`/`adminMarkPayoutPaid`,
`adminCreateBadge`, the full events surface (`events`, `eventDetail`,
`myHostedEvents`, `createEvent`, `publishEvent`, `cancelEvent`,
`rsvpToEvent`, `withdrawFromEvent`, `myEventParticipation`,
`submitEventEntry`, `eventParticipants`,
`markEventParticipantAttended`/`Completed`), the students surface
(`searchSchools`, `createSchool`, `myStudentProfile`,
`updateStudentAffiliation`, `requestStudentVerification`,
`confirmStudentVerification`, `adminVerifyStudent`), and the
leaderboard/badges surface (`leaderboard`, `myXP`, `allBadges`,
`myBadges`).

`lib/types.ts` gained the matching type definitions for all of the above,
plus `Permission` (a 14-value union matching the backend enum exactly,
with `ALL_PERMISSIONS` and `PERMISSION_LABELS` for the permissions UI) and
`total_super_admins` on `AdminDashboardStats`.

---

## How this was verified

1. `npx tsc --noEmit` — 0 errors, run twice (once after the initial pass,
   which caught 4 real issues detailed below; once after fixing them, and
   once more after restoring the layout.tsx font imports at the end).
2. `npx eslint . --quiet` — 0 errors (caught and fixed 5 unescaped-
   apostrophe issues in new page copy).
3. `npm run build` (Turbopack, production mode) — succeeded, all 39 routes
   compiled and prerendered/marked dynamic correctly, including every new
   page. The Google Fonts fetch (`Fraunces`, `Work Sans` via
   `next/font/google`) fails in this sandboxed environment due to no
   outbound network access to `fonts.googleapis.com` — this is a sandbox
   networking limitation, not a code defect, and is unrelated to any file
   touched in this pass. To confirm the rest of the build was genuinely
   clean and not just hidden behind that failure, the two font imports in
   `app/layout.tsx` were temporarily removed, the build was re-run to
   completion successfully, and the file was then restored to its exact
   original byte-for-byte content (confirmed with `diff`) before packaging.

### The 4 real TypeScript errors caught and fixed

- `app/(platform)/profile/page.tsx` — two `Record<UserRole, T>` object
  literals (role descriptions, role-specific quick action links) were
  missing a `SUPER_ADMIN` key, which only became a compile error once
  `SUPER_ADMIN` was added to the `UserRole` type. Both now have a proper
  `SUPER_ADMIN` entry (the latter links to the new `/admin/permissions`
  and `/admin/payouts` pages).
- `lib/api.ts::myHostedEvents` — a search-param-building loop compared an
  inferred `number | EventStatus` value against the empty string literal
  `""`, which TypeScript correctly flagged as having no overlap (unlike
  similar existing functions, which mix in a plain `string` field like
  `search`, making the `""` comparison meaningful there). Fixed by
  dropping the redundant `!== ""` check for this specific function.
- `lib/api.ts::updateStudentAffiliation` — used `method: "PUT"`, but the
  shared `ApiRequestOptions.method` type only allowed
  `"GET" | "POST" | "PATCH" | "DELETE"`. The backend's
  `PUT /students/me/affiliation` route only responds to PUT, so the fix
  was to extend the type (not silently switch to PATCH and risk a 405).

## What wasn't done / next steps worth considering

- The event detail page's host participant list currently displays raw
  `user_id` values rather than resolved names — the backend's
  `EventParticipantRead` schema doesn't include a joined user object.
  Worth adding a `full_name`/`email` field to that schema if you want
  friendlier host-facing participant lists.
- No dedicated UI yet for admins to create badge definitions (the API
  method `adminCreateBadge` exists and is wired, but there's no form page
  calling it) — badges can currently only be seeded directly against the
  backend.
- The `/admin/payouts` and `/admin/permissions` pages both correctly
  surface a 403 if the viewing admin lacks the specific permission, but
  neither offers a "request access" affordance — an admin who hits that
  wall has to know to ask a super admin out-of-band.
