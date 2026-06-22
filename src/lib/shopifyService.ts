import { ShopifyProduct } from "./shopifyQueries";
import { Product } from "../types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface FetchProductsResult {
  products: Product[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  status: string; // from displayFulfillmentStatus
  financialStatus: string;
  total: number;
  currency: string;
  items: {
    id: string;
    title: string;
    quantity: number;
    price: number;
    image: string;
  }[];
}

export const createShopifyCheckout = async (
  items: { id: string; quantity: number }[],
): Promise<string> => {
  const url = new URL("/api/shopify/checkout", window.location.origin);
  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const result: any = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to create checkout");
  }

  return result.checkoutUrl;
};

export const fetchShopifyOrders = async (
  first = 10,
  retries = 3,
  backoff = 1000,
): Promise<ShopifyOrder[]> => {
  try {
    const url = new URL("/api/shopify/orders", window.location.origin);
    url.searchParams.append("first", first.toString());

    const response = await fetch(url.toString());

    if (response.status === 429 && retries > 0) {
      await delay(backoff);
      return fetchShopifyOrders(first, retries - 1, backoff * 2);
    }

    if (!response.ok) {
      const errorData: any = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || `Order sync failure: HTTP_${response.status}`,
      );
    }

    const result: any = await response.json();

    if (result.error || result.errors) {
      throw new Error(
        `Shopify Order Error: ${result.error || JSON.stringify(result.errors)}`,
      );
    }

    return result.data.orders.edges.map((edge: any) => {
      const node = edge.node;
      return {
        id: node.id,
        name: node.name,
        createdAt: node.createdAt,
        status: node.displayFulfillmentStatus || "UNFULFILLED",
        financialStatus: node.displayFinancialStatus || "PENDING",
        total: parseFloat(node.totalPriceSet?.shopMoney?.amount || "0"),
        currency: node.totalPriceSet?.shopMoney?.currencyCode || "USD",
        items: node.lineItems.edges.map((lineEdge: any) => ({
          id: lineEdge.node.id,
          title: lineEdge.node.title,
          quantity: lineEdge.node.quantity,
          price: parseFloat(
            lineEdge.node.originalUnitPriceSet?.shopMoney?.amount || "0",
          ),
          image:
            lineEdge.node.image?.url ||
            "https://picsum.photos/seed/loot/200/200",
        })),
      };
    });
  } catch (error) {
    console.error("Failed to fetch Shopify orders:", error);
    // Return empty array as fallback for robust UI handling
    return [];
  }
};
export const fetchShopifyProducts = async (
  after: string | null = null,
  first = 10,
  retries = 3,
  backoff = 1000,
): Promise<FetchProductsResult> => {
  try {
    const url = new URL("/api/shopify", window.location.origin);
    if (after) url.searchParams.append("after", after);
    url.searchParams.append("first", first.toString());

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
      throw new Error(
        `Shopify Protocol Error: ${result.error || JSON.stringify(result.errors)}`,
      );
    }

    if (!result.data || !result.data.products) {
      throw new Error("Incomplete manifest received: Missing product data");
    }

    const products = result.data.products.edges.map(
      (edge: { node: ShopifyProduct }) => {
        const node = edge.node;
        const images = node.images.edges.map((e) => e.node.url);
        const sanitizeString = (s: string) => s.replace(/\//g, "_");
        const sanitizedId = sanitizeString(node.id);
        const variantNode = node.variants.edges[0]?.node;

        // For Storefront API, price is an object with amount. For Admin API, price is a string.
        const priceAmount = variantNode?.price && typeof variantNode.price === 'object' ? variantNode.price.amount : variantNode?.price;
        const compareAtPriceAmount = variantNode?.compareAtPrice && typeof variantNode.compareAtPrice === 'object' ? variantNode.compareAtPrice.amount : variantNode?.compareAtPrice;
        const priceStr = priceAmount || "0";
        const compareAtPriceStr = compareAtPriceAmount || undefined;

        return {
          id: sanitizedId,
          variantId: variantNode?.id
            ? sanitizeString(variantNode.id)
            : undefined,
          name: node.title,
          price: parseFloat(priceStr),
          compareAtPrice: compareAtPriceStr
            ? parseFloat(compareAtPriceStr)
            : undefined,
          image: images[0] || "https://picsum.photos/seed/loot/800/600",
          images:
            images.length > 0
              ? images
              : ["https://picsum.photos/seed/loot/800/600"],
          category: node.productType || "Uncategorized",
          description: node.description,
          availableForSale:
            node.variants.edges[0]?.node.availableForSale ?? true,
          quantityAvailable: node.variants.edges[0]?.node.quantityAvailable,
          tags: node.tags || [],
          publishedAt: node.publishedAt,
        };
      },
    );

    const pageInfo = result.data.products.pageInfo || {
      hasNextPage: false,
      endCursor: null,
    };

    // Cache the successful payload (only for the first page for simplicity in this fallback)
    if (!after) {
      localStorage.setItem("litloot_products_cache", JSON.stringify(products));
      localStorage.setItem(
        "litloot_products_cache_time",
        Date.now().toString(),
      );
    }

    return { products, pageInfo };
  } catch (error) {
    console.error("Failed to fetch Shopify products:", error);

    // Fallback to cache if available and it's the first page
    if (!after) {
      const cached = localStorage.getItem("litloot_products_cache");
      if (cached) {
        console.warn("Falling back to local product cache.");
        return {
          products: JSON.parse(cached),
          pageInfo: { hasNextPage: false, endCursor: null },
        };
      }
    }

    return { products: [], pageInfo: { hasNextPage: false, endCursor: null } };
  }
};
