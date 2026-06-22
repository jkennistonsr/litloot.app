import { create } from "zustand";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { useAuthStore } from "./authStore";
import { Product } from "../types";

interface RecentlyViewedStore {
  items: Product[];
  loading: boolean;
  addRecentlyViewed: (product: Product) => Promise<void>;
  initialize: () => void;
  unsubscribe: (() => void) | null;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>(
  (set, get) => ({
    items: [],
    loading: true,
    unsubscribe: null,

    initialize: () => {
      const user = useAuthStore.getState().user;
      const unsubs = get().unsubscribe;
      if (unsubs) unsubs();

      if (!user) {
        set({ items: [], loading: false, unsubscribe: null });
        return;
      }

      set({ loading: true });

      const recentQuery = query(
        collection(db, `users/${user.uid}/recentlyViewed`),
        orderBy("viewedAt", "desc"),
        limit(10),
      );

      const unsubscribe = onSnapshot(
        recentQuery,
        (snapshot) => {
          const items = snapshot.docs.map((doc) => doc.data() as Product);
          set({ items, loading: false });
        },
        (error) => {
          console.error("Error fetching recently viewed:", error);
          set({ loading: false });
        },
      );

      set({ unsubscribe });
    },

    addRecentlyViewed: async (product: Product) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        const cleanProduct = Object.fromEntries(
          Object.entries(product).filter(([_, v]) => v !== undefined),
        );

        const ref = doc(db, `users/${user.uid}/recentlyViewed/${product.id}`);
        await setDoc(ref, {
          ...cleanProduct,
          viewedAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Failed to add recently viewed", e);
      }
    },
  }),
);
