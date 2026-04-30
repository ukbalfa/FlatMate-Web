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
  Timestamp,
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
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userProfile?.uid) {
      // eslint-disable-next-line
      setNotifications([]);
      return;
    }

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
        setNotifications(data);
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
    const unreadNotifications = notifications.filter((n) => !n.read);
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
      await Promise.all(
        notifications.map((n) => deleteDoc(doc(db, 'notifications', n.id)))
      );
      // eslint-disable-next-line
      setNotifications([]);
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
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
