'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../../lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import { Spinner } from '../../components/Spinner';
import { SkeletonTable } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import {
  Wallet,
  ArrowRightLeft,
  CheckCircle,
  Plus,
  X,
  User,
  Minus,
  Calendar,
} from 'lucide-react';

interface User {
  id?: string;
  username: string;
  name: string;
  surname?: string;
  color?: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string;
  note?: string;
}

interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  note?: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export default function BalancesPage() {
  const { t } = useI18n();
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    from: '',
    to: '',
    amount: '',
    note: '',
  });
  const [submittingSettlement, setSubmittingSettlement] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load users
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(
        usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User))
      );

      // Load expenses for selected month
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('date', '>=', `${selectedMonth}-01`),
        where('date', '<=', `${selectedMonth}-31`)
      );
      const expensesSnap = await getDocs(expensesQuery);
      setExpenses(
        expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Expense))
      );

      // Load settlements
      const settlementsQuery = query(
        collection(db, 'settlements'),
        where('date', '>=', `${selectedMonth}-01`),
        where('date', '<=', `${selectedMonth}-31`)
      );
      const settlementsSnap = await getDocs(settlementsQuery);
      setSettlements(
        settlementsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Settlement))
      );
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error(t('balances.toast.noConnection'));
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementForm.from || !settlementForm.to || !settlementForm.amount) {
      toast.error(t('balances.toast.fillAllFields'));
      return;
    }
    if (settlementForm.from === settlementForm.to) {
      toast.error(t('balances.toast.cannotSettleSelf'));
      return;
    }
    setSubmittingSettlement(true);
    try {
      await addDoc(collection(db, 'settlements'), {
        from: settlementForm.from,
        to: settlementForm.to,
        amount: Number(settlementForm.amount),
        date: new Date().toISOString().slice(0, 10),
        note: settlementForm.note,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
      toast.success(t('balances.toast.paymentRecorded'));
      setShowSettlementModal(false);
      setSettlementForm({ from: '', to: '', amount: '', note: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create settlement:', error);
      toast.error(t('balances.toast.somethingWrong'));
    }
  };

  const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: () => void; message: string }>({ open: false, onConfirm: () => {}, message: '' });

  const deleteSettlement = async (id: string) => {
    setConfirmState({
      open: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'settlements', id));
          toast.success(t('balances.toast.settlementDeleted'));
          loadData();
        } catch (error) {
          console.error('Failed to delete settlement:', error);
          toast.error(t('balances.toast.deleteFailed'));
        }
      },
      message: t('balances.confirm.deleteSettlement')
    });
  };

  const balances = useMemo(() => {
    if (users.length === 0) return [];
    const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const sharePerPerson = totalExp / users.length;
    const userStats: Record<string, { paid: number; name: string }> = {};
    users.forEach((u) => {
      userStats[u.username] = { paid: 0, name: u.name || u.username };
    });
    expenses.forEach((e) => {
      if (userStats[e.paidBy]) {
        userStats[e.paidBy].paid += Number(e.amount) || 0;
      }
    });
    return Object.entries(userStats).map(([username, stats]) => ({
      user: username,
      name: stats.name,
      paid: stats.paid,
      owed: sharePerPerson,
      netBalance: stats.paid - sharePerPerson,
    }));
  }, [expenses, users]);

  const debts = useMemo(() => {
    const creditors = balances.filter((b) => b.netBalance > 0);
    const debtors = balances.filter((b) => b.netBalance < 0);
    const result: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
    debtors.forEach((debtor) => {
      let remainingDebt = Math.abs(debtor.netBalance);
      creditors.forEach((creditor) => {
        if (remainingDebt <= 0) return;
        const amount = Math.min(remainingDebt, creditor.netBalance);
        if (amount > 0.01) {
          result.push({
            from: debtor.user,
            fromName: debtor.name,
            to: creditor.user,
            toName: creditor.name,
            amount: Math.round(amount * 100) / 100,
          });
          remainingDebt -= amount;
        }
      });
    });
    return result;
  }, [balances]);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const isAdmin = userProfile?.role === 'admin';

  const getUserColor = (username: string) => {
    const user = users.find((u) => u.username === username);
    return user?.color || '#F97316';
  };

  const getUserName = (username: string) => {
    const user = users.find((u) => u.username === username);
    return user?.name || username;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('balances.page.title')}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {t('balances.page.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#1a1d27] border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-[#F97316] outline-none"
            />
            <button
              onClick={() => setShowSettlementModal(true)}
              className="flex items-center gap-2 bg-[#F97316] text-white rounded-lg px-4 py-2 font-medium hover:bg-[#188a65] transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('balances.recordPayment')}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-5 h-5 text-[#F97316]" />
              <span className="text-gray-400 text-sm">{t('balances.totalExpenses')}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {totalExpenses.toLocaleString()} UZS
            </p>
          </div>
          <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-blue-500" />
              <span className="text-gray-400 text-sm">{t('balances.sharePerPerson')}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {users.length > 0 ? Math.round(totalExpenses / users.length).toLocaleString() : '0'} UZS
            </p>
          </div>
          <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-500" />
              <span className="text-gray-400 text-sm">{t('balances.activeDebts')}</span>
            </div>
            <p className="text-2xl font-bold text-white">{debts.length}</p>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={4} />
        ) : (
          <>
            {/* Balances Table */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white">{t('balances.memberBalances')}</h2>
              </div>
              <div className="divide-y divide-white/5">
                {balances.map((balance) => (
                  <div
                    key={balance.user}
                    className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ background: getUserColor(balance.user) }}
                      >
                        {balance.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{balance.name}</p>
                        <p className="text-sm text-gray-500">
                          {t('balances.paid')}: {balance.paid.toLocaleString()} UZS
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-semibold ${
                          balance.netBalance > 0
                            ? 'text-green-400'
                            : balance.netBalance < 0
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {balance.netBalance > 0
                          ? `+${balance.netBalance.toLocaleString()}`
                          : balance.netBalance.toLocaleString()}{' '}
                        UZS
                      </p>
                      <p className="text-xs text-gray-500">
                        {balance.netBalance > 0
                          ? t('balances.shouldReceive')
                          : balance.netBalance < 0
                          ? t('balances.owes')
                          : t('balances.settled')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Who Owes Who */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white">{t('balances.whoOwesWhom')}</h2>
              </div>
              {debts.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle className="w-8 h-8" />}
                  title={t('balances.allSettled')}
                  description={t('balances.allSettledDesc')}
                />
              ) : (
                <div className="divide-y divide-white/5">
                  {debts.map((debt, index) => (
                    <motion.div
                      key={`${debt.from}-${debt.to}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{ background: getUserColor(debt.from) }}
                          >
                            {debt.fromName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{debt.fromName}</span>
                        </div>
                        <ArrowRightLeft className="w-4 h-4 text-gray-500" />
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{ background: getUserColor(debt.to) }}
                          >
                            {debt.toName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{debt.toName}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-amber-400">
                          {debt.amount.toLocaleString()} UZS
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Settlement History */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white">{t('balances.settlementHistory')}</h2>
              </div>
              {settlements.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    emoji="📝"
                    title={t('balances.noSettlements')}
                    description={t('balances.noSettlementsDesc')}
                  />
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {settlements
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((settlement) => (
                      <div
                        key={settlement.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              settlement.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {settlement.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-white">
                              <span className="font-medium">{getUserName(settlement.from)}</span>
                              {' paid '}
                              <span className="font-medium">{getUserName(settlement.to)}</span>
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(settlement.date).toLocaleDateString()}
                              {settlement.note && ` • ${settlement.note}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-semibold text-white">
                            {settlement.amount.toLocaleString()} UZS
                          </p>
                          {isAdmin && (
                            <button
                              onClick={() => deleteSettlement(settlement.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Settlement Modal */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1d27] border border-white/10 rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{t('balances.modal.recordSettlement')}</h3>
              <button
                onClick={() => setShowSettlementModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createSettlement} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('balances.modal.fromPayer')}</label>
                <select
                  value={settlementForm.from}
                  onChange={(e) =>
                    setSettlementForm({ ...settlementForm, from: e.target.value })
                  }
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-[#F97316] outline-none"
                >
                  <option value="" className="bg-[#1a1d27]">
                    {t('balances.modal.selectPayer')}
                  </option>
                  {users.map((u) => (
                    <option key={u.username} value={u.username} className="bg-[#1a1d27]">
                      {u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('balances.modal.toRecipient')}</label>
                <select
                  value={settlementForm.to}
                  onChange={(e) =>
                    setSettlementForm({ ...settlementForm, to: e.target.value })
                  }
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-[#F97316] outline-none"
                >
                  <option value="" className="bg-[#1a1d27]">
                    {t('balances.modal.selectRecipient')}
                  </option>
                  {users.map((u) => (
                    <option key={u.username} value={u.username} className="bg-[#1a1d27]">
                      {u.name || u.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('balances.modal.amount')}</label>
                <input
                  type="number"
                  value={settlementForm.amount}
                  onChange={(e) =>
                    setSettlementForm({ ...settlementForm, amount: e.target.value })
                  }
                  required
                  min="1"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-[#F97316] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('balances.modal.note')}</label>
                <input
                  type="text"
                  value={settlementForm.note}
                  onChange={(e) =>
                    setSettlementForm({ ...settlementForm, note: e.target.value })
                  }
                  placeholder={t('balances.modal.notePlaceholder')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettlementModal(false)}
                  className="flex-1 bg-white/10 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-white/15 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingSettlement}
                  className="flex-1 bg-[#F97316] text-white rounded-lg px-4 py-2.5 font-medium hover:bg-[#188a65] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {submittingSettlement && <Spinner />}
                  {t('balances.modal.recordPayment')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.open}
        title={t('balances.confirm')}
        message={confirmState.message}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState(prev => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
