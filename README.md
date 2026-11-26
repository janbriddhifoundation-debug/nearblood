# NearBlood

NearBlood connects people who need blood with verified NGOs nearby and the donors they manage.

- **Requesters** raise a blood request (patient, hospital, blood group, units, location) and track it to completion.
- **Donors** sign up, pick an NGO working in their area, and get a dashboard with their donations and certificates.
- **NGOs** register, get approved, see requests near the regions they cover, assign donors, verify donations, issue QR-verifiable certificates and run donation camps.
- **Super admin** approves NGOs and oversees requests.

## Tech

Next.js 15 (App Router) · React 19 · Ant Design 5 + Tailwind CSS 4 · NextAuth v5 (Google) · Prisma 6 on PostgreSQL + PostGIS · Cloudflare R2 for files · Sentry.

## Getting started

```bash
npm ci
cp env.example .env       # then fill in the values
npx prisma generate
npm run dev               # http://localhost:3002
```

Checks before committing:

```bash
npm run lint
npx tsc --noEmit
```

## Database notes

- PostGIS must be enabled; `location` columns are `geography` points written with raw SQL.
- Request IDs come from the `generate_request_id()` function in `doc/dbFunctions.txt`.
- `prisma/migrations` is out of date with the live schema. **Do not run `prisma migrate dev`** until a baseline exists; schema changes are applied as reviewed SQL (see `doc/sql/`).

## Docs

- `CLAUDE.md` — conventions, design system and architecture notes.
- `doc/ROADMAP.md` — current state and planned phases.
