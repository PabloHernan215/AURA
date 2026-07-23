# AURA — Beauty & Wellness Booking Platform

A venue-centric booking marketplace (Fresha-style): clients browse and book **local
venues** ("locales"), each with its own team of professionals. Venue owners register
their business and manage staff/bookings; professionals affiliated with a venue manage
their own services, schedule, and appointments; admins approve venues and oversee the
platform.

## Stack

- **Next.js 14** (App Router) — one codebase for UI + API routes
- **TypeScript** end to end
- **Prisma + PostgreSQL** (via [neon.tech](https://neon.tech)'s free tier) — same database locally and in production
- **NextAuth.js** (Credentials provider, JWT sessions) — role-aware auth (`CLIENT` / `PROFESSIONAL` / `BUSINESS_OWNER` / `ADMIN`)
- **TailwindCSS** — mobile-first styling
- **Zod** — request validation on every API route

## Getting started

```bash
npm install
cp .env.example .env        # then set DATABASE_URL (see below) and NEXTAUTH_SECRET
npm run db:push             # creates all tables from schema.prisma
npm run db:seed             # loads demo data (2 professionals, 1 client, 1 admin)
npm run dev
```

You'll need a PostgreSQL database — the fastest free option is [neon.tech](https://neon.tech):
create an account, create a project, and copy the connection string it gives you into
`DATABASE_URL` in your `.env`. See "Deploying" below for the full production path.

Visit `http://localhost:3000`.

### Demo accounts (password: `password123`)

| Role | Email |
|---|---|
| Admin | admin@aura.studio |
| Client | client@aura.studio |
| Business Owner | dueno1@aura.studio (AURA Hub - Centro) |
| Business Owner | dueno2@aura.studio (AURA Nails Studio) |
| Professional | maria@aura.studio (Hair, at AURA Hub - Centro) |
| Professional | lucia@aura.studio (Nails, at AURA Nails Studio) |

## Project structure

```
prisma/
  schema.prisma          # all 6 core entities + relations + constraints
  seed.ts                # demo data
src/
  app/
    page.tsx              # landing page
    login/, register/     # auth pages
    professionals/        # browse + profile pages
    book/[professionalId]/[serviceId]/   # booking flow
    bookings/              # client's "my appointments" + review
    dashboard/
      professional/        # profile, services, availability, bookings mgmt
      admin/                # metrics, users, bookings
    api/                    # all backend routes (see below)
  components/               # Navbar, ProfessionalCard, ServiceCard,
                             # BookingSlotPicker, ReviewForm, StarRating
  lib/
    prisma.ts               # Prisma client singleton
    auth.ts                 # NextAuth config
    availability.ts         # *** the slot-computation & double-booking engine ***
    session.ts              # requireUser / requireRole guards for API routes
  middleware.ts              # edge-level role protection for /dashboard/*
```

## API routes

| Route | Purpose |
|---|---|
| `POST /api/auth/register` | Create client/professional account |
| `GET/POST /api/professionals` | Browse / (n/a) |
| `GET/PATCH /api/professionals/[id]` | Public profile / owner edit |
| `GET /api/professionals/me` | Logged-in professional's own profile |
| `GET/POST /api/services` | List for a professional / create (owner) |
| `PATCH/DELETE /api/services/[id]` | Edit / soft-delete (owner) |
| `GET/POST/DELETE /api/availability` | Weekly windows, or `?date=&serviceId=` for computed open slots |
| `GET/POST /api/bookings` | My bookings / create booking (race-safe) |
| `PATCH /api/bookings/[id]` | Confirm/cancel/complete with role rules |
| `POST /api/reviews` | Review a completed booking, recomputes rating average |
| `GET/PATCH /api/admin/users` | Admin: list users, enable/disable |
| `GET /api/admin/bookings` | Admin: all bookings + platform metrics |

## How double-booking is prevented

1. **Read-time computation** — bookable slots are never stored; they're derived on every
   request from `Availability` windows minus existing `PENDING`/`CONFIRMED` bookings for
   that professional on that day (`lib/availability.ts::getAvailableSlots`).
2. **Re-validation at write-time** — right before creating a booking, the server re-checks
   the exact requested slot is still inside a valid window and has no overlap
   (`isSlotStillAvailable`), closing the gap between "client fetched slots" and "client
   submitted."
3. **Database-level guarantee** — `Booking` has a `@@unique([professionalId, datetime])`
   constraint in `schema.prisma`. Even if two requests land in the same millisecond, the
   second insert fails with a Prisma `P2002` error, which the API route catches and turns
   into a friendly "just booked, pick another time" response.

## What's intentionally simplified for v1

- **Payments**: bookings are marked "paid offline" — no Stripe/payment integration.
- **Slot granularity**: fixed 15-minute steps; no per-professional buffer/break time yet.
- **Notifications**: no email/SMS confirmations (would be the next thing to add).
- **Images**: `photoUrl` is a plain URL field; no upload/storage pipeline yet.

## Deploying

1. Create a free PostgreSQL database at [neon.tech](https://neon.tech) and copy its connection string.
2. Push this project to a GitHub repository.
3. Import the repo into [vercel.com](https://vercel.com).
4. In the Vercel project's Environment Variables, set: `DATABASE_URL` (from Neon), `NEXTAUTH_SECRET` (any long random string), `NEXTAUTH_URL` (your Vercel domain, e.g. `https://your-app.vercel.app`), and optionally the Twilio/Resend variables.
5. Locally, point `.env` at the same Neon `DATABASE_URL` and run `npm run db:push` then `npm run db:seed` once, to create the tables and demo data in the live database.
6. Deploy. Vercel redeploys automatically on every push to the connected branch.

## Future scalability (not built, by design)

Multi-location studios, an AI scheduling assistant, WhatsApp booking, subscription plans,
and a commission system were explicitly out of scope for this MVP — the schema
(`professionalId` as a first-class foreign key everywhere, no assumptions about a single
studio) is structured so none of these require a rewrite, only additive models.
