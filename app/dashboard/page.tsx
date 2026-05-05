'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import Link from 'next/link';
import { SkeletonCard } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import RentCountdown from '../components/RentCountdown';
import {
  Receipt,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  ArrowRight,
  Wallet,
  Activity,
} from 'lucide-react';

interface Expense {
  id: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string;
  note?: string;
  createdAt?: string;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
  assignedTo: string;
  dueDate: string;
  createdBy: string;
}

interface CleaningTask {
  id: string;
  task: string;
  assignedTo: string;
  dayOfWeek: string;
  weekStart: string;
  done: boolean;
}

interface User {
  id?: string;
  username: string;
  name: string;
  surname?: string;
  color?: string;
}

interface ActivityItem {
  id: string;
  type: 'expense' | 'task' | 'cleaning' | 'settlement';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  user?: string;
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { userProfile } = useAuth();
  const { t } = useI18n();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const generateActivityFeed = useCallback((
    expensesData: Expense[],
    tasksData: Task[]
  ) => {
    const activities: ActivityItem[] = [];

    // Add recent expenses
    expensesData.slice(0, 10).forEach((expense) => {
      activities.push({
        id: `expense-${expense.id}`,
        type: 'expense',
        title: `${expense.category} expense added`,
        description: `${expense.paidBy} paid ${expense.amount.toLocaleString()} UZS`,
        timestamp: expense.date,
        amount: expense.amount,
        user: expense.paidBy,
      });
    });

    // Add tasks due soon
    const today = new Date().toISOString().slice(0, 10);
    tasksData
      .filter((t) => !t.done && t.dueDate >= today)
      .slice(0, 5)
      .forEach((task) => {
        const daysUntil = Math.ceil(
          (new Date(task.dueDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          title: 'Task due soon',
          description: `"${task.text}" assigned to ${task.assignedTo} (${
            daysUntil === 0 ? 'Today' : `${daysUntil} days`
          })`,
          timestamp: task.dueDate,
          user: task.assignedTo,
        });
      });

    // Sort by date (most recent first)
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setActivities(activities.slice(0, 15));
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const currentDate = new Date();
      const weekStart = getMonday(currentDate);

      const [expensesSnap, tasksSnap, cleaningSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(50))),
        getDocs(query(collection(db, 'tasks'), orderBy('dueDate'))),
        getDocs(
          query(
            collection(db, 'cleaning'),
            where('weekStart', '==', weekStart)
          )
        ),
        getDocs(collection(db, 'users')),
      ]);

