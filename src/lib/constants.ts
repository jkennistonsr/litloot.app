import { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Neon Blade Runner Hoodie',
    price: 89.99,
    image: 'https://picsum.photos/seed/hoodie/600/600',
    images: ['https://picsum.photos/seed/hoodie/600/600', 'https://picsum.photos/seed/hoodie2/600/600'],
    category: 'Apparel',
    description: 'High-visibility reactive fibers with embedded LED elements.'
  },
  {
    id: '2',
    name: 'Cybernetic Link Watch',
    price: 249.00,
    image: 'https://picsum.photos/seed/watch/600/600',
    images: ['https://picsum.photos/seed/watch/600/600', 'https://picsum.photos/seed/watch2/600/600'],
    category: 'Accessories',
    description: 'Quantum-synced timekeeping with holographic display.'
  },
  {
    id: '3',
    name: 'Synthetica Sneakers',
    price: 159.50,
    image: 'https://picsum.photos/seed/sneaker/600/600',
    images: ['https://picsum.photos/seed/sneaker/600/600', 'https://picsum.photos/seed/sneaker2/600/600'],
    category: 'Footwear',
    description: 'Self-adjusting compression soles with bioluminescent accents.'
  },
  {
    id: '4',
    name: 'Data-Grid Visor',
    price: 120.00,
    image: 'https://picsum.photos/seed/visor/600/600',
    images: ['https://picsum.photos/seed/visor/600/600', 'https://picsum.photos/seed/visor2/600/600'],
    category: 'Accessories',
    description: 'Augmented reality overlay for urban navigation.'
  },
  {
    id: '5',
    name: 'Quantum Courier Bag',
    price: 75.00,
    image: 'https://picsum.photos/seed/bag/600/600',
    images: ['https://picsum.photos/seed/bag/600/600', 'https://picsum.photos/seed/bag2/600/600'],
    category: 'Gear',
    description: 'Water-resistant carbon thread weave with haptic security.'
  },
  {
    id: '6',
    name: 'Pulse Audio Earbuds',
    price: 199.00,
    image: 'https://picsum.photos/seed/audio/600/600',
    images: ['https://picsum.photos/seed/audio/600/600', 'https://picsum.photos/seed/audio2/600/600'],
    category: 'Tech',
    description: 'Bone-conduction transducers with neutral-link connectivity.'
  }
];
