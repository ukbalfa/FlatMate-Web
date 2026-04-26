'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Sparkles,
  CheckSquare,
  Users,
  Menu,
  Bell,
  LogOut,
  Sun,
  Moon,
  Settings,
  Wallet,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import NotificationsDropdown from '../components/NotificationsDropdown';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { ErrorBoundary } from '../components/ErrorBoundary';

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/rates", label: "Exchange Rates", icon: TrendingUp },
  { href: "/dashboard/expenses", label: "Expenses", icon: Receipt },
  { href: "/dashboard/balances", label: "Balances", icon: Wallet },
  { href: "/dashboard/cleaning", label: "Cleaning", icon: Sparkles },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/roommates", label: "Roommates", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/rates": "Exchange Rates",
  "/dashboard/expenses": "Expenses",
  "/dashboard/balances": "Balances",
  "/dashboard/cleaning": "Cleaning Schedule",
  "/dashboard/tasks": "Tasks",
  "/dashboard/roommates": "Roommates",
  "/dashboard/settings": "Settings",
};

interface DashboardUser {
  id?: string;
  username: string;
  name?: string;
  role?: string;
  color?: string;
}

function mapToDashboardUser(userProfile: { uid: string; username: string; name?: string; role?: string; color?: string } | null): DashboardUser | null {
  if (!userProfile) return null;
  return {
    id: userProfile.uid,
    username: userProfile.username,
    name: userProfile.name,
    role: userProfile.role,
    color: userProfile.color,
  };
}

function SidebarContent({ user, setSidebarOpen, handleLogout }: { user: DashboardUser | null, setSidebarOpen: (v: boolean) => void, handleLogout: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 font-bold text-xl gap-2 border-b border-white/[0.06]">
        <span className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse"></span>
        <span className="text-white">FlatMate</span>
      </div>

      {/* Navigation */}
      <SidebarNavLinks setSidebarOpen={setSidebarOpen} />

      {/* User info + logout */}
      {user && (
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg"
              style={{ background: user.color || '#1D9E75' }}
            >
              {user.name?.[0] || user.username?.[0] || '?'}
            </span>
            <div className="min-w-0">
              <div className="text-sm text-white font-semibold truncate">{user.name || user.username}</div>
              <div className="text-xs text-slate-300 capitalize">{user.role}</div>
            </div>
          </div>
          <button
            onClick={() => handleLogout()}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarNavLinks({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 py-4 px-3 space-y-1">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <motion.div
            key={link.href}
            whileHover={{ x: isActive ? 0 : 4 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#1D9E75]/10 text-white font-semibold shadow-[0_0_20px_rgba(29,158,117,0.15)]'
                  : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <link.icon className={`w-5 h-5 ${isActive ? 'text-[#1D9E75]' : ''}`} />
              {link.label}
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userProfile, loading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const pageTitle = pageNames[pathname] || "Dashboard";
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const dashboardUser = mapToDashboardUser(userProfile);

  return (
    <div className="flex min-h-screen bg-[#0a0b0f]">
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 bg-[#13161f] border-r border-white/[0.06]">
        <SidebarContent user={dashboardUser} setSidebarOpen={setSidebarOpen} handleLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] as const }}
            className="fixed top-0 left-0 z-50 h-full w-[240px] bg-[#13161f] shadow-2xl lg:hidden"
          >
            <SidebarContent user={dashboardUser} setSidebarOpen={setSidebarOpen} handleLogout={handleLogout} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center h-16 px-5 bg-[#13161f]/80 backdrop-blur-sm border-b border-white/[0.06] sticky top-0 z-30">
          {/* Left: hamburger (mobile only) */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] transition-colors mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setSidebarOpen(true)}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-slate-300" />
          </button>

          {/* Center/Left: page title */}
          <h1 className="text-base font-semibold text-white tracking-tight">
            {pageTitle}
          </h1>

          <div className="flex-1" />

          {/* Right: theme toggle + bell + user */}
          <button
            onClick={() => {
              setTheme(isDark ? 'light' : 'dark');
            }}
            className="w-11 h-6 flex items-center bg-gray-700 dark:bg-[#1D9E75] rounded-full relative transition-all duration-300 focus:outline-none mr-3 hover:shadow-lg"
            style={{ minWidth: 44, minHeight: 24 }}
            title="Toggle theme"
            aria-label="Toggle dark mode"
          >
            <span
              className={`absolute left-1 top-1/2 -translate-y-1/2 transition-transform duration-300 w-4 h-4 rounded-full bg-white shadow-md ${
                isDark ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
            <span className="absolute left-2 top-1/2 -translate-y-1/2">
              {isDark ? (
                <Sun className="w-3 h-3 text-[#1D9E75]" />
              ) : (
                <Moon className="w-3 h-3 text-gray-400" />
              )}
            </span>
          </button>

          <NotificationsDropdown />

          <LanguageSwitcher />

          {dashboardUser && (
            <span className="text-sm text-slate-200 font-medium hidden sm:block">
              {dashboardUser.name || dashboardUser.username}
            </span>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 sm:p-8 page-enter">
          <div className="max-w-5xl mx-auto w-full">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
