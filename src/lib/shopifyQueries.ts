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
                price {
                  amount
                  currencyCode
                }
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
  images: {
    edges: {
      node: {
        url: string;
        altText: string;
      }
    }[]
  };
  variants: {
    edges: {
      node: {
        price: {
          amount: string;
          currencyCode: string;
        }
      }
    }[]
  };
  productType: string;
}
