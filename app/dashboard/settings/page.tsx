'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
} from 'firebase/auth';
import { toast } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import {
  User,
  Lock,
  Bell,
  Save,
  Eye,
  EyeOff,
  Mail,
  CheckCircle,
} from 'lucide-react';
import { Spinner } from '../../components/Spinner';
import { Skeleton } from '../../components/Skeleton';

interface UserProfile {
  uid: string;
  username: string;
  name?: string;
  surname?: string;
  role?: 'admin' | 'roommate';
  color?: string;
  occupation?: string;
  phone?: string;
  telegram?: string;
  instagram?: string;
  joinedAt?: string;
  emailVerified?: boolean;
  notifications?: Record<string, boolean>;
}

const COLORS = [
  { name: 'settings.color.blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'settings.color.amber', value: 'amber', class: 'bg-amber-400' },
  { name: 'settings.color.purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'settings.color.teal', value: 'teal', class: 'bg-[#F97316]' },
  { name: 'settings.color.rose', value: 'rose', class: 'bg-rose-500' },
];

const NOTIFICATION_PREFS = [
  { key: 'taskReminders', label: 'settings.notifications.taskReminders', description: 'settings.notifications.taskRemindersDesc' },
  { key: 'expenseAlerts', label: 'settings.notifications.newExpenses', description: 'settings.notifications.newExpensesDesc' },
  { key: 'cleaningReminders', label: 'settings.notifications.cleaningSchedule', description: 'settings.notifications.cleaningScheduleDesc' },
  { key: 'weeklySummary', label: 'settings.notifications.weeklySummary', description: 'settings.notifications.weeklySummaryDesc' },
];

export default function SettingsPage() {
  const { t } = useI18n();
  const { userProfile: contextProfile, user: firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  // Profile form
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    taskReminders: true,
    expenseAlerts: true,
    cleaningReminders: true,
    weeklySummary: false,
  });

  const loadUserProfile = useCallback(async () => {
    if (!contextProfile?.uid) return;
    try {
      const docRef = doc(db, 'users', contextProfile.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile({ ...data, uid: contextProfile.uid });
        setEditForm({
          name: data.name || '',
          surname: data.surname || '',
          occupation: data.occupation || '',
          phone: data.phone || '',
          telegram: data.telegram || '',
          instagram: data.instagram || '',
          color: data.color || 'blue',
        });
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error(t('settings.toast.profileLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [contextProfile?.uid, t]);

  useEffect(() => {
    if (contextProfile?.uid) {
      loadUserProfile();
    }
  }, [contextProfile?.uid, t, loadUserProfile]);

  const saveProfile = async () => {
    if (!contextProfile?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', contextProfile.uid), {
        ...editForm,
        updatedAt: new Date().toISOString(),
      });
      toast.success(t('settings.toast.profileUpdated'));
      loadUserProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('settings.toast.somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser?.email) {
      toast.error(t('settings.toast.notAuthenticated'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.toast.passwordsNoMatch'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('settings.toast.passwordTooShort'));
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      toast.success(t('settings.toast.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(t('settings.toast.passwordChangeFailed'));
    }
  };

  const sendVerificationEmail = async () => {
    if (!firebaseUser) return;
    try {
      await sendEmailVerification(firebaseUser);
      toast.success(t('settings.toast.verificationSent'));
    } catch (error) {
      console.error('Failed to send verification:', error);
      toast.error(t('settings.toast.verificationFailed'));
    }
  };

  const saveNotifications = async () => {
    if (!contextProfile?.uid) return;
    try {
      await updateDoc(doc(db, 'users', contextProfile.uid), {
        notifications,
        updatedAt: new Date().toISOString(),
      });
      toast.success(t('settings.toast.notificationsSaved'));
    } catch (error) {
      console.error('Failed to save notifications:', error);
      toast.error(t('settings.toast.somethingWrong'));
    }
  };

  const getColorClass = (color: string) => {
    return COLORS.find(c => c.value === color)?.class || 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{t('settings.page.title')}</h1>
          <p className="text-gray-400 mt-1">{t('settings.page.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-1">
          {[
            { id: 'profile', label: t('settings.tab.profile'), icon: User },
            { id: 'security', label: t('settings.tab.security'), icon: Lock },
            { id: 'notifications', label: t('settings.tab.notifications'), icon: Bell },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === id
                  ? 'text-white border-b-2 border-[#F97316] bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1d27] border border-white/5 rounded-xl p-6"
          >
            <div className="flex items-start gap-6 mb-8">
              {/* Avatar */}
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold ${getColorClass(
                  editForm.color || 'blue'
                )}`}
              >
                {(editForm.name?.[0] || profile?.name?.[0] || '?').toUpperCase()}
                {(editForm.surname?.[0] || profile?.surname?.[0] || '').toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">
                  {profile?.name} {profile?.surname}
                </h2>
                <p className="text-gray-400 text-sm">{profile?.username}</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${
                    profile?.role === 'admin'
                      ? 'bg-[#F97316]/20 text-[#F97316]'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {profile?.role === 'admin' && <CheckCircle className="w-3 h-3" />}
                  {profile?.role || t('settings.role.roommate')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('settings.profile.name')}</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('settings.profile.surname')}</label>
                <input
                  type="text"
                  value={editForm.surname || ''}
                  onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('settings.profile.occupation')}</label>
                <input
                  type="text"
                  value={editForm.occupation || ''}
                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('settings.profile.phone')}</label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('settings.profile.telegram')}</label>
                <input
                  type="text"
                  value={editForm.telegram || ''}
                  onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })}
                  placeholder={t('settings.profile.usernamePlaceholder')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('settings.profile.instagram')}</label>
                <input
                  type="text"
                  value={editForm.instagram || ''}
                  onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                  placeholder={t('settings.profile.usernamePlaceholder')}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-3">{t('settings.profile.color')}</label>
              <div className="flex gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setEditForm({ ...editForm, color: c.value })}
                    className={`w-10 h-10 rounded-full ${c.class} transition-all ${
                      editForm.color === c.value
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1d27] scale-110'
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                    title={t(c.name)}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex items-center gap-2 bg-[#F97316] text-white rounded-lg px-6 py-2.5 font-medium hover:bg-[#188a65] transition-colors disabled:opacity-50"
            >
              {saving && <Spinner />}
              <Save className="w-4 h-4" />
              {saving ? t('settings.profile.saving') : t('settings.profile.saveChanges')}
            </button>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Email Verification */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-[#F97316]" />
                <h3 className="text-lg font-semibold text-white">{t('settings.security.emailVerification')}</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300">{firebaseUser?.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {firebaseUser?.emailVerified
                      ? t('settings.security.emailVerified')
                      : t('settings.security.emailNotVerified')}
                  </p>
                </div>
                {!firebaseUser?.emailVerified && (
                  <button
                    onClick={sendVerificationEmail}
                    className="bg-white/10 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/15 transition"
                  >
                    {t('settings.security.verifyEmail')}
                  </button>
                )}
                {firebaseUser?.emailVerified && (
                  <span className="flex items-center gap-1 text-[#F97316] text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {t('settings.security.verified')}
                  </span>
                )}
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-[#1a1d27] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-[#F97316]" />
                <h3 className="text-lg font-semibold text-white">{t('settings.security.changePassword')}</h3>
              </div>
              <form onSubmit={changePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('settings.security.currentPassword')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('settings.security.newPassword')}</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('settings.security.confirmNewPassword')}</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#F97316] text-white rounded-lg px-6 py-2.5 font-medium hover:bg-[#188a65] transition-colors"
                >
                  {t('settings.security.changePasswordButton')}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1d27] border border-white/5 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-[#F97316]" />
              <h3 className="text-lg font-semibold text-white">{t('settings.notifications.title')}</h3>
            </div>
            <div className="space-y-4">
              {NOTIFICATION_PREFS.map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{t(label)}</p>
                    <p className="text-sm text-gray-500">{t(description)}</p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications({ ...notifications, [key]: !notifications[key] })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      notifications[key] ? 'bg-[#F97316]' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notifications[key] ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={saveNotifications}
              className="mt-6 flex items-center gap-2 bg-[#F97316] text-white rounded-lg px-6 py-2.5 font-medium hover:bg-[#188a65] transition-colors"
            >
              <Save className="w-4 h-4" />
              {t('settings.notifications.savePreferences')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
