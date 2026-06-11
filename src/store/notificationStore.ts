import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, onSnapshot, updateDoc, deleteDoc, writeBatch, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: any;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  isNotifOpen: boolean;
  isInitialized: boolean;

  setIsNotifOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  
  initNotificationListener: () => () => void;
  unreadCount: () => number;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'success',
    message: 'Purchase successful. Your item is on the way.',
    timestamp: Date.now() - 3600000,
    read: false,
  },
  {
    id: 'notif-2',
    type: 'info',
    message: 'New items have been added to the marketplace.',
    timestamp: Date.now() - 7200000,
    read: false,
  },
  {
    id: 'notif-3',
    type: 'warning',
    message: 'Connection unstable. Check your network.',
    timestamp: Date.now() - 86400000,
    read: true,
  }
];

export const useNotificationStore = create<NotificationState>((set, get) => {
  return {
    notifications: [],
    isNotifOpen: false,
    isInitialized: false,

    setIsNotifOpen: (open) => set({ isNotifOpen: open }),
    unreadCount: () => get().notifications.filter(n => !n.read).length,

    initNotificationListener: () => {
      const { user } = useAuthStore.getState();
      let unsubscribe = () => {};

      if (!user) {
        const saved = localStorage.getItem('litloot_notifications');
        set({ 
          notifications: saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS,
          isInitialized: true 
        });
        return unsubscribe;
      }

      try {
        const notifRef = collection(db, 'users', user.uid, 'notifications');
        const q = query(notifRef, orderBy('timestamp', 'desc'), limit(50));
        
        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const items = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                ...data,
                id: doc.id,
                timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now())
              } as Notification;
            });
            
            const wasEmptyAndUninitialized = !get().isInitialized && items.length === 0;

            set({ notifications: items, isInitialized: true });
            
            if (wasEmptyAndUninitialized) {
              setTimeout(() => {
                 get().addNotification({
                   message: 'Login successful. Welcome back to LITLOOT.',
                   type: 'info'
                 });
              }, 1000);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}/notifications`);
          }
        );
      } catch (error) {
        console.error('Failed to initialize notification listener:', error);
      }

      return unsubscribe;
    },

    addNotification: async (notification) => {
      const user = useAuthStore.getState().user;
      if (user) {
        const itemPath = `users/${user.uid}/notifications`;
        try {
          const notifRef = collection(db, itemPath);
          await addDoc(notifRef, {
            ...notification,
            timestamp: serverTimestamp(),
            read: false
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, itemPath);
        }
      } else {
        const newNotif: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };
        set((state) => {
          const updated = [newNotif, ...state.notifications];
          localStorage.setItem('litloot_notifications', JSON.stringify(updated));
          return { notifications: updated };
        });
      }
    },

    markAsRead: async (id) => {
      const user = useAuthStore.getState().user;
      if (user) {
        const itemPath = `users/${user.uid}/notifications/${id}`;
        try {
          const notifRef = doc(db, itemPath);
          await updateDoc(notifRef, { read: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, itemPath);
        }
      } else {
        set((state) => {
          const updated = state.notifications.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          );
          localStorage.setItem('litloot_notifications', JSON.stringify(updated));
          return { notifications: updated };
        });
      }
    },

    markAllAsRead: async () => {
      const user = useAuthStore.getState().user;
      const { notifications } = get();
      if (user) {
        const basePath = `users/${user.uid}/notifications`;
        try {
          const batch = writeBatch(db);
          notifications.filter(n => !n.read).forEach(notif => {
            batch.update(doc(db, basePath, notif.id), { read: true });
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, basePath);
        }
      } else {
        set((state) => {
          const updated = state.notifications.map(notif => ({ ...notif, read: true }));
          localStorage.setItem('litloot_notifications', JSON.stringify(updated));
          return { notifications: updated };
        });
      }
    },

    clearNotifications: async () => {
      const user = useAuthStore.getState().user;
      const { notifications } = get();
      if (user) {
        const basePath = `users/${user.uid}/notifications`;
        try {
          const batch = writeBatch(db);
          notifications.forEach(notif => {
            batch.delete(doc(db, basePath, notif.id));
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, basePath);
        }
      } else {
        set({ notifications: [] });
        localStorage.setItem('litloot_notifications', JSON.stringify([]));
      }
    }
  };
});

// Watch for auth changes
useAuthStore.subscribe((state, prevState) => {
  if (state.user?.uid !== prevState.user?.uid) {
    useNotificationStore.getState().initNotificationListener();
  }
});
