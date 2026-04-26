<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — FlatMate Dashboard

## Build / Lint / Test Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

**No test framework is configured.** Ask before introducing test dependencies.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript 5** (strict mode)
- **Tailwind CSS v4** (CSS-based `@theme` config in `app/globals.css`)
- **Firebase Firestore & Auth** (client SDK + `firebase-admin` in Server Actions)
- **Framer Motion** (animations)
- **Lucide React** (icons)
- **next-themes** (dark/light mode)
- **sonner** (toast notifications)

## Code Style

### Imports

- Group in order: (1) React/Next.js, (2) external libs, (3) relative/local
- Use **named imports** exclusively for libraries; default exports only for page components
- Multi-line imports: one item per line with trailing commas
- Use **relative paths** for local imports (e.g., `../../lib/firebase`), NOT the `@/*` alias (it is configured but never used)

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
```

### `'use client'` directive

- **Every page and layout file** (except `app/layout.tsx`) is a client component
- Place `'use client';` at the very top of the file, before all imports

### Components

- All pages are **default-exported named functions**: `export default function ExpensesPage() { ... }`
- Naming: `PascalCase` + `Page` suffix for pages (e.g., `CleaningPage`, `TasksPage`)
- Small helper components may be defined inline within the same file as non-exported functions
- Reusable components belong in `app/components/` (e.g. `LanguageSwitcher.tsx`, `NotificationsDropdown.tsx`)

### TypeScript

- `strict: true` is enabled — respect it
- **Avoid `any`** — the existing codebase overuses it; new code should define proper interfaces
- Define interfaces/types at the top of the file, not inline:
  ```typescript
  interface Expense {
    id: string;
    amount: number;
    category: string;
    date: string;
    description: string;
  }
  ```
- Use inline type annotations for function params when simple: `function timeAgo(val: number) { ... }`
- Use `React.FormEvent`, `React.ReactNode` explicitly where needed
- Use optional chaining (`?.`) and nullish coalescing (`??`) consistently

### Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| Page components | PascalCase + `Page` | `ExpensesPage` |
| Layout components | PascalCase | `RootLayout`, `DashboardLayout` |
| Helper components | PascalCase | `Avatar`, `SidebarContent` |
| Variables / functions | camelCase | `fetchExpenses`, `handleAdd` |
| Constants / config arrays | UPPER_SNAKE_CASE | `CATEGORIES`, `CURRENCIES` |
| Files | Next.js conventions | `page.tsx`, `layout.tsx` |

### Tailwind CSS & Styling

- **Tailwind v4** — theme tokens are defined via `@theme inline` in `app/globals.css`, NOT in `tailwind.config.js`
- Two styling approaches coexist:
  1. **Inline Tailwind utilities** (dominant) — prefer this for layout and spacing
  2. **`fm-` prefixed CSS classes** (buttons, inputs, cards) — use these for form elements and cards
- Dark mode: use `dark:` prefix throughout; custom variant is `&:where(.dark, .dark *)`
- Brand color: `#1D9E75` (also available as `var(--color-accent)`)
- Arbitrary values are acceptable when needed: `bg-[#1D9E75]/10`, `border-white/[0.06]`
- Responsive breakpoints: `sm:`, `md:`, `lg:` — use consistently

### Error Handling

- Use try/catch with **meaningful error messages** — do not swallow the error variable
- Show errors using the `sonner` toast system: `toast.error(message)` or inline via component state
- Guard clauses for form validation: `if (!name.trim() || !user) return;`
- No error boundaries are defined — add one if the user requests it

### Firebase / Data Layer

- **Most data operations are direct Firestore calls from client components**
- Server Actions (`app/actions/`) with `firebase-admin` are used for privileged ops (like `deleteUser`)
- **Firebase Auth is used** — see `context/AuthContext.tsx` for auth state management
- Common fetch pattern (reused across pages):
```typescript
const snap = await getDocs(query(collection(db, 'collectionName'), orderBy('createdAt', 'desc')));
setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
```
- Access auth state via `useAuth()` hook from `context/AuthContext`

### Animations

- Use **Framer Motion** for page transitions, card hover effects, staggered lists, mobile sidebar
- CSS animation classes (`animate-fade-in`, `animate-slide-down`, `stagger-1`–`stagger-4`) are defined in `globals.css` and may be used for simpler cases
- Use `as const` for cubic-bezier easing arrays: `ease: [0.25, 0.1, 0.25, 1] as const`
