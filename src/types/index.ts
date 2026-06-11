export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface WishlistItem extends Product {
  quantity: number;
  isPinned: boolean;
  selected: boolean;
  addedAt?: any;
}
