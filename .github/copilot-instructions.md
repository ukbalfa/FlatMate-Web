# Copilot Instructions for FlatMate Dashboard

> ⚠️ **Important:** This project runs on **Next.js 16** with breaking changes. Before framework-level edits, check the relevant docs in `node_modules/next/dist/docs/`.

## Build, Test, and Lint Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint on the project |
| `npm run lint -- app/dashboard/tasks/page.tsx` | Lint a single file |

**Tests:** No test framework is configured in this repository right now, so there is no single-test command yet.

## High-Level Architecture

- **App shell + providers:** `app/layout.tsx` is the root server layout; it wraps the app with `Providers` (`app/providers.tsx`), which composes `AuthProvider -> NotificationsProvider -> I18nProvider -> ThemeProvider` and mounts the Sonner toaster.
- **Authentication flow:** Firebase Auth is used. `context/AuthContext.tsx` subscribes to `onAuthStateChanged`, then loads `users/{uid}` from Firestore into `userProfile`. `app/dashboard/layout.tsx` is the route guard and redirects unauthenticated users to `/login`.
- **Admin bootstrap + roommate lifecycle:** `app/login/page.tsx` supports first-admin setup by checking whether `users` already has records. `app/dashboard/roommates/page.tsx` creates roommate auth accounts via a secondary Firebase app (`Secondary`) and stores profile docs in `users`.
- **Data layer pattern:** Most feature pages under `app/dashboard/*` read/write Firestore directly from client components (`expenses`, `tasks`, `cleaning`, `settlements`, `recurringExpenses`, `notifications`, `users`). Real-time subscriptions are used where live updates matter (`onSnapshot` in tasks/cleaning/expenses/notifications).
- **Privileged deletion path:** `app/actions/deleteRoommate.ts` is a server action using `firebase-admin` to delete both Firebase Auth user and Firestore profile; it requires server env vars `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- **External data integration:** `app/dashboard/rates/page.tsx` fetches exchange rates from `open.er-api.com`, refreshes every 10 minutes, and falls back to `localStorage` cache on API failure.

## Key Conventions

- **Import/style conventions (from AGENTS/CLAUDE):** import order is React/Next -> external libs -> relative local imports; use relative imports instead of `@/*`; page components are default-exported named functions (`SomethingPage`).
- **Client-component convention:** every page/layout except `app/layout.tsx` uses `'use client';` at the top.
- **Role-based UI and writes:** pages consistently derive permissions from `useAuth()` (`userProfile?.role === 'admin'`) for destructive/admin-only actions; Firestore security rules enforce authenticated access and admin/self constraints on `/users`.
- **Date storage format:** business records commonly store dates as ISO strings (`YYYY-MM-DD`) and query/filter by string ranges (for example monthly filters in balances/expenses).
- **State persistence keys:** shared UI preferences are persisted under fixed keys (`flatmate-theme`, `flatmate-language`, `cached_rates`) and should stay stable unless doing a migration.
- **Styling pattern:** Tailwind v4 utility classes are primary; `fm-` prefixed classes from `app/globals.css` are also used for common UI primitives. Brand accent is `#1D9E75`.

For deeper project conventions, also read `AGENTS.md`, `CLAUDE.md`, and `README.md`.