      const expensesData = expensesSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Expense)
      );
      const tasksData = tasksSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Task)
      );
      const cleaningData = cleaningSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as CleaningTask)
      );
      const usersData = usersSnap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as User)
      );

      setExpenses(expensesData);
      setTasks(tasksData);
      setCleaningTasks(cleaningData);
      setUsers(usersData);

      generateActivityFeed(expensesData, tasksData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [generateActivityFeed]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Calculate stats
  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const totalMonthExpenses = monthExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  const myMonthExpenses = monthExpenses
    .filter((e) => e.paidBy === userProfile?.username)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const myTasks = tasks.filter(
    (t) => t.assignedTo === userProfile?.username && !t.done
  );
  const overdueTasks = myTasks.filter(
    (t) => new Date(t.dueDate) < new Date(new Date().toISOString().slice(0, 10))
  );

  const myCleaning = cleaningTasks.filter(
    (c) => c.assignedTo === userProfile?.username && !c.done
  );
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaysCleaning = myCleaning.filter((c) => c.dayOfWeek === today);


  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInDays = Math.floor(
      (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return then.toLocaleDateString();
  };

  const stats = [
    {
      title: t('dashboard.thisMonth'),
      value: totalMonthExpenses.toLocaleString() + ' UZS',
      subtitle: t('dashboard.totalExpenses'),
      icon: Wallet,
      color: 'bg-[#F97316]',
      trend: myMonthExpenses > 0 ? t('dashboard.youPaid') + ' ' + myMonthExpenses.toLocaleString() : null,
    },
    {
      title: t('dashboard.myTasks'),
      value: myTasks.length.toString(),
      subtitle: `${overdueTasks.length} ${t('dashboard.overdue')}`,
      icon: CheckSquare,
      color: overdueTasks.length > 0 ? 'bg-red-500' : 'bg-blue-500',
      alert: overdueTasks.length > 0,
    },
    {
      title: t('dashboard.cleaning'),
      value: myCleaning.length.toString(),
      subtitle: todaysCleaning.length > 0 ? `${todaysCleaning.length} ${t('dashboard.today')}` : t('dashboard.thisWeek'),
      icon: Sparkles,
      color: todaysCleaning.length > 0 ? 'bg-amber-500' : 'bg-purple-500',
      alert: todaysCleaning.length > 0,
    },
    {
      title: t('dashboard.roommates'),
      value: users.length.toString(),
      subtitle: t('dashboard.activeMembers'),
      icon: Users,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white"
          >
            {t('dashboard.welcome')}, {userProfile?.name || userProfile?.username}!
          </motion.h1>
          <p className="text-gray-400 mt-2">
            {t('dashboard.monthlyOverview')}
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <div className="space-y-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ delay: index * 0.1, duration: 0.2 }}
              className="bg-[#1a1d27] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <p
                    className={`text-sm mt-1 ${
                      stat.alert ? 'text-red-400' : 'text-gray-500'
                    }`}
                  >
                    {stat.subtitle}
                  </p>
                  {stat.trend && (
                    <p className="text-xs text-[#F97316] mt-1">{stat.trend}</p>
                  )}
                </div>
                <div className={`${stat.color} p-2.5 rounded-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">{t('dashboard.quickActions')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: t('dashboard.addExpense'),
                    href: '/dashboard/expenses',
                    icon: Receipt,
                    color: 'bg-[#F97316]',
                  },
                  {
                    label: t('dashboard.addTask'),
                    href: '/dashboard/tasks',
                    icon: CheckSquare,
                    color: 'bg-blue-500',
                  },
                  {
                    label: t('dashboard.viewBalances'),
                    href: '/dashboard/balances',
                    icon: Wallet,
                    color: 'bg-amber-500',
                  },
                  {
                    label: t('dashboard.exchangeRates'),
                    href: '/dashboard/rates',
                    icon: TrendingUp,
                    color: 'bg-purple-500',
                  },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                  >
                    <div className={`${action.color} p-2.5 rounded-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#F97316]" />
                  {t('dashboard.recentActivity')}
                </h2>
                <Link
                  href="/dashboard/expenses"
                  className="text-sm text-[#F97316] hover:text-[#188a65] flex items-center gap-1"
                >
                  {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-white/5 rounded-lg"></div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <EmptyState
                  emoji="🔔"
                  title={t('dashboard.noActivity')}
                  description={t('dashboard.noActivityDesc')}
                />
              ) : (
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'expense'
                            ? 'bg-[#F97316]/20 text-[#F97316]'
                            : activity.type === 'task'
                            ? 'bg-blue-500/20 text-blue-500'
                            : 'bg-amber-500/20 text-amber-500'
                        }`}
                      >
                        {activity.type === 'expense' ? (
                          <Receipt className="w-5 h-5" />
                        ) : activity.type === 'task' ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {activity.title}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Rent, Tasks & Cleaning */}
          <div className="space-y-6">
            {/* Rent Countdown */}
            <RentCountdown />

            {/* My Tasks */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  {t('dashboard.myTasks')}
                </h2>
                <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                  {myTasks.length} {t('dashboard.pending')}
                </span>
              </div>

              {myTasks.length === 0 ? (
                <EmptyState
                  icon={<CheckSquare className="w-8 h-8" />}
                  title={t('dashboard.allCaughtUp')}
                  description={t('dashboard.noPendingTasks')}
                />
              ) : (
                <div className="space-y-3">
                  {myTasks.slice(0, 5).map((task) => {
                    const daysUntil = Math.ceil(
                      (new Date(task.dueDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const isOverdue = daysUntil < 0;
                    const isToday = daysUntil === 0;

                    return (
                      <Link
                        key={task.id}
                        href="/dashboard/tasks"
                        className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <p className="text-white text-sm font-medium line-clamp-2">
                          {task.text}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isOverdue
                                ? 'bg-red-500/20 text-red-400'
                                : isToday
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {isOverdue
                              ? `${Math.abs(daysUntil)} ${t('dashboard.overdue')}`
                              : isToday
                              ? t('dashboard.today')
                              : `${daysUntil} ${t('dashboard.days')}`}
                          </span>
                          <span className="text-xs text-gray-500">
                            {task.dueDate}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  {myTasks.length > 5 && (
                    <Link
                      href="/dashboard/tasks"
                      className="block text-center text-sm text-[#F97316] hover:text-[#188a65] py-2"
                    >
                      {t('dashboard.viewMore')} {myTasks.length - 5} {t('dashboard.more')} {t('dashboard.tasks')} →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* My Cleaning Schedule */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  {t('dashboard.cleaning')}
                </h2>
                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                  {myCleaning.length} {t('dashboard.tasks')}
                </span>
              </div>

              {myCleaning.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="w-8 h-8" />}
                  title={t('dashboard.noCleaning')}
                  description={t('dashboard.noCleaningDesc')}
                />
              ) : (
                <div className="space-y-3">
                  {myCleaning.map((task) => (
                    <Link
                      key={task.id}
                      href="/dashboard/cleaning"
                      className="block p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <p className="text-white text-sm font-medium">{task.task}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            task.dayOfWeek === today
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-white/10 text-gray-400'
                          }`}
                        >
                          {task.dayOfWeek === today ? t('dashboard.today') : t('cleaning.day.' + task.dayOfWeek)}
                        </span>
                        <span
                          className={`text-xs ${
                            task.done ? 'text-green-400' : 'text-gray-500'
                          }`}
                        >
                          {task.done ? t('common.done') : t('dashboard.pending')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Summary */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                {t('dashboard.monthlyOverview')}
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{t('dashboard.yourContribution')}</span>
                    <span className="text-white">
                      {((myMonthExpenses / (totalMonthExpenses || 1)) * 100).toFixed(
                        0
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F97316] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (myMonthExpenses / (totalMonthExpenses || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {myMonthExpenses.toLocaleString()} of{' '}
                    {totalMonthExpenses.toLocaleString()} UZS
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <Link
                    href="/dashboard/expenses"
                    className="flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <span>View all expenses</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard/balances"
                    className="flex items-center justify-between text-sm text-gray-400 hover:text-white transition-colors mt-3"
                  >
                    <span>Check who owes whom</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
            </div>
          </div>
        </>
        )}
        </div>
      </div>
  );
}
