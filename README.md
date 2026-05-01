<div align="center">

<br/>

# 🏠 FlatMate Dashboard

### *The all-in-one command centre for shared living.*

<br/>

[![Version](https://img.shields.io/badge/version-1.0.0-1D9E75?style=for-the-badge&logo=github)](https://github.com/ukbalfa/flatmate-dashboard/releases)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=000)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=fff)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=000)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](./LICENSE)

<br/>

> **FlatMate** eliminates awkward conversations about money and chores by giving every roommate  
> a single, real-time dashboard — accessible from any device, anywhere.

<br/>

[**🚀 Get Started**](#-getting-started) · [**✨ Features**](#-features) · [**🏗️ Architecture**](#%EF%B8%8F-architecture) · [**⚙️ Configuration**](#%EF%B8%8F-environment-variables)

<br/>

---

</div>

## 📖 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
- [🏗️ Architecture](#%EF%B8%8F-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Variables](#%EF%B8%8F-environment-variables)
- [🔥 Firebase Setup](#-firebase-setup)
- [📜 Available Scripts](#-available-scripts)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

<div align="center">

| 🏠 &nbsp;**Dashboard** | 💸 &nbsp;**Expenses** | 🧹 &nbsp;**Cleaning** |
|:---|:---|:---|
| Rent countdown, monthly spend overview, live exchange rate ticker, pinned announcements, and real-time activity feed. | Add, categorise, and split shared costs. Real-time monthly summaries keep everyone in the loop. | Admin-curated weekly chore list. Any roommate can mark tasks complete — auto-resets each week. |

| ✅ &nbsp;**Tasks** | 👥 &nbsp;**Roommates** | 💱 &nbsp;**Rates** |
|:---|:---|:---|
| Shared to-do list with due dates, assignees, and smart **Upcoming / Today / Overdue** badges. | Profile cards with Telegram & Instagram links. Admins can create, edit, and remove accounts. | Live USD / UZS / EUR rates from `open.er-api.com`, refreshed every 10 minutes with a built-in converter. |

| ⚖️ &nbsp;**Balances** | 🌙 &nbsp;**Dark Mode** | 📱 &nbsp;**Responsive** |
|:---|:---|:---|
| Crystal-clear overview of who owes what across all shared expenses. | Full light/dark theme support via `next-themes`. Persisted across sessions. | Desktop sidebar + mobile overlay navigation — works great on every screen size. |

</div>

---

## 🛠️ Tech Stack

### Core

| Package | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | `16.2.2` | App Router, Turbopack, SSR/CSR |
| [React](https://react.dev) | `19.2.4` | UI library |
| [TypeScript](https://www.typescriptlang.org) | `5` | Type safety (strict mode) |

### UI & Styling

| Package | Version | Purpose |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | `4` | Utility-first CSS with `@theme` tokens in `globals.css` |
| [Framer Motion](https://www.framer.com/motion/) | `12` | Page transitions, card animations, sidebar |
| [Lucide React](https://lucide.dev) | `1.7.0` | Icon library |
| [next-themes](https://github.com/pacocoursey/next-themes) | `0.4.6` | Dark / light mode |
| [Sonner](https://sonner.emilkowal.ski/) | `2` | Toast notifications |

### Backend & Data

| Package | Version | Purpose |
|---|---|---|
| [Firebase](https://firebase.google.com) | `12` | Firestore client SDK — real-time via `onSnapshot` |
| [firebase-admin](https://firebase.google.com/docs/admin/setup) | `13` | Server Actions (privileged operations) |
| [open.er-api.com](https://open.er-api.com) | — | Live exchange rates |

---

## 🏗️ Architecture

### Data Flow

```
Browser (React Client Components)
    │
    ├── 🔥 Firebase Firestore ─── real-time (onSnapshot) / one-time (getDocs)
    │        collections:  users · expenses · tasks · cleaning
    │                      announcements · settings · notifications
    │
    ├── ⚡ Server Actions (firebase-admin) ─── privileged ops (e.g. delete user)
    │
    └── 🌐 open.er-api.com ─── live exchange rates, polled every 10 min
                                falls back to localStorage cache on failure
```

### Auth Model

```
1. User submits credentials on /login
        │
        ▼
2. Credentials verified against Firestore `users` collection
        │
        ▼
3. User document stored in localStorage under key "user"
        │
        ▼
4. Dashboard layout reads localStorage on mount
   → redirects to /login if no session found
        │
        ▼
5. Role-based UI: admin vs. roommate (from `role` field)
```

### Theme & Animation

- **Tailwind v4** — theme tokens defined via `@theme inline` in `app/globals.css`; brand accent `#1D9E75`
- **next-themes** — `ThemeProvider` in `app/providers.tsx` persists preference; dark mode via `dark:` prefix
- **Framer Motion** — page transitions, staggered list entries, card hover effects, mobile sidebar slide-in
- **CSS helpers** — `animate-fade-in`, `animate-slide-down`, `stagger-1`–`stagger-4` in `globals.css`

---

## 📁 Project Structure

```
flatmate-dashboard/
├── app/
│   ├── layout.tsx                  # Root layout — Inter font + Providers
│   ├── providers.tsx               # ThemeProvider + Sonner Toaster
│   ├── globals.css                 # Tailwind v4 @theme tokens, fm-* classes
│   ├── page.tsx                    # Public landing page
│   ├── not-found.tsx               # 404 page
│   ├── login/
│   │   └── page.tsx                # Login + first-admin bootstrap
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + topbar + theme toggle (route guard)
│   │   ├── page.tsx                # Home — metrics, announcements, activity
│   │   ├── expenses/page.tsx       # Expense tracker
│   │   ├── cleaning/page.tsx       # Cleaning schedule
│   │   ├── tasks/page.tsx          # Task manager
│   │   ├── roommates/page.tsx      # Roommate profiles
│   │   ├── rates/page.tsx          # Exchange rates & converter
│   │   ├── balances/page.tsx       # Expense balances
│   │   └── settings/page.tsx       # Household settings
│   ├── actions/
│   │   └── deleteRoommate.ts       # Server Action (firebase-admin)
│   └── components/                 # Shared UI components
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       ├── LanguageSwitcher.tsx
│       ├── NotificationsDropdown.tsx
│       ├── Skeleton.tsx
│       └── Spinner.tsx
├── context/
│   └── AuthContext.tsx             # Auth state via React context
├── lib/
│   └── firebase.ts                 # Firebase init + exports
├── firestore.rules                 # Firestore security rules
├── firebase.json                   # Firebase project config
├── next.config.ts                  # Next.js config (Turbopack)
├── tsconfig.json                   # TypeScript config (strict)
└── .env.local                      # 🔒 Firebase credentials (never committed)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or later
- A **Firebase** project with Firestore enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ukbalfa/flatmate-dashboard.git
cd flatmate-dashboard

# 2. Install dependencies
npm install

# 3. Create your environment file and fill in your Firebase credentials
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> **First run?** The login page will guide you through bootstrapping your first admin account.

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (server-side — only needed for deleteRoommate action)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Never commit `.env.local` to version control.** It is in `.gitignore` by default.

---

## 🔥 Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Cloud Firestore** in production mode.
3. Deploy the included security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. Seed an initial `users` document. Each record should contain:

   | Field | Type | Description |
   |---|---|---|
   | `username` | `string` | Login username |
   | `password` | `string` | Login password (hashed recommended) |
   | `name` | `string` | Display name |
   | `role` | `"admin"` \| `"roommate"` | Access level |
   | `color` | `string` | Avatar colour (hex, e.g. `#1D9E75`) |
   | `joinedAt` | `string` | ISO date string (`YYYY-MM-DD`) |

5. Copy your Firebase web app credentials into `.env.local`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with **Turbopack** |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint across the entire codebase |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get involved:

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Follow the coding conventions documented in [`AGENTS.md`](./AGENTS.md).
3. Run the linter before opening a PR:
   ```bash
   npm run lint
   ```
4. Open a **pull request** with a clear description of your changes.

---

<div align="center">

Built with ❤️ for shared living &nbsp;·&nbsp; **v1.0.0**

</div>

