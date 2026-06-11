import { ShopifyProduct } from './shopifyQueries';
import { Product } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface FetchProductsResult {
  products: Product[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export const fetchShopifyProducts = async (after: string | null = null, first = 10, retries = 3, backoff = 1000): Promise<FetchProductsResult> => {
  try {
    const url = new URL('/api/shopify', window.location.origin);
    if (after) url.searchParams.append('after', after);
    url.searchParams.append('first', first.toString());

    const response = await fetch(url.toString());
    
    if (response.status === 429 && retries > 0) {
      console.warn(`Shopify rate limit hit, retrying in ${backoff}ms...`);
      await delay(backoff);
      return fetchShopifyProducts(after, first, retries - 1, backoff * 2);
    }

    if (!response.ok) {
      throw new Error(`Critical sync failure: HTTP_${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid terminal data format: Expected JSON manifest");
    }

    const result: any = await response.json();

    if (result.error || result.errors) {
      throw new Error(`Shopify Protocol Error: ${result.error || JSON.stringify(result.errors)}`);
    }

    if (!result.data || !result.data.products) {
      throw new Error('Incomplete manifest received: Missing product data');
    }

    const products = result.data.products.edges.map((edge: { node: ShopifyProduct }) => {
      const node = edge.node;
      const images = node.images.edges.map(e => e.node.url);
      const sanitizedId = node.id.replace(/\//g, '_');
      
      return {
        id: sanitizedId,
        name: node.title,
        price: parseFloat(node.variants.edges[0]?.node.price.amount || '0'),
        image: images[0] || 'https://picsum.photos/seed/loot/800/600',
        images: images.length > 0 ? images : ['https://picsum.photos/seed/loot/800/600'],
        category: node.productType || 'Uncategorized',
        description: node.description
      };
    });

    const pageInfo = result.data.products.pageInfo || { hasNextPage: false, endCursor: null };

    // Cache the successful payload (only for the first page for simplicity in this fallback)
    if (!after) {
      localStorage.setItem('litloot_products_cache', JSON.stringify(products));
      localStorage.setItem('litloot_products_cache_time', Date.now().toString());
    }

    return { products, pageInfo };
  } catch (error) {
    console.error('Failed to fetch Shopify products:', error);
    
    // Fallback to cache if available and it's the first page
    if (!after) {
      const cached = localStorage.getItem('litloot_products_cache');
      if (cached) {
        console.warn('Falling back to local product cache.');
        return { 
          products: JSON.parse(cached),
          pageInfo: { hasNextPage: false, endCursor: null }
        };
      }
    }
    
    return { products: [], pageInfo: { hasNextPage: false, endCursor: null } };
  }
};
