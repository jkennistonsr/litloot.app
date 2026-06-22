export interface Product {
  id: string;
  variantId?: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images: string[];
  category: string;
  description: string;
  availableForSale?: boolean;
  quantityAvailable?: number;
  tags?: string[];
  publishedAt?: string;
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
