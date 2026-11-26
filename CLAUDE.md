# NearBlood — project guide

NearBlood connects blood requesters, donors and NGOs (India-focused: Indian phone regex, INR/UPI). Three roles — `user`, `ngo`, `admin` — each with its own dashboard area. Development stage: NGO onboarding is live; public blood requests are not yet active.

## Stack

- **Next.js 15 App Router** + React 19 + TypeScript (strict). Dev server: `npm run dev` → http://localhost:3002
- **UI:** Ant Design v5 (primary components) + Tailwind CSS v4 (layout/spacing/typography). `@ant-design/icons` for icons.
- **Auth:** NextAuth v5 (beta) with Google only — `src/auth.ts`. Role, `organisationId`, `isApprovedNgo` are put on the session via `/api/auth/get-user` (Prisma can't run in the edge auth callbacks).
- **DB:** PostgreSQL + PostGIS via Prisma (`prisma/schema.prisma`, client in `prisma/prisma.ts`). `location` columns are `geography`, set with raw SQL (`ST_SetSRID(ST_MakePoint(lng, lat), 4326)`). Request IDs come from the DB function `generate_request_id()` (`doc/dbFunctions.txt`).
- **Files:** Cloudflare R2 via AWS S3 SDK (`src/utils/s3Client.ts`, `/api/v1/upload-file`, `/api/s3/[...path]`).
- **Client state:** zustand (`src/stores/useUserStore.ts`). **HTTP:** axios. **Dates:** dayjs.
- **Validation:** zod for API bodies (`src/validationSchema/requestSchema.ts`), yup + formik for forms (`NgoSchema.ts`, `NgoEventSchema.ts`).
- **Maps:** leaflet / react-leaflet; place search via LocationIQ (`LocationAutoComplete`).
- Also present: recharts, react-countup, qrcode, html2canvas, Sentry (prod only), Vercel Analytics, next-nprogress-bar.

## Layout of `src/`

```
app/
  page.tsx                  public home page (currently a placeholder — being rebuilt)
  layout.tsx                root: AntdRegistry > ConfigProvider(colorPrimary #ff0000) > SessionProvider > Providers > antd App
  user/ ngo/ admin/         role areas, each with a client layout.tsx (Sider + Header + Content)
  view-certificate/[n]/     public certificate verification
  api/auth/...              NextAuth + get-user/upsert-user
  api/v1/{user,ngo,admin,public}/...   REST route handlers
components/   reusable client components (PascalCase, one per file, default export)
views/        large page bodies pulled out of page.tsx (UserRequestView, ...)
services/     server-side helpers returning {error, response, ...} (userService.getActiveUser)
utils/        pure helpers (getErrorMessage, showValidationErrors, bigintUtils, s3Client)
types/        shared interfaces, `I` prefix (IBloodRequest, IDonor) + next-auth augmentation
data/         constants (BLOOD_GROUPS, NGO_TYPES)
validationSchema/  zod / yup schemas
stores/       zustand stores
middleware.ts role-based route guard for /user, /ngo, /admin
```

## Coding conventions (follow these for all new code)

The codebase has two formatting styles. **New code uses the original style** (the one in `services/`, `utils/`, `stores/`, layouts, `views/`), which `.prettierrc` encodes:

- Tabs for indentation, double quotes, semicolons, trailing commas.
- **No spaces inside braces:** `import {Button} from "antd";`, `const {data} = await axios.get(...)`.
- Long lines are fine (printWidth 200) — keep JSX props on one line unless it hurts readability.
- No blank line between every statement; group related lines.
- Don't reformat existing files you aren't otherwise changing.

Patterns to copy (these are the good-quality examples):

- **API route handler** — see `api/v1/ngo/events/route.ts`, `api/v1/user/requests/route.ts`:
  1. `const {error, response, user} = await getActiveUser(); if (error) return response;`
  2. role check → `403` with `{error: "..."}`
  3. validate body with zod `safeParse`; on failure return `{success: false, errors: flattened.fieldErrors, formErrors}` with 400 (the client's `showValidationErrors` understands this shape)
  4. Prisma query; for lists use `Promise.all([findMany, count])` and return `{success: true, data, pagination: {page, pageSize, total, totalPages}}`
  5. `catch (error) { return NextResponse.json({error: getErrorMessage(error)}, {status: 500}); }`
  - Type `where` objects with `Prisma.XxxWhereInput`; validate enum query params against the Prisma enum.
  - Raw SQL returning counts → run through `convertBigIntToNumber`.
  - Import Prisma as `import {prisma} from "../../../prisma/prisma"` (relative — the `@/` alias only covers `src/`).
- **Client data fetching** — `useState` for `loading`/data, `useCallback` fetch fn + `useEffect`, `try { setLoading(true) ... } catch (e) { message.error(getErrorMessage(e)) } finally { setLoading(false) }`. Use `showValidationErrors(e)` after form submits.
- **Tables** — a separate `components/XxxTable.tsx` with an exported `XxxRecord` interface, typed props (`data, loading, page, pageSize, total, onTableChange, ...`), `ColumnsType<XxxRecord>`, server-side pagination (see `NgoEventsTable.tsx`).
- **Conditional rendering** — `<Show IF={cond}>...</Show>` from `components/Show.tsx` is the house idiom.
- **Navigation** — inside dashboards use `useRouter` from `next-nprogress-bar` (shows the progress bar).
- **Constants** go in `data/`, shared types in `types/` — don't redefine `BLOOD_GROUPS` etc. inline.
- Server-side helpers return discriminated unions `{error: true, response} | {error: false, ...}` (see `userService.ts`).

Avoid (exists in old code, don't repeat): leftover `console.log`s, placeholder dropdown items (`antgroup.com` links in layouts), `!!!` triple negation, big inline `style={{}}` objects when Tailwind classes would do, hard-coded colours that differ from the brand palette, duplicating the "find organisation for this user" query when `getActiveUser().user.organisationId` already has it.

## Design system

- **Brand red:** antd `colorPrimary: "#ff0000"` (root layout). Accent reds in use: `#ff4d4f` (progress bar), `#d72638`, logo red ≈ `#C8161D`. Tailwind `red-50/100/500/600` for tints, icon circles and hovers.
- **Neutrals:** text `gray-900` headings, `gray-600` body, `gray-500` muted; borders `#D9D9D9` / `gray-200`; white surfaces, `gray-50` page backgrounds.
- **Logo:** `/public/sitelogo.png` (black "NEAR" + red "BLOOD" with a drop in the B). Hero image `/public/bg.png` (gloved hand with blood vial, teal background) used with a dark gradient overlay.
- **Marketing/public pages** (see `app/page.tsx`, incl. its commented-out sections — they show the intended look):
  - Section: `py-16 sm:py-24`, inner `container mx-auto px-4 sm:px-6 lg:px-8`, intro block `max-w-3xl mx-auto text-center mb-12 sm:mb-16`.
  - H1 `text-4xl md:text-6xl font-extrabold uppercase tracking-tighter`; H2 `text-3xl md:text-4xl font-bold tracking-tight text-gray-900`; lead `text-lg font-medium text-gray-600`.
  - Cards: white, `rounded-xl shadow-lg border border-gray-100 p-6/8`, hover lift; icon in a `h-12 w-12 rounded-full bg-red-100` circle with `!text-red-500` icon.
  - Alternating section backgrounds: white, `bg-red-50`, dark slate gradients (`from-slate-800 via-slate-700 to-gray-800`) for stats/CTA.
  - Buttons are antd `Button`: primary `!h-[44px] !font-semibold !px-6`; ghost-on-dark `!bg-white/10 !border-white/30 !text-white`.
  - Sticky header with logo left, `AuthButtons` right; footer centered logo + tagline + copyright.
- **Dashboard pages:** antd `Layout` with 280px light `Sider`, white `Header` (bell + avatar), white `Content`. Page body: `padding: 32, maxWidth: 1320, margin: "0 auto"`, title `text-2xl font-semibold mb-5`, subtitle `text-sm text-gray-600 mb-10`, filter row `flex flex-wrap gap-3 mb-6`, stat cards in a responsive grid.
- Note: `globals.css` is only `@import "tailwindcss";` — classes like `bg-background-light`, `font-display`, `bg-primary/5` used in `page.tsx` are **not defined**. If you need theme tokens, add them via a Tailwind v4 `@theme` block in `globals.css`.
- Must work on mobile (user layout already switches the Sider to a Drawer below `lg`).

## Domain notes

- Request lifecycle is a log in `RequestActivity` (latest row = status): `REQUEST_SENT` → `DONORS_ASSIGNED` → `DONATION_PROOF_SUBMITTED` → `REQUEST_CLOSED`. Add rows with `createRequestActivity`.
- NGO onboarding: role `ngo` without organisation → `/ngo/registration`; organisation with `approvedAt = null` → `/ngo/awaiting-approval`; admin approves via `/api/v1/admin/ngo/[id]/approve`.
- NGOs cover regions (`OrganisationRegion` with geography points) — used for geo matching of requests.
- Donors belong to an organisation; `RequestDonors` links donors to requests; `DonationCertificate` is issued per `RequestDonors` and publicly verifiable at `/view-certificate/[certificateNumber]`.
- `NgoEvent` = blood donation camps (status `ACTIVE | ONGOING | CLOSED`).

## Working rules

- Env vars: see `env.example`. Real values are kept outside the repo — never commit or print them.
- Run `npm run lint` and `npx tsc --noEmit` after changes. There is no test suite.
- After schema changes: `npx prisma migrate dev --name <name>` then `npx prisma generate`. Ask before running migrations against a shared DB.
- Git default branch is `main`. After `npm ci`, run `npx prisma generate` before type-checking (the generated client isn't committed).
