'use client';
import { useI18n } from '../../context/I18nContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, limit as fsLimit, query } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [hasExistingUsers, setHasExistingUsers] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        router.replace('/dashboard');
      }
      setTimeout(() => setPageReady(true), 50);
      getDocs(query(collection(db, 'users'), fsLimit(1)))
        .then(snap => { if (!snap.empty) setHasExistingUsers(true); })
        .catch(() => {});
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSetupMode && hasExistingUsers) {
        setError('Admin already exists. Please sign in.');
        return;
      }
      if (isSetupMode) {
        const userCred = await createUserWithEmailAndPassword(auth, username, password);
        const newUserData = {
          username,
          name: 'Admin',
          role: 'admin',
          color: 'Blue',
          joinedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', userCred.user.uid), newUserData);
        router.push('/dashboard');
        return;
      }
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        setError('User profile not found');
        return;
      }
      router.push('/dashboard');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message || 'An error occurred');
    }
  };

  const bullets = [
    'Track rent and shared expenses',
    'Rotating cleaning schedules',
    'Live USD/UZS exchange rates',
  ];

  return (
    <div
      className={`min-h-screen flex transition-opacity duration-500 ${
        pageReady ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'white' }}
    >
      {/* Left — branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col items-center justify-between w-1/2 px-16 py-12 bg-[#f9fafb] dark:bg-gray-900">
        <div></div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-left max-w-md"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-[#F97316]"></span>
            <h1 className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100">FlatMate</h1>
          </div>
          <p className="text-lg text-[#6b7280] dark:text-gray-400 mb-8">Manage your apartment together.</p>
          <div className="space-y-3">
            {bullets.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#F97316]/10 dark:bg-[#F97316]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-[#F97316]" />
                </div>
                <span className="text-sm text-[#6b7280] dark:text-gray-400">{b}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <div className="text-xs text-gray-400 dark:text-gray-500">© 2026 FlatMate · Tashkent 🇺🇿</div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center w-full lg:w-1/2 px-6 py-12 bg-white dark:bg-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="w-3 h-3 rounded-full bg-[#F97316]"></span>
            <span className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100">FlatMate</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0a0a0a] dark:text-gray-100 mb-2">Welcome back</h2>
            <p className="text-sm text-[#6b7280] dark:text-gray-400 mb-8">Sign in with your credentials</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g., admin@flatmate.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#6b7280] dark:text-gray-400 mb-2">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 pr-12 text-[#0a0a0a] dark:text-gray-100 focus:ring-2 focus:ring-[#F97316] focus:border-transparent outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-gray-400 hover:text-[#0a0a0a] dark:hover:text-gray-100 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#0a0a0a] dark:bg-gray-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition"
              >
                {isSetupMode ? "Create Admin Account" : "Sign in"}
              </button>
              {error && <div className="text-red-500 dark:text-red-400 text-sm text-center mt-2">{error}</div>}
              <button
                type="button"
                onClick={() => setIsSetupMode(!isSetupMode)}
                className="mt-4 text-xs text-gray-500 hover:text-white transition-colors"
              >
                Developer? {isSetupMode ? "Back to Login" : "Initialize First Admin"}
              </button>
            </form>
            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
              Credentials are provided by your admin
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
