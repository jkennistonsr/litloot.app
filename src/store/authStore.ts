import { create } from 'zustand';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize listener
  onAuthStateChanged(auth, (user) => {
    set({ user, loading: false });
  });

  return {
    user: null,
    loading: true,
    logout: async () => {
      await signOut(auth);
    },
  };
});
