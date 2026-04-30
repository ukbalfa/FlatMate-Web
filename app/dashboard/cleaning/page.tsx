'use client';
import { useI18n } from '../../../context/I18nContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'sonner';
import ConfirmModal from '../../components/ConfirmModal';
import { Trash2 } from 'lucide-react';
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
  const { t } = useI18n();
  const { createNotification } = useNotifications();
  const { userProfile } = useAuth();
  const [cleaning, setCleaning] = useState<CleaningTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [task, setTask] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: (() => void) | null, message: string}>({isOpen: false, action: null, message: ''});
  const weekStart = getMonday(new Date());

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      } catch (error) {
        console.error('Failed to load users:', error);
        toast.error('Failed to load users');
      }
    };
    loadUsers();
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
    try {
      await addDoc(collection(db, 'cleaning'), { task, assignedTo, dayOfWeek, weekStart, done: false });
      setTask('');
      setDayOfWeek('Monday');
      setAssignedTo('');
      toast.success('Cleaning task added');
      const assignedSnap = await getDocs(query(collection(db, 'users'), where('username', '==', assignedTo)));
      if (!assignedSnap.empty) {
        const assignedDoc = assignedSnap.docs[0];
        if (assignedDoc.id !== userProfile?.uid) {
          await createNotification({
            userId: assignedDoc.id,
            title: 'Cleaning task assigned',
            message: `"${task}" — ${dayOfWeek}`,
            type: 'cleaning',
            read: false,
            link: '/dashboard/cleaning',
          });
        }
      }
  
    } catch (error) {
      console.error('Failed to add cleaning task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add cleaning task');
    }
  };

  const toggleDone = async (item: CleaningTask) => {
    try {
      await updateDoc(doc(db, 'cleaning', item.id), { done: !item.done });
      toast.success('Task marked done');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update');
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteDoc(doc(db, 'cleaning', id));
      toast.success('Deleted successfully');
    } catch (error) {
      console.error('Failed to delete cleaning task:', error);
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="min-h-screen">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={t('common.confirm') || 'Confirm'}
        message={confirmModal.message}
        confirmLabel={t('common.delete') || 'Delete'}
        onConfirm={() => confirmModal.action?.()}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cleaning Schedule Card */}
        <div className="bg-[#1a1d27] border border-white/[0.06] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{t('cleaning.title')}</h2>
            <span className="text-sm text-gray-400">
              {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
              {new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-4 border-b border-white/[0.05] animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : cleaning.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No cleaning tasks for this week.</div>
          ) : (
            <div className="space-y-0">
              {cleaning.map((item, i) => {
                const assignedUser = users.find((u) => u.username === item.assignedTo);
                const isLast = i === cleaning.length - 1;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between py-4 ${item.done ? 'opacity-60' : ''} ${
                      !isLast ? 'border-b border-white/[0.05]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.done ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 flex-shrink-0"></div>
                      )}
                      <span
                        className={`font-medium ${
                          item.done
                            ? 'line-through text-[#6b7280] dark:text-gray-500'
                            : 'text-white'
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
                        <span className="text-sm text-gray-400">
                          {assignedUser?.name || item.assignedTo}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-white/[0.08] text-white text-xs font-medium">
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Add Task Form */}
        {userProfile?.role === 'admin' && (
          <div className="bg-[#1a1d27] border border-white/[0.06] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Add cleaning task</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Task name</label>
                <input
                  type="text"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Day</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                    required
                  >
                    {DAYS.map((day) => (
                      <option className="bg-[#1a1d27]" key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('tasks.assignTo')}</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 text-white border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                    required
                  >
                    <option className="bg-[#1a1d27]" value="">Select</option>
                    {users.map((u) => (
                      <option className="bg-[#1a1d27]" key={u.username} value={u.username}>
                        {u.name || u.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition"
              >
                Add Task
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
