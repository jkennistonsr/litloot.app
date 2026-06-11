import { create } from 'zustand';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuthStore } from './authStore';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  initThemeListener: () => () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  return {
    theme: (typeof window !== 'undefined' && localStorage.getItem('litloot-theme') as Theme) || 'dark', // futuristic default
    setTheme: async (newTheme: Theme) => {
      set({ theme: newTheme });
      localStorage.setItem('litloot-theme', newTheme);
      
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      if (newTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(newTheme);
      }

      const user = useAuthStore.getState().user;
      if (user) {
        const itemPath = `users/${user.uid}`;
        try {
          await setDoc(doc(db, itemPath), { 
            theme: newTheme,
            updatedAt: serverTimestamp() 
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, itemPath);
        }
      }
    },
    initThemeListener: () => {
      let unsubscribe = () => {};
      const { user } = useAuthStore.getState();
      
      // Initialize class on load
      const currentTheme = get().theme;
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      if (currentTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(currentTheme);
      }

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().theme) {
            const newTheme = docSnap.data().theme as Theme;
            set({ theme: newTheme });
            localStorage.setItem('litloot-theme', newTheme);
            
            root.classList.remove('light', 'dark');
            if (newTheme === 'system') {
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              root.classList.add(systemTheme);
            } else {
              root.classList.add(newTheme);
            }
          }
        });
      }
      return unsubscribe;
    }
  };
});

// Watch for auth changes to re-init theme listener
useAuthStore.subscribe((state, prevState) => {
  if (state.user?.uid !== prevState.user?.uid) {
    useThemeStore.getState().initThemeListener();
  }
});
