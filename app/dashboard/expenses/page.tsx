'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { Trash2, Repeat, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Spinner } from '../../components/Spinner';
import { SkeletonList } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';

interface Expense {
  id: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string;
  note?: string;
  isRecurring?: boolean;
  recurrencePattern?: 'monthly' | 'weekly' | 'yearly';
  recurrenceEndDate?: string;
  parentExpenseId?: string;
}

interface RecurringExpense {
  id: string;
  amount: number;
  category: string;
  paidBy: string;
  startDate: string;
  endDate?: string;
  pattern: 'monthly' | 'weekly' | 'yearly';
  note?: string;
  createdAt: string;
  nextDueDate: string;
}

const CATEGORIES = [
  { name: 'Rent', color: 'bg-[#1D9E75]' },
  { name: 'Groceries', color: 'bg-blue-500' },
  { name: 'Utilities', color: 'bg-[#f59e0b]' },
  { name: 'Internet', color: 'bg-purple-500' },
  { name: 'Misc', color: 'bg-gray-400' },
];

function getCategoryColor(category: string) {
  return CATEGORIES.find(c => c.name === category)?.color || 'bg-gray-400';
}

function getMonth(date: string) {
  return date.slice(0, 7);
}

// Generate next occurrence dates based on pattern
function generateRecurringDates(startDate: string, pattern: 'monthly' | 'weekly' | 'yearly', endDate?: string, limit: number = 24): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start.getFullYear() + 2, 11, 31);

  const current = new Date(start);

  while (current <= end && dates.length < limit) {
    dates.push(current.toISOString().slice(0, 10));

    if (pattern === 'monthly') {
      current.setMonth(current.getMonth() + 1);
    } else if (pattern === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (pattern === 'yearly') {
      current.setFullYear(current.getFullYear() + 1);
    }
  }

  return dates;
}

