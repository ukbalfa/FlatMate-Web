# FlatMate Dashboard - Agent Instructions

This file contains high-signal, repo-specific instructions to help AI agents work effectively in this repository.

## Architecture & Data Flow
- **Next.js 16 (App Router)**: Core framework. Ensure all routing follows the App Router (`app/` directory) conventions.
- **Client-Side Auth**: Authentication is non-standard. It verifies credentials against the Firestore `users` collection and stores the session in `localStorage` under the key `"user"`. Protected pages must read `localStorage` on mount and redirect to `/login` if absent. Role-based UI is controlled via the `role` field (`admin` vs `roommate`).
- **Firebase / Firestore**: Client components use Firebase 12 SDK for real-time data (`onSnapshot` / `getDocs`). Privileged operations use `firebase-admin` via Next.js Server Actions (located in `app/actions/`).
- **External APIs**: Live exchange rates are polled from `open.er-api.com`.

## Styling & Theming
- **Tailwind CSS v4**: Theme tokens are defined via `@theme inline` in `app/globals.css`.
- **Brand Accent**: `#1D9E75` (`var(--color-accent)`).
- **Dark/Light Mode**: Managed by `next-themes` via the `ThemeProvider` in `app/providers.tsx`.
- **Animations**: Use Framer Motion for complex transitions/interactions and CSS helper classes (e.g., `animate-fade-in`, `stagger-1`) defined in `globals.css` for simpler cases.

## Workflow & Commands
- **Linting**: Run `npm run lint` before committing changes to ensure ESLint checks pass.
- **Build**: Run `npm run build` to verify the production build compiles successfully. There are no automated test scripts (`npm test`) configured.

## Environment Variables
- Firebase configuration goes into `.env.local`. Never commit this file or expose secrets in client code. Server Actions (`firebase-admin`) should rely on server-side environment configurations.
