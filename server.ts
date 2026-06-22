import express from "express";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import path from "path";
import { SHOPIFY_PRODUCTS_QUERY } from "./src/lib/shopifyQueries.ts";

const getShopifyConfig = () => {
  let url = process.env.SHOPIFY_STORE_URL;
  if (url) {
    if (!url.startsWith("http")) url = `https://${url}`;
    if (url.endsWith("/")) url = url.slice(0, -1);
  }

  // Hunt for Admin Token
  let adminToken = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_PRIVATE_KEY || process.env.SHOPIFY_PRIVATE_TOKEN;
  if (adminToken && !adminToken.startsWith('shpat_') && !adminToken.startsWith('shpca_')) {
    adminToken = undefined; // Invalid admin token
  }
  if (!adminToken) {
    const fallback = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_API_KEY;
    if (fallback && (fallback.startsWith('shpat_') || fallback.startsWith('shpca_'))) {
      adminToken = fallback;
    }
  }
    
  // Hunt for Storefront Public Token
  let storefrontPublicToken = process.env.SHOPIFY_STOREFRONT_PUBLIC || process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!storefrontPublicToken) {
    const fallback = process.env.SHOPIFY_ACCESS_TOKEN;
    if (fallback && !fallback.startsWith('shpat_') && !fallback.startsWith('shpca_') && !fallback.startsWith('shpss_')) {
      storefrontPublicToken = fallback;
    }
  }
    
  // Hunt for Storefront Private Token (for server logic)
  let storefrontPrivateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE || process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  if (!storefrontPrivateToken) {
    const fallback = process.env.SHOPIFY_ACCESS_TOKEN;
    if (fallback?.startsWith('shpss_')) {
      storefrontPrivateToken = fallback;
    }
  }

  return { url, adminToken, storefrontPublicToken, storefrontPrivateToken };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add compression middleware for faster responses
  app.use(compression());

  // Add JSON parsing middleware
  app.use(express.json());

  // Simple in-memory cache for Shopify products
  const shopifyCache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_DURATION_MS = 1000 * 60 * 5; // 5 minutes cache

  // Attempt to auto-generate the storefront access token if missing but admin token is available
  try {
    const config = getShopifyConfig();
    if (config.url && config.adminToken && !config.storefrontPublicToken && !config.storefrontPrivateToken) {
      console.log("No Storefront Token found. Attempting to generate one using Admin Token...");
      const genUrl = `${config.url}/admin/api/2024-01/graphql.json`;
      const genQuery = `
        mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
          storefrontAccessTokenCreate(input: $input) {
            storefrontAccessToken {
              accessToken
            }
          }
        }
      `;
      const genResponse = await fetch(genUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": config.adminToken,
        },
        body: JSON.stringify({
          query: genQuery,
          variables: { input: { title: "Generated via AI Studio - " + new Date().toISOString() } },
        }),
      });

      const genData = await genResponse.json();
      const newToken = genData?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken;
      if (newToken) {
        console.log("Successfully generated Storefront Token! Using it for this session.");
        process.env.SHOPIFY_STOREFRONT_PUBLIC = newToken;
      } else {
        console.log("Failed to generate Storefront Token. Please check Admin Token permissions.");
      }
    }
  } catch (e) {
    console.error("Error auto-generating storefront token:", e);
  }

  app.post("/api/shopify/checkout", async (req, res) => {
    try {
      const config = getShopifyConfig();
      if (!config.url || (!config.adminToken && !config.storefrontPublicToken && !config.storefrontPrivateToken)) {
        return res.status(500).json({ error: "Shopify configuration missing." });
      }

      const { url, adminToken, storefrontPublicToken, storefrontPrivateToken } = config;
      const { items } = req.body;

      const baseHeaders: any = { "Content-Type": "application/json" };
      let endpoint = "";
      if (storefrontPrivateToken) {
        baseHeaders["Shopify-Storefront-Private-Token"] = storefrontPrivateToken;
        endpoint = "/api/2024-01/graphql.json";
      } else if (storefrontPublicToken) {
        baseHeaders["X-Shopify-Storefront-Access-Token"] = storefrontPublicToken;
        endpoint = "/api/2024-01/graphql.json";
      } else if (adminToken) {
        baseHeaders["X-Shopify-Access-Token"] = adminToken;
        endpoint = "/admin/api/2024-01/graphql.json";
      }

      const lines = await Promise.all(items.map(async (item: any) => {
        let variantId = item.id.replace(/_/g, "/");
        
        // Resolve Product IDs to Variant IDs seamlessly for legacy cart items
        if (variantId.includes("Product/") && !variantId.includes("ProductVariant/")) {
           try {
              const resolveResponse = await fetch(`${url}${endpoint}`, {
                method: "POST",
                headers: baseHeaders,
                body: JSON.stringify({
                  query: `
                    query getVariant($id: ID!) {
                      product(id: $id) {
                        variants(first: 1) {
                          edges {
                            node {
                              id
                            }
                          }
                        }
                      }
                    }
                  `,
                  variables: { id: variantId }
                })
              });
              const resolveData = await resolveResponse.json();
              const fetchedId = resolveData?.data?.product?.variants?.edges?.[0]?.node?.id;
              if (fetchedId) {
                variantId = fetchedId;
              }
           } catch (e) {
             console.error("Failed to resolve product to variant ID:", e);
           }
        }

        return {
          variantId,
          quantity: item.quantity,
        };
      }));

      // Prefer Storefront API for checking out (cleaner URLs)
      if (storefrontPublicToken || storefrontPrivateToken) {
        // Storefront API - create cart
        const cartCreateQuery = `
          mutation cartCreate($input: CartInput!) {
            cartCreate(input: $input) {
              cart {
                id
                checkoutUrl
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        // Format for Storefront Cart api
        const cartLines = lines.map((l: any) => ({
          merchandiseId: l.variantId,
          quantity: l.quantity,
        }));

        const headers: any = { "Content-Type": "application/json" };
        if (storefrontPrivateToken) {
          headers["Shopify-Storefront-Private-Token"] = storefrontPrivateToken;
        } else if (storefrontPublicToken) {
          headers["X-Shopify-Storefront-Access-Token"] = storefrontPublicToken;
        }

        const response = await fetch(
          `${url}/api/2024-01/graphql.json`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              query: cartCreateQuery,
              variables: { input: { lines: cartLines } },
            }),
          },
        );

        const result: any = await response.json();

        if (result.errors) {
          return res.status(400).json({ error: result.errors[0].message });
        }

        if (result.data?.cartCreate?.userErrors?.length > 0) {
          return res
            .status(400)
            .json({ error: result.data.cartCreate.userErrors[0].message });
        }

        const checkoutUrl = result.data?.cartCreate?.cart?.checkoutUrl;
        return res.json({ checkoutUrl });
      } else if (adminToken) {
        // Admin API - create draft order
        const draftOrderCreateQuery = `
          mutation draftOrderCreate($input: DraftOrderInput!) {
            draftOrderCreate(input: $input) {
              draftOrder {
                id
                invoiceUrl
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const response = await fetch(
          `${url}/admin/api/2024-01/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": adminToken,
            },
            body: JSON.stringify({
              query: draftOrderCreateQuery,
              variables: { input: { lineItems: lines } },
            }),
          },
        );

        const result: any = await response.json();

        if (result.errors) {
          return res.status(400).json({ error: result.errors[0].message });
        }

        if (result.data?.draftOrderCreate?.userErrors?.length > 0) {
          return res.status(400).json({
            error: result.data.draftOrderCreate.userErrors[0].message,
          });
        }

        const checkoutUrl =
          result.data?.draftOrderCreate?.draftOrder?.invoiceUrl;
        return res.json({ checkoutUrl });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Shopify Proxy Endpoint
  app.get("/api/shopify", async (req, res) => {
    const config = getShopifyConfig();
    const { after, first = "10" } = req.query;
    const cacheKey = `${after || "start"}-${first}`;

    if (!config.url || (!config.adminToken && !config.storefrontPublicToken && !config.storefrontPrivateToken)) {
      return res.status(500).json({
        error:
          "Shopify configuration missing in environmental variables. Please configure SHOPIFY_STORE_URL and SHOPIFY_STOREFRONT_PUBLIC in the AI Studio Settings menu.",
      });
    }

    const { url: SHOPIFY_STORE_URL, adminToken, storefrontPublicToken, storefrontPrivateToken } = config;

    // Check cache
    const now = Date.now();
    const cached = shopifyCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.json(cached.data);
    }

    try {
      // Prefer Storefront token for public product fetches if available
      const useAdmin = !storefrontPublicToken && !storefrontPrivateToken && adminToken;
      const url = useAdmin
        ? `${SHOPIFY_STORE_URL}/admin/api/2024-01/graphql.json`
        : `${SHOPIFY_STORE_URL}/api/2024-01/graphql.json`;

      const headers: any = { "Content-Type": "application/json" };
      if (useAdmin) {
        headers["X-Shopify-Access-Token"] = adminToken;
      } else if (storefrontPrivateToken) {
        headers["Shopify-Storefront-Private-Token"] = storefrontPrivateToken;
      } else if (storefrontPublicToken) {
        headers["X-Shopify-Storefront-Access-Token"] = storefrontPublicToken;
      }

      const { SHOPIFY_PRODUCTS_QUERY, SHOPIFY_PRODUCTS_ADMIN_QUERY } =
        await import("./src/lib/shopifyQueries.js");

      const response = await fetch(url, {
        method: "POST",
        headers: headers as any,
        body: JSON.stringify({
          query: useAdmin
            ? SHOPIFY_PRODUCTS_ADMIN_QUERY
            : SHOPIFY_PRODUCTS_QUERY,
          variables: {
            first: parseInt(first as string),
            after: after || null,
          },
        }),
      });

      const data = await response.json();

      // Handle invalid tokens gracefully by returning empty products list
      if (data.errors && data.errors.toLowerCase && data.errors.toLowerCase().includes("invalid api key")) {
        return res.json({ data: { products: { edges: [], pageInfo: { hasNextPage: false } } } });
      }
      if (data.errors && Array.isArray(data.errors) && data.errors[0]?.message?.toLowerCase().includes("invalid api key")) {
        return res.json({ data: { products: { edges: [], pageInfo: { hasNextPage: false } } } });
      }

      // Update cache only if there are no errors
      if (!data.errors) {
        shopifyCache.set(cacheKey, { data, timestamp: now });
      }

      res.setHeader("Cache-Control", "public, max-age=300");
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Shopify Orders Endpoint
  app.get("/api/shopify/orders", async (req, res) => {
    const config = getShopifyConfig();
    const { first = "10" } = req.query;

    if (!config.url || !config.adminToken) {
      // Return empty if no admin access available
      return res.json({ data: { orders: { edges: [] } } });
    }

    try {
      let url = `${config.url}/admin/api/2024-01/graphql.json`;
      let headers: any = {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": config.adminToken,
      };

      let query = `
        query getOrders($first: Int!) {
          orders(first: $first, sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                id
                name
                createdAt
                displayFulfillmentStatus
                displayFinancialStatus
                totalPriceSet { shopMoney { amount currencyCode } }
                lineItems(first: 5) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      originalUnitPriceSet { shopMoney { amount } }
                      image { url }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          variables: { first: parseInt(first as string) },
        }),
      });

      const data = await response.json();
      
      // Handle invalid admin tokens gracefully by returning empty orders list
      if (data.errors && data.errors.toLowerCase && data.errors.toLowerCase().includes("invalid api key")) {
        return res.json({ data: { orders: { edges: [] } } });
      }
      if (data.errors && Array.isArray(data.errors) && data.errors[0]?.message?.toLowerCase().includes("invalid api key")) {
        return res.json({ data: { orders: { edges: [] } } });
      }

      if (!data.errors) {
        res.setHeader("Cache-Control", "private, max-age=60");
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/shopify/generate-token", async (req, res) => {
    const config = getShopifyConfig();
    const adminToken = config.adminToken;
    if (!config.url || !adminToken) {
      return res.status(400).json({ error: "Missing Shopify URL or Admin Token" });
    }

    try {
      const url = `${config.url}/admin/api/2024-01/graphql.json`;
      const query = `
        mutation storefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
          storefrontAccessTokenCreate(input: $input) {
            storefrontAccessToken {
              accessToken
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": adminToken,
        },
        body: JSON.stringify({
          query,
          variables: { input: { title: "Generated via AI Studio" } },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        return res.status(400).json({ error: data.errors });
      }

      if (data.data?.storefrontAccessTokenCreate?.userErrors?.length > 0) {
        return res.status(400).json({ error: data.data.storefrontAccessTokenCreate.userErrors });
      }

      return res.json({ 
        token: data.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken 
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Health / Status Endpoint
  app.get("/api/status", (req, res) => {
    res.json({
      status: "online",
      message: "LitLoot Operator Channel Active",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(process.cwd(), "dist");
    // Set caching for static assets
    app.use(express.static(distPath, { maxAge: "1y" }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
