export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/src/supabase-config.js") {
      const config = {
        url: env.SUPABASE_URL || "",
        anonKey: env.SUPABASE_ANON_KEY || ""
      };

      return new Response(
        `window.DINO_SUPABASE = ${JSON.stringify(config)};`,
        {
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    return env.ASSETS.fetch(request);
  }
};
