import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  text: string;
  createdAt: any;
}

interface ReviewStore {
  reviews: Record<string, Review[]>;
  loading: Record<string, boolean>;
  fetchReviews: (productId: string) => void;
  addReview: (productId: string, userId: string, userName: string, rating: number, text: string) => Promise<void>;
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: {},
  loading: {},
  fetchReviews: (productId: string) => {
    if (get().loading[productId]) return;

    set(state => ({ loading: { ...state.loading, [productId]: true } }));

    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    onSnapshot(q, (snapshot) => {
      const productReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];

      set(state => ({
        reviews: { ...state.reviews, [productId]: productReviews },
        loading: { ...state.loading, [productId]: false }
      }));
    }, (error) => {
      console.error("Error fetching reviews:", error);
      set(state => ({ loading: { ...state.loading, [productId]: false } }));
    });
  },
  addReview: async (productId, userId, userName, rating, text) => {
    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId,
        userName,
        rating,
        text,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error adding review:", e);
      throw e;
    }
  }
}));
