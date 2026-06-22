export const SHOPIFY_PRODUCTS_QUERY = `
  query getProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          title
          description
          handle
          tags
          publishedAt
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
          productType
        }
      }
    }
  }
`;

export const SHOPIFY_PRODUCTS_ADMIN_QUERY = `
  query getProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        cursor
        node {
          id
          title
          descriptionHtml
          handle
          tags
          publishedAt
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                price
                compareAtPrice
                inventoryQuantity
              }
            }
          }
          productType
        }
      }
    }
  }
`;

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  tags: string[];
  publishedAt: string;
  images: {
    edges: {
      node: {
        url: string;
        altText: string;
      };
    }[];
  };
  variants: {
    edges: {
      node: {
        id: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        compareAtPrice?: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        quantityAvailable?: number;
      };
    }[];
  };
  productType: string;
}
