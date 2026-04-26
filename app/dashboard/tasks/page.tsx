'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { CheckSquare, Trash2 } from 'lucide-react';
import { Spinner } from '../../components/Spinner';
import { SkeletonList } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { toast } from 'sonner';
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

interface Task {
  id: string;
  text: string;
  done: boolean;
  assignedTo: string;
  dueDate: string;
  createdBy: string;
}

function getBadgeLabel(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  if (due > today) return 'Upcoming';
  if (due.getTime() === today.getTime()) return 'Today';
  return 'Overdue';
}

export default function TasksPage() {
  const { userProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('dueDate'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load tasks:', error);
        toast.error('Failed to load tasks');
        setLoading(false);
      }
    );
    
    fetchUsers();
    
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !dueDate || !assignedTo) return;
    setAdding(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        text,
        done: false,
        assignedTo,
        dueDate,
        createdBy: userProfile?.username || '',
      });
      setText('');
      setDueDate('');
      setAssignedTo('');
      toast.success('Task added successfully');
    } catch (error) {
      console.error('Failed to add task:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const toggleDone = async (task: Task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { done: !task.done });
      toast.success(task.done ? 'Task reopened' : 'Task marked complete! 🎉');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Add Task Form */}
        <div className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-[#0a0a0a] dark:text-gray-100">New task</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Task</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                required
              />
              <div className="text-right text-xs text-gray-400 mt-1">{text.length}/200</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                  required
                />
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
              disabled={adding}
              className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {adding && <Spinner />}
              Add Task
            </button>
          </form>
        </div>

        {/* Task List */}
        <div className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-gray-100">Tasks</h3>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[#6b7280] dark:text-gray-300 text-xs font-medium">
              {tasks.length}
            </span>
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : tasks.length === 0 ? (
            <EmptyState
              emoji="✅"
              title="All clear!"
              description="No tasks right now. Enjoy the peace."
              action={{
                label: 'Add Task',
                onClick: () => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' }),
              }}
            />
          ) : (
            <div className="space-y-0">
              {tasks.map((task, i) => {
                const isLast = i === tasks.length - 1;
                const badgeType = getBadgeLabel(task.dueDate);
                let badgeClass = '';
                if (task.done) {
                  badgeClass = 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-900 dark:text-gray-500 dark:border-gray-700';
                } else if (badgeType === 'Upcoming') {
                  badgeClass = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
                } else if (badgeType === 'Today') {
                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
                } else if (badgeType === 'Overdue') {
                  badgeClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
                }

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className={`flex items-center gap-3 py-3 ${
                      !isLast ? 'border-b border-[#f3f4f6] dark:border-gray-700' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleDone(task)}
                      className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all duration-150 flex-shrink-0 ${
                        task.done
                          ? 'bg-[#1D9E75] border-[#1D9E75]'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#1D9E75]'
                      }`}
                      aria-label="Toggle done"
                    >
                      <AnimatePresence mode="wait">
                        {task.done && (
                          <motion.svg
                            key={`check-${task.id}`}
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }}
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm ${
                          task.done
                            ? 'line-through text-gray-400 dark:text-gray-500'
                            : 'text-[#0a0a0a] dark:text-gray-100'
                        }`}
                      >
                        {task.text}
                      </div>
                      <div className="text-xs text-[#6b7280] dark:text-gray-400 mt-0.5">
                        {users.find((u) => u.username === task.assignedTo)?.name || task.assignedTo}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${badgeClass}`}>
                      {badgeType}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
