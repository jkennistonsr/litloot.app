interface Env {
  ENVIRONMENT?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Cloudflare Pages Worker (Function)
  // This handles requests to /api/status
  
  return new Response(JSON.stringify({
    status: "online",
    message: "LitLoot Operator Channel Active",
    timestamp: new Date().toISOString(),
    environment: context.env.ENVIRONMENT || "development"
  }), {
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
};
