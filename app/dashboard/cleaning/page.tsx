'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Spinner } from '../../components/Spinner';
import { SkeletonList } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { useAuth } from '../../../context/AuthContext';

interface User {
  id?: string;
  username: string;
  password?: string;
  name: string;
  surname?: string;
  role: 'admin' | 'roommate';
  color: string;
  occupation?: string;
  phone?: string;
  telegram?: string;
  instagram?: string;
  joinedAt: string;
}

interface CleaningTask {
  id: string;
  task: string;
  assignedTo: string;
  dayOfWeek: string;
  weekStart: string;
  done: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export default function CleaningPage() {
  const { userProfile } = useAuth();
  const [cleaning, setCleaning] = useState<CleaningTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [task, setTask] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const weekStart = getMonday(new Date());

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(doc => doc.data() as User));
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'cleaning'), where('weekStart', '==', weekStart));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CleaningTask));
        setCleaning(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load cleaning tasks:', error);
        toast.error('Failed to load tasks');
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [weekStart]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !dayOfWeek || !assignedTo) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'cleaning'), { task, assignedTo, dayOfWeek, weekStart, done: false });
      setTask('');
      setDayOfWeek('Monday');
      setAssignedTo('');
      toast.success('Cleaning task added successfully');
    } catch (error) {
      console.error('Failed to add cleaning task:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDone = async (item: CleaningTask) => {
    try {
      await updateDoc(doc(db, 'cleaning', item.id), { done: !item.done });
      toast.success(item.done ? 'Task reopened' : 'Task marked as done! ✓');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this cleaning task? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'cleaning', id));
      toast.success('Cleaning task removed');
    } catch (error) {
      console.error('Failed to delete cleaning task:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cleaning Schedule Card */}
        <div className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#0a0a0a] dark:text-gray-100">Cleaning Schedule</h2>
            <span className="text-sm text-[#6b7280] dark:text-gray-400">
              {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
              {new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : cleaning.length === 0 ? (
            <EmptyState
              emoji="🧹"
              title="No schedule set"
              description="Set up your cleaning rotation"
              action={userProfile?.role === 'admin' ? {
                label: 'Create Schedule',
                onClick: () => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' }),
              } : undefined}
            />
          ) : (
            <div className="space-y-0">
              {cleaning.map((item, i) => {
                const assignedUser = users.find((u) => u.username === item.assignedTo);
                const isLast = i === cleaning.length - 1;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className={`flex items-center justify-between py-4 ${item.done ? 'opacity-60' : ''} ${
                      !isLast ? 'border-b border-[#f3f4f6] dark:border-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AnimatePresence mode="wait">
                        {item.done ? (
                          <motion.div
                            key={`done-${item.id}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
                          >
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        ) : (
                          <div className="w-5 h-5 flex-shrink-0"></div>
                        )}
                      </AnimatePresence>
                      <span
                        className={`font-medium ${
                          item.done
                            ? 'line-through text-[#6b7280] dark:text-gray-500'
                            : 'text-[#0a0a0a] dark:text-gray-100'
                        }`}
                      >
                        {item.task}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                          style={{ background: assignedUser?.color || '#1D9E75' }}
                        >
                          {assignedUser?.name?.[0]?.toUpperCase() || assignedUser?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                        <span className="text-sm text-[#6b7280] dark:text-gray-400">
                          {assignedUser?.name || item.assignedTo}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-[#0a0a0a] dark:text-gray-100 text-xs font-medium">
                        {item.dayOfWeek}
                      </span>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleDone(item)}
                          className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75] focus:ring-offset-0 cursor-pointer transition"
                        />
                      </label>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Delete cleaning task"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Add Task Form */}
        {userProfile?.role === 'admin' && (
          <div className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-[#0a0a0a] dark:text-gray-100">Add cleaning task</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Task name</label>
                <input
                  type="text"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Day</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                    required
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Assign to</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select</option>
                    {users.map((u) => (
                      <option key={u.username} value={u.username}>
                        {u.name || u.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting && <Spinner />}
                Add Task
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
