'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { Pin, Trash2, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../../components/ConfirmModal';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  pinned: boolean;
  color: 'teal' | 'amber' | 'red' | 'blue';
}

const colorClasses = {
  teal: 'border-[#1D9E75]',
  amber: 'border-amber-400',
  red: 'border-red-400',
  blue: 'border-blue-400'
};

const bgColors = {
  teal: 'bg-[#1D9E75]',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  blue: 'bg-blue-400'
};

export default function AnnouncementsPage() {
  const { userProfile } = useAuth();
  const { t } = useI18n();
  const { createNotification } = useNotifications();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: (() => void) | null, message: string}>({isOpen: false, action: null, message: ''});

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<'teal' | 'amber' | 'red' | 'blue'>('teal');
  const [pinned, setPinned] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      // Sort pinned first
      const sorted = [...data].sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
      });
      setAnnouncements(sorted);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    try {
      const newDoc = {
        title,
        content,
        color,
        pinned,
        createdBy: userProfile?.username || 'admin',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'announcements'), newDoc);
      toast.success('Announcement posted');

      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.docs.forEach(async (userDoc) => {
        if (userDoc.id !== userProfile?.uid) {
          await createNotification({
            userId: userDoc.id,
            title: title,
            message: content.substring(0, 100),
            type: 'system',
            read: false,
            link: '/dashboard/announcements',
          });
        }
      });

      setTitle('');
      setContent('');
      setColor('teal');
      setPinned(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to post announcement');
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await updateDoc(doc(db, 'announcements', id), { pinned: !currentPinned });
    } catch (error) {
      console.error(error);
      toast.error('Failed to update announcement');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      message: 'Are you sure you want to delete this announcement?',
      action: async () => {
        try {
          await deleteDoc(doc(db, 'announcements', id));
          toast.success('Announcement deleted');
        } catch (error) {
          console.error(error);
          toast.error('Failed to delete announcement');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
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
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#1a1d27] border border-white/[0.06] rounded-xl p-5 h-32 animate-pulse"></div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1d27] border border-white/[0.06] rounded-xl">
            <Megaphone className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">{t('announcements.noAnnouncements')}</h3>
            <p className="text-gray-400">
              {isAdmin ? 'Use the form below to post the first announcement.' : 'Check back later for updates.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {announcements.map((a) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-[#1a1d27] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden border-l-4 ${colorClasses[a.color]}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{a.title}</h3>
                      {a.pinned && (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                          <Pin className="w-3 h-3" />
                          {t('announcements.pinned')}
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity absolute top-4 right-4">
                        <button
                          onClick={() => handleTogglePin(a.id, a.pinned)}
                          className={`p-1.5 rounded-lg transition-colors ${a.pinned ? 'text-[#1D9E75] bg-[#1D9E75]/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                          title="Toggle pin"
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-300 whitespace-pre-wrap mb-4 text-sm">{a.content}</p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="font-medium text-gray-400">{a.createdBy}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(a.createdAt)}</span>
                  </div>
                  
                  {/* For mobile where hover doesn't work well */}
                  {isAdmin && (
                    <div className="flex lg:hidden items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                      <button
                        onClick={() => handleTogglePin(a.id, a.pinned)}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${a.pinned ? 'text-[#1D9E75]' : 'text-gray-400'}`}
                      >
                        <Pin className="w-4 h-4" />
                        {a.pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {isAdmin && (
          <div className="bg-[#1a1d27] border border-white/[0.06] rounded-xl p-6 mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">{t('announcements.addAnnouncement')}</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-[#1D9E75] outline-none"
                />
              </div>
              
              <div>
                <textarea
                  placeholder="What do you want to announce?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-[#1D9E75] outline-none resize-none"
                />
                <div className="text-right mt-1">
                  <span className={`text-xs ${content.length >= 500 ? 'text-red-400' : 'text-gray-500'}`}>
                    {content.length} / 500
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {(['teal', 'amber', 'red', 'blue'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform ${bgColors[c]} ${color === c ? 'scale-125 ring-2 ring-white/50 ring-offset-2 ring-offset-[#1a1d27]' : 'hover:scale-110 opacity-70'}`}
                        title={c}
                      />
                    ))}
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer group ml-2">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${pinned ? 'bg-[#1D9E75] border-[#1D9E75]' : 'border-white/20 group-hover:border-white/40 bg-white/5'}`}>
                      {pinned && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                    />
                    <span className="text-sm text-gray-300 select-none">Pin to top</span>
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={!title || !content}
                  className="bg-[#1D9E75] text-white px-5 py-2.5 rounded-lg hover:bg-[#188a65] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Megaphone className="w-4 h-4" />
                  Post
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
