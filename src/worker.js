export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/config-check") {
      const supabaseUrl = env.SUPABASE_URL || "";
      const anonKey = env.SUPABASE_ANON_KEY || "";

      return new Response(JSON.stringify({
        hasSupabaseUrl: Boolean(supabaseUrl),
        supabaseUrlHost: supabaseUrl ? new URL(supabaseUrl).host : "",
        hasSupabaseAnonKey: Boolean(anonKey),
        anonKeyPrefix: anonKey ? anonKey.slice(0, 15) : "",
        anonKeyLength: anonKey.length
      }, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }

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
