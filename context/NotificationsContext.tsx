'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'expense' | 'cleaning' | 'settlement' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
  data?: Record<string, unknown>;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearAll: async () => {},
  createNotification: async () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const [notificationsState, setNotificationsState] = useState<{
    uid: string | null;
    items: Notification[];
  }>({ uid: null, items: [] });

  useEffect(() => {
    if (!userProfile?.uid) {
      return;
    }

    const uid = userProfile.uid;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
        setNotificationsState({ uid, items: data });
      },
      (error) => {
        console.error('Failed to load notifications:', error);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = activeNotifications.filter((n) => !n.read);
    try {
      await Promise.all(
        unreadNotifications.map((n) =>
          updateDoc(doc(db, 'notifications', n.id), {
            read: true,
            readAt: serverTimestamp(),
          })
        )
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const clearAll = async () => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userProfile?.uid)
      );
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map((d) => deleteDoc(doc(db, 'notifications', d.id))));
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const createNotification = async (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  const activeNotifications =
    userProfile?.uid && userProfile.uid === notificationsState.uid
      ? notificationsState.items
      : [];
  const unreadCount = activeNotifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications: activeNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        createNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
