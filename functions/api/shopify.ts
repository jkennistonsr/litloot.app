import { SHOPIFY_PRODUCTS_QUERY } from '../../src/lib/shopifyQueries';

interface Env {
  SHOPIFY_STORE_URL: string;
  SHOPIFY_ACCESS_TOKEN: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { SHOPIFY_STORE_URL, SHOPIFY_ACCESS_TOKEN } = context.env;

  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ 
      error: "Shopify configuration missing in environmental variables. Please configure SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN in the Cloudflare Dashboard." 
    }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  try {
    const response = await fetch(`${SHOPIFY_STORE_URL}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: SHOPIFY_PRODUCTS_QUERY,
        variables: { first: 10 }
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "content-type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};
