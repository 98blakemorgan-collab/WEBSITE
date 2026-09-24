# Plantagenet Players — Theatre Management System & Website

## Original Problem Statement
Turn Plantagenetplayers.site into a full functional small theatre management system and website including ticket sales, membership management, bulk emails, show management etc plus a lighting fixture asset info.

## Reference Sources
- Current site: plantagenetplayers.site (branding, tagline "Stories begin here", 70+ years since 1953, Mount Barker WA)
- Facebook: facebook.com/plantagenetplayers (blocked to scraping)
- Old hall site (Wayback): planthall.com.au — venue = Plantagenet District Hall, Memorial Drive, capacity 165, retractable theatre seating, kitchen/bar, in-house lighting & sound, real sponsors
- Real logo + real production/venue photos sourced and used across the site

## User Choices
- Payments: Stripe (claimable sandbox, AU) for ticket sales
- Bulk email: MOCKED for now (records recipients + campaign history, no live send)
- Auth: Admin staff + members, JWT email/password
- Design: bespoke "Velvet & Spotlight" dark theatrical theme; user logo + real photos only

## Architecture
- Backend: FastAPI + MongoDB (motor), JWT (Bearer, localStorage `pp_token`), bcrypt. All routes under `/api`.
- Frontend: React (CRA/craco), Tailwind, shadcn/ui, framer, recharts, sonner. `@/` alias to src.
- Stripe: raw SDK, dynamic price_data per ticket tier, mode=payment (no auto tax = DIY). Webhook `/api/stripe/webhook`, status polling fallback.
- Real assets served from `/app/frontend/public/venue/*` and `/pp-logo.png`.

## Personas
- Patron/audience: browse shows, buy tickets, view digital tickets, apply for membership
- Member (cast/crew/FOH): portal with tickets + membership status
- Admin/committee: full dashboard (shows, members, sales, bulk email, lighting assets)

## Code-quality / security pass (2026-06, verified iteration_4 100%)
- **Auth hardened**: migrated from localStorage JWT to secure **httpOnly cookies** (same-origin). Backend sets/clears cookie on login/register/logout; `get_current_user` keeps Bearer fallback. Frontend axios `withCredentials`, AuthContext checks `/auth/me` on mount — no token in localStorage. 45/45 backend + 100% frontend tests pass.
- PaymentSuccess: replaced empty catch with retry logging
- ShowDetail: stable React keys on cast/crew/performances lists
- backend_test.py: credentials read from env vars (no hardcoded secrets)
- Reviewer items intentionally NOT changed: `server.py` `is not None` (correct idiom, not an anti-pattern); `craco.config.js` console.warn (dev-only platform tooling, never in prod build); large-component/`server.py` splits (out of scope, regression risk on a working app)

## Implemented — latest batch (2026-06, verified iteration_3 100%)
- Show Archive page (/archive): past shows listed WITHOUT dates; click opens detail w/ cast/crew
- Home: dynamic featured/next show section + hero slideshow
- Media Library (admin) + MediaPicker: upload & reuse photos across CMS/shows/sponsors
- Guest checkout with marketing opt-in → captured in marketing_contacts (source=ticket_purchase)
- Our Story: Constitution + AGM minutes document links (CMS pagetab-documents)
- Admin Email: Marketing subscribers / All ticket buyers audiences
- Bulk email delivery remains MOCKED by design

## Implemented (2026-06)
- Public site (separate routed pages): Home, What's On (+filters), Show detail w/ Stripe checkout, Our Story (history timeline + real production gallery), Membership (apply flow), Sponsors (real logos), Contact (+ real venue/hall-hire facilities)
- Auth: register/login/me/logout, admin seeding, demo member
- Ticket sales: Stripe checkout, payment success/cancel, ticket issuance, member "My Tickets"
- Membership: application + admin status management
- Admin dashboard: KPI stats + revenue chart, Shows CRUD, Members management, Ticket Sales table, Bulk Email composer (MOCKED delivery, templates, audiences, history), Lighting Fixture asset inventory (DMX, lamp hours, power, location, status CRUD)
- Branding: user's maroon logo (transparent) in nav/footer/auth/admin, browser tab title/favicon
- Real Plantagenet Players photos placed across hero, show posters, story gallery, auth, admin lighting header; real venue details + real sponsors (Mt Barker Co-op, Shire of Plantagenet, Bendigo Bank, Lotterywest)
- Testing: iteration_1 — 100% backend, 100% frontend

## Backlog / Remaining
- P1: Real bulk email delivery (Resend) when user is ready
- P1: User to upload any additional/newer production photos to replace/extend the archive set
- P2: Digital ticket PDF/QR download; email confirmation on purchase
- P2: Seat-level selection (currently section/tier based)
- P2: Audition/roster noticeboard in member portal
- P2: Sponsor management in admin (currently static list)

## Test Credentials
- Admin: 7yg268b5cs@privaterelay.appleid.com / Plantagenet1953!
- Member: member@plantagenetplayers.site / Member123!
- Stripe test card: 4242 4242 4242 4242
