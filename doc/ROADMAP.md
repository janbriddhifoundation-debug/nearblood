# NearBlood — roadmap

_Last updated: 2026-11-26_

## Where we are

| Area | State |
|---|---|
| Sign-in | Google only. First login picks a role in a pop-up (Requester or NGO). Admin is set by hand in the DB. |
| NGO | Registration → admin approval → dashboard. Built: overview dashboard, requests near their regions, donors (with sign-up approvals), assign donors, donation verification, certificates (QR, public verify), camps with donor registrations, communication, reports, impact, profile, support tickets. |
| Super admin | Built: dashboard stats, blood request monitoring, NGO management/approval, donor & donation oversight. Placeholders: 8 menu items (users, proof control, certificates & branding, events, reports, settings, logs, staff). |
| Requester (`user`) | Built but hidden from the public: raise request, track status, upload proof. "Support initiative" page is a stub (mock upload, old "Floating Blood Bank" name). |
| Donor | Self sign-up with nearby-NGO picker, NGO approval, donor dashboard (donations, certificates, profile). Same account can also request blood. |
| Public site | Home page is a placeholder hero. Certificate verification page works. |

Known risk left (see Phase 0): the migrations folder no longer matches the database.

---

## Phase 0 — Hardening ✅ mostly done 2026-11-26

Done:
- Role escalation in `/api/auth/upsert-user` closed (session required, email from session, only `user | donor | ngo`, existing role never changed).
- Admin checks on every `/api/v1/admin/*` route; shared `requireRole([...])` helper in `services/userService.ts` for new routes.
- **Pending NGOs locked out of NGO APIs:** `getActiveUser()` only sets `organisationId` once the NGO is approved.
- **Uploaded files:** `/api/s3/<folder>/<file>` now checks access — `ngo-events` public; `donors` signed-in; `donation-proof`, `ngo-reg-certificate`, `ngo-contact-id-proof`, `support-payments` only for admins, the uploader and the people involved (`services/fileAccessService.ts`).
- `/api/auth/get-user` only answers server-to-server calls (`x-internal-secret` = `AUTH_SECRET`).
- NGO list API and DB health check are admin-only.
- Public certificate verification no longer shows the patient's name.
- Support Initiative uploads went to a third-party mock server; they now go to our own storage.
- Removed debug `console.log`s (one printed the whole session), the unused `AuthUserHandler`, fake "4 notifications" bells with demo links (now `components/NotificationBell.tsx`, empty until Phase 3), old "Floating Blood Bank" names; real README.

Left:
- **Migrations baseline.** `prisma migrate status` shows the last old migration (`20250511175015_add_geolocation_field`) as *failed* although its columns exist, and everything after it was applied by hand. Plan: start Docker Desktop → throwaway PostGIS container as shadow DB → generate a baseline migration (with `CREATE EXTENSION postgis` and `generate_request_id()`), prove it reproduces the live schema, then mark it applied. Until then **never run `prisma migrate dev`**.
- `sentry-example-page` / `sentry-example-api` are public Sentry wizard samples; delete once Sentry is confirmed working.

## Phase 1 — Donor role ✅ built 2026-11-26

Decisions taken: self sign-ups need **NGO approval**; "nearby" = NGOs covering a region within **25 km**, **or** a region naming the donor's city, **or** a wider region (district/state) the donor is inside; plus name search across all approved NGOs. If none match, the donor sees "No NGO is working in your area yet" with WhatsApp / copy invite buttons for an NGO they know. Schema SQL: `doc/sql/2026-11-26_donor_self_signup.sql` (applied to the dev DB).

