<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — FlatMate Dashboard (compact)

## Commands
- `npm run dev` Start Turbopack dev server (run from repository root).
- `npm run build` Production build.
- `npm run start` Start production server.
- `npm run lint` Run ESLint (run before committing).

## Tech Stack
- Next.js 16 (App Router) – client‑only.
- React 19, TypeScript 5 (strict).
- Tailwind CSS v4 with `@theme` tokens in `app/globals.css`.
- Framer Motion, Lucide React, next‑themes, Sonner toast.
- Firebase Firestore + client‑side Firebase Auth.

## Project Conventions (high‑signal)
- **No `components/` directory** – all UI lives inline in page or layout files.
- **Every file that renders UI (except `app/layout.tsx`) must begin with `'use client';`.** This makes it a client component; the app uses no server components.
- **Pages** are default‑exported named functions: `export default function FooPage() {}`. Names use PascalCase + `Page` suffix.
- **Import order** 1) React/Next, 2) external libs, 3) relative paths. Use named imports; only page components use default export. Use relative paths (`../../lib/firebase`); never the `@/*` alias defined in `tsconfig.json`.
- **Multi‑line imports** list one identifier per line, trailing commas.
- **Naming**: constants `UPPER_SNAKE_CASE`, helpers `PascalCase`, variables/functions `camelCase`.
- **TypeScript**: `strict:true`; avoid `any`; define interfaces at the top of the file.
- **Tailwind**: Theme tokens are defined via `@theme` in `app/globals.css` (not in `tailwind.config.js`). Use `fm-` prefixed utility classes for buttons, inputs, cards. Brand color = `#1D9E75` (`var(--color-accent)`). Dark mode via `dark:` prefix and custom variant `&:where(.dark, .dark *)`.
- **Firebase**: All data accessed directly from the client with Firestore SDK. Use `onSnapshot` for real‑time collections (`expenses`, `cleaning`, `tasks`, `announcements`). `users` collection uses one‑time `getDocs`. Auth state via `useAuth()` (AuthContext). Guard admin UI with `user?.role === 'admin'`.
- **UI libraries**: Use Framer Motion for animations, Lucide React for icons, Sonner (`toast.success()`, `toast.error()`, `toast.warning()`) for user feedback.
- **Linting**: Run `npm run lint` before committing; ESLint config is strict.
- **Git & security**: Never commit `.env*` files. Do not modify `lib/firebase.ts` or Firebase config without approval. Do not add a `components/` directory, server‑side code (API routes, server actions), or new npm packages without explicit request.
- **Testing**: No test framework configured; do not add test files unless asked.
- **Environment variables** (required in `.env.local`):
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`
- **Always** test UI in both light and dark mode (theme toggle is present in `app/dashboard/layout.tsx`).

## Safety Checklist (quick reference)
- ✅ `'use client';` at top of every page/layout (except root layout).
- ✅ No `components/` folder; UI inline.
- ✅ Import order & relative paths.
- ✅ Use Sonner for toast notifications.
- ✅ Guard admin UI with `user?.role === 'admin'`.
- ✅ Run `npm run lint` before push.
- ❌ Never commit `.env*`.
- ❌ Never add server‑side code.
- ❌ Never use the `@/*` alias.
- ❌ Never introduce test framework without ask.
