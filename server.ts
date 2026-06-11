import express from "express";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { SHOPIFY_PRODUCTS_QUERY } from "./src/lib/shopifyQueries.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add compression middleware for faster responses
  app.use(compression());
  
  // Add JSON parsing middleware
  app.use(express.json());

  // Simple in-memory cache for Shopify products
  const shopifyCache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_DURATION_MS = 1000 * 60 * 5; // 5 minutes cache

  // Shopify Proxy Endpoint
  app.get("/api/shopify", async (req, res) => {
    let SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
    const { after, first = "10" } = req.query;
    const cacheKey = `${after || 'start'}-${first}`;

    if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
      return res.status(500).json({
        error: "Shopify configuration missing in environmental variables. Please configure SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN in the AI Studio Secrets panel."
      });
    }

    // Ensure URL has protocol
    if (!SHOPIFY_STORE_URL.startsWith('http')) {
      SHOPIFY_STORE_URL = `https://${SHOPIFY_STORE_URL}`;
    }

    // Check cache
    const now = Date.now();
    const cached = shopifyCache.get(cacheKey);
    if (cached && (now - cached.timestamp < CACHE_DURATION_MS)) {
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.json(cached.data);
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
          variables: { 
            first: parseInt(first as string),
            after: after || null 
          }
        }),
      });

      const data = await response.json();
      
      // Update cache only if there are no errors
      if (!data.errors) {
        shopifyCache.set(cacheKey, { data, timestamp: now });
      }
      
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health / Status Endpoint
  app.get("/api/status", (req, res) => {
    res.json({
      status: "online",
      message: "LitLoot Operator Channel Active",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
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
    const distPath = path.join(process.cwd(), 'dist');
    // Set caching for static assets
    app.use(express.static(distPath, { maxAge: '1y' }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