Also done (2026-11-26):
- **Admin → Donor & donation oversight** (`/admin/donor-donation-oversight`): totals (donors, pending approval, available, certified donations, closed requests without a certificate), approved donors by blood group, a filterable Donors tab (status, how they joined, blood group, NGO, search) and a Donations tab (every assignment with request stage and certificate).
- **Last donation date:** set automatically when an NGO issues a certificate (the request's required date); NGOs can also enter it when adding a donor who donated before. Existing certified donors were backfilled (`doc/sql/2026-11-26_backfill_last_donated_at.sql`).
- NGO add-donor API no longer copies the raw request body into the database.

Moved to Phase 3: notify the NGO when a donor signs up under them.

The design as built:

### Model: one account, several capabilities

A person signs in once with Google. `User.role` stays one value and decides the **default** dashboard: `admin | ngo | user | donor`. Being a donor is a **capability**, not just a role: the account is a donor when a `Donor` row is linked to it.

- **Requester and donor are both personal accounts.** A personal account (`user` or `donor`) can always request blood, and can open the donor dashboard if it has a linked donor profile.
- A requester can press **Become a donor** → donor sign-up → now both. A donor can press **Request blood** → requester area. A switcher in the header moves between the two dashboards.
- NGO and admin accounts stay separate. An NGO coordinator who also donates uses a personal account.

### Schema changes (`Donor`, same table)

| Field | Purpose |
|---|---|
| `userId String? @unique` | Link to the login. Null for donors an NGO added who never signed in. |
| `status DonorStatus` (`PENDING`, `APPROVED`, `REJECTED`) | Self sign-ups start `PENDING` until the NGO approves. NGO-added donors are `APPROVED`. |
| `source` (`NGO`, `SELF`) | Who created the record. |
| `locationName`, `latitude`, `longitude`, `location geography` | Find nearby NGOs now, match donors to requests later. |
| `isAvailable Boolean @default(true)` | Donor can pause themselves. |
| `lastDonatedAt DateTime?` | Eligibility (90 days men / 120 days women gap). |
| `createdAt`, `updatedAt` | Missing today. |

Existing rows: `status = APPROVED`, `source = NGO`.

### Sign-up flow

1. Home page **Become a donor** → Google sign-in → role pop-up (now Requester / Donor / NGO) → `/donor/registration`.
2. Step 1, details: name and email from Google, phone, DOB (18–65 check), gender, blood group, address with map pin, photo.
3. Step 2, choose NGO: approved NGOs whose covered regions are within the search radius of the donor's pin, nearest first (PostGIS `ST_DWithin` / `ST_Distance` over `OrganisationRegion`). Fallback: search all approved NGOs by name.
4. **Claiming an existing record:** if an NGO already added a donor with the same email, link that record to this login instead of creating a duplicate. If only the phone matches, stop and tell them which NGO has that number.
5. The donor lands on a "waiting for NGO approval" screen. The NGO sees them in **Donors → Pending** and approves or rejects.

### Donor dashboard (`/donor/...`)

- **Overview:** total donations, last donation, next eligible date, availability toggle, their NGO.
- **Donations:** history from `RequestDonors` + `Request` (date, hospital, blood group, verification state).
- **Certificates:** list with view/download, reusing the existing certificate page and public verify link.
- **Profile:** edit phone, address/pin, photo. Read-only: blood group and DOB (changes go through the NGO).

### Other changes this touches

- Session/`get-user`: add `donorId`, `donorStatus`. Middleware: guard `/donor/*`, let personal accounts use both `/user/*` and `/donor/*`.
- NGO donors page: Pending tab, approve/reject, "self-registered" badge. Only approved donors can be assigned to requests.
- Admin: donor oversight page (all donors, by NGO, status) — fills one placeholder.

## Phase 2 — Public website

- New home page (sections to be specified): hero with **Request blood**, **Become a donor**, **Register NGO**; how it works; live stats; upcoming camps; partner NGOs; certificate verification; footer with policy pages.
- Public pages: About, How it works, Donor eligibility guide, Find NGOs near me, Events/camps list, Privacy policy, Terms, Contact.
- SEO metadata, Open Graph images, sitemap. Mobile-first checks.

## Phase 3 — Finish the NGO dashboard ✅ built 2026-11-26

Schema SQL: `doc/sql/2026-11-26_phase3_notifications_support_camps.sql` (applied to the dev DB): `Notification`, `NgoBroadcast`, `SupportTicket`, `SupportTicketMessage`, `EventRegistration`.

- **Notifications** (`services/notificationService.ts`, `/api/v1/notifications`, bell in every dashboard, polled every minute). Sent when: an NGO registers (to admins), an NGO is approved, a donor signs up under an NGO, a donor is approved/rejected, donors are assigned to a request, a certificate is issued, a camp is created (to the NGO's active donors), a donor registers for a camp, camp attendance is recorded, support tickets get new tickets/replies/status changes, and an NGO sends a message.
- **NGO dashboard** rebuilt: open requests near them, active/available donors, upcoming camps, donations this month, pending donor sign-ups, camp progress, active donors by blood group.
- **Communication** (`/ngo/communication-notification`): message approved donors filtered by blood group and availability; shows live how many will receive it (only donors with a login); history of sent messages.
- **Support tickets**: one system for everyone. NGOs: Support & helpdesk; donors/requesters: new Help & support page; admins: Support & grievance (all tickets, status, replies). `components/Support/SupportCenter.tsx`.
- **Blood camps for donors**: donors see their NGO's camps and any approved NGO's camp within 25 km (`/donor/camps`), register/cancel, see past camps. NGOs see registrations on the camp page, mark "donated" (with units) or "didn't come", and change camp status. Camp counts stay in sync; attending updates the donor's last donation date.
- Fixed: pending NGOs could create/list camps (event routes looked up the organisation without checking approval).

Still open from this phase: bulk donor import (CSV); email/SMS delivery for notifications (Phase 6).

## Phase 4 — Finish the super admin

| Page | Scope |
|---|---|
| User management | All accounts, roles, activate/suspend, change role safely. |
| Donor oversight | All donors across NGOs, duplicates, status. |
| Proof & verification control | Review proofs flagged by NGOs, re-open or close requests. |
| Certificates & branding | Certificate template, logo, signatures; revoke certificates. |
| Events management | All camps across NGOs, feature camps on the home page. |
| Reports & analytics | Platform-wide trends by region, blood group, NGO; export. |
| Settings & configuration | Search radius, eligibility gaps, feature flags (e.g. "requests enabled"). |
| Logs | Audit trail from a new `AuditLog` table written by every sensitive API. |
| Staff management | Admin sub-roles (moderator, support) with limited permissions. |
| Support & grievance | Tickets from NGOs, donors and requesters. |

## Phase 5 — Turn on blood requests for the public

- Matching: compatible blood groups (not only exact match), distance, donor availability and eligibility.
- Alerts to nearby NGOs and their approved, available, eligible donors (email first, then SMS/WhatsApp).
- Urgency escalation: widen the radius or alert more NGOs if nobody responds in time.
- Requester feedback and closing; spam protection (rate limits, phone OTP).
- Replace the "Support initiative" stub with a proper donation page.

## Phase 6 — Platform

- Notification service (`Notification` table + email provider; SMS later).
- Tests: API route tests for auth/role checks first, then key flows. CI running lint + type-check.
- One formatting pass with Prettier once feature work is quiet.
- Performance: paginate the remaining unpaginated lists (NGO donors, requests).
- PWA / installable app, regional languages.
