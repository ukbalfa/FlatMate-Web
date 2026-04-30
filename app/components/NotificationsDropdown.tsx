'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Trash2, Receipt, CheckSquare, Sparkles, Wallet, AlertCircle } from 'lucide-react';
import { useNotifications, Notification } from '../../context/NotificationsContext';
import { useRouter } from 'next/navigation';

const typeIcons = {
  task: CheckSquare,
  expense: Receipt,
  cleaning: Sparkles,
  settlement: Wallet,
  system: AlertCircle,
};

const typeColors = {
  task: 'text-blue-400 bg-blue-500/20',
  expense: 'text-[#1D9E75] bg-[#1D9E75]/20',
  cleaning: 'text-amber-400 bg-amber-500/20',
  settlement: 'text-purple-400 bg-purple-500/20',
  system: 'text-gray-400 bg-gray-500/20',
};

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.link) {
      router.push(notification.link);
    }
    
    setIsOpen(false);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-white/[0.06] hover:text-teal-400 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-1rem)] bg-[#1a1d27] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-semibold">Notifications</h3>
                {notifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-[#1D9E75] hover:text-[#188a65] flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No notifications yet</p>
                    <p className="text-gray-600 text-xs mt-1">
                      We&apos;ll notify you about tasks, expenses, and more
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((notification) => {
                      const Icon = typeIcons[notification.type];
                      const colorClass = typeColors[notification.type];

                      return (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors text-left ${
                            !notification.read ? 'bg-white/[0.02]' : ''
                          }`}
                        >
                          {/* Icon */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>

                          {/* Unread indicator */}
                          {!notification.read && (
                            <span className="w-2 h-2 bg-[#1D9E75] rounded-full flex-shrink-0 mt-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                  </span>
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