export default function ExpensesPage() {
  const { userProfile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });

  // Recurring expense state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [showRecurringSection, setShowRecurringSection] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        setExpenses(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load expenses:', error);
        toast.error('Failed to load expenses');
        setLoading(false);
      }
    );
    
    // Load recurring expenses
    loadRecurringExpenses();
    
    return () => unsubscribe();
  }, []);

  const loadRecurringExpenses = async () => {
    try {
      const q = query(collection(db, 'recurringExpenses'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setRecurringExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringExpense)));
    } catch (error) {
      console.error('Failed to load recurring expenses:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;
    setSubmitting(true);
    try {
      if (isRecurring) {
        const recurringData = {
          amount: Number(amount),
          category,
          paidBy: userProfile?.username || '',
          startDate: date,
          endDate: recurrenceEndDate || null,
          pattern: recurrencePattern,
          note,
          createdAt: new Date().toISOString(),
          nextDueDate: date,
        };
        
        const recurringRef = await addDoc(collection(db, 'recurringExpenses'), recurringData);
        
        const dates = generateRecurringDates(date, recurrencePattern, recurrenceEndDate || undefined);
        const batchPromises = dates.map(d => 
          addDoc(collection(db, 'expenses'), {
            amount: Number(amount),
            category,
            paidBy: userProfile?.username || '',
            date: d,
            note: note ? `${note} (Recurring)` : 'Recurring expense',
            isRecurring: true,
            recurrencePattern,
            recurrenceEndDate: recurrenceEndDate || null,
            parentExpenseId: recurringRef.id,
          })
        );
        
        await Promise.all(batchPromises);
        toast.success(`Recurring ${recurrencePattern} expense created with ${dates.length} instances`);
        
        setIsRecurring(false);
        setRecurrenceEndDate('');
        loadRecurringExpenses();
      } else {
        await addDoc(collection(db, 'expenses'), {
          amount: Number(amount),
          category,
          paidBy: userProfile?.username || '',
          date,
          note,
          isRecurring: false,
        });
        toast.success('Expense added successfully');
      }
      
      setAmount('');
      setCategory('Rent');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
    } catch (error) {
      console.error('Failed to add expense:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    if (!window.confirm('Delete this recurring expense and all its future instances?')) return;
    
    try {
      // Delete the recurring template
      await deleteDoc(doc(db, 'recurringExpenses', id));
      
      // Delete all related expenses from today onwards
      const today = new Date().toISOString().slice(0, 10);
      const relatedExpenses = expenses.filter(e => e.parentExpenseId === id && e.date >= today);
      
      await Promise.all(relatedExpenses.map(e => deleteDoc(doc(db, 'expenses', e.id))));
      
      toast.success('Recurring expense deleted');
      loadRecurringExpenses();
    } catch (error) {
      console.error('Failed to delete recurring expense:', error);
      toast.error('Failed to delete recurring expense');
    }
  };

  const filtered = expenses
    .filter(e => getMonth(e.date) === selectedMonth)
    .filter(e => filter === 'All' || e.category === filter);
  
  const isAdmin = userProfile?.role === 'admin';

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      toast.success('Deleted successfully');
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete');
    }
  };

  const summary = CATEGORIES.map(cat => {
    const total = expenses
      .filter(e => e.category === cat.name && getMonth(e.date) === selectedMonth)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { ...cat, total };
  });
  const maxTotal = Math.max(...summary.map(s => s.total), 1);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Summary Card */}
        <div className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-[#0a0a0a] dark:text-gray-100">{selectedMonth}</h3>
          <div className="space-y-3">
            {summary.map((cat) => (
              <div key={cat.name} className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${cat.color}`}>
                  {cat.name}
                </span>
                <div className="flex-1 bg-[#f3f4f6] dark:bg-gray-700 rounded-md h-5 relative overflow-hidden">
                  <div
                    className={`${cat.name === 'Rent' ? 'bg-[#1D9E75]' : cat.color} h-5 rounded-md transition-all duration-500`}
                    style={{ width: `${(cat.total / maxTotal) * 100}%`, minWidth: cat.total ? 24 : 2 }}
                  ></div>
                </div>
                <span className="ml-2 text-[#0a0a0a] dark:text-gray-100 font-semibold min-w-[100px] text-right text-sm">
                  {cat.total.toLocaleString()} UZS
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-[#0a0a0a] dark:text-gray-100">Add expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Amount (UZS)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={100}
                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                placeholder="Optional"
              />
              <div className="text-right text-xs text-gray-400 mt-1">{note.length}/100</div>
            </div>
          </div>
          
          {/* Recurring Toggle */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRecurring
                  ? 'bg-[#1D9E75]/20 text-[#1D9E75] border border-[#1D9E75]/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-[#6b7280] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Repeat className="w-4 h-4" />
              {isRecurring ? 'Recurring Enabled' : 'Make Recurring'}
            </button>
          </div>
          
          {/* Recurring Options */}
          {isRecurring && (
            <div className="mt-4 p-4 bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-lg animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Repeat Pattern</label>
                  <select
                    value={recurrencePattern}
                    onChange={(e) => setRecurrencePattern(e.target.value as 'monthly' | 'weekly' | 'yearly')}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                  >
                    <option value="monthly">Monthly (e.g., Rent)</option>
                    <option value="weekly">Weekly (e.g., Groceries)</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">
                    End Date (Optional)
                    <span className="text-xs text-gray-400 ml-1">- Leave empty for no end</span>
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={date}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <p className="mt-3 text-sm text-[#1D9E75]">
                <RefreshCw className="w-3 h-3 inline mr-1" />
                This will create {recurrenceEndDate 
                  ? generateRecurringDates(date, recurrencePattern, recurrenceEndDate).length 
                  : 'multiple'} expense entries automatically
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {submitting && <Spinner />}
            {isRecurring ? `Create Recurring ${recurrencePattern} Expense` : 'Add Expense'}
          </button>
        </form>

        {/* Recurring Expenses Section */}
        {recurringExpenses.length > 0 && (
          <div className="bg-[#1a1d27] border border-white/5 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowRecurringSection(!showRecurringSection)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Repeat className="w-5 h-5 text-[#1D9E75]" />
                <h3 className="text-lg font-semibold text-white">Recurring Expenses</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-400 text-xs">
                  {recurringExpenses.length}
                </span>
              </div>
              {showRecurringSection ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {showRecurringSection && (
              <div className="border-t border-white/5">
                {recurringExpenses.map((rec) => (
                  <div
                    key={rec.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${getCategoryColor(rec.category)}`}>
                        {rec.category}
                      </span>
                      <div>
                        <p className="text-white font-medium">
                          {rec.amount.toLocaleString()} UZS
                          <span className="text-sm text-gray-400 ml-2">
                            ({rec.pattern})
                          </span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Started {rec.startDate}
                          {rec.endDate && ` • Ends ${rec.endDate}`}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => deleteRecurringExpense(rec.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Delete recurring expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transactions Card */}
        <div className="bg-white dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#0a0a0a] dark:text-gray-100">Transactions</h3>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition ${
                filter === 'All'
                  ? 'bg-[#1D9E75] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-[#6b7280] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setFilter('All')}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition ${
                  filter === cat.name
                    ? cat.color + ' text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-[#6b7280] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => setFilter(cat.name)}
              >
                {cat.name}
              </button>
            ))}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="ml-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent outline-none"
            />
          </div>

          {/* Transaction List */}
          <div className="space-y-0">
            {loading ? (
              <SkeletonList rows={4} />
            ) : filtered.length === 0 ? (
              <EmptyState
                emoji="📊"
                title="No expenses yet"
                description="Split your first cost with your flatmates"
                action={{
                  label: 'Add Expense',
                  onClick: () => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' }),
                }}
              />
            ) : (
              filtered.map((e, i) => {
                const isLast = i === filtered.length - 1;
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className={`flex items-center justify-between py-4 ${
                      !isLast ? 'border-b border-[#f3f4f6] dark:border-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-[#6b7280] dark:text-gray-400 min-w-[80px]">{e.date}</div>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${getCategoryColor(e.category)}`}>
                        {e.category}
                      </span>
{e.isRecurring && (
                      <Repeat className="w-3 h-3 text-[#1D9E75]" />
                    )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-semibold text-[#0a0a0a] dark:text-gray-100">
                        {Number(e.amount).toLocaleString()} UZS
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-xs font-semibold">
                          {e.paidBy?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="text-sm text-[#6b7280] dark:text-gray-400">{e.note || ''}</div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Delete expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
