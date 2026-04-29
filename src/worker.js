function buildSupabaseConfig(env) {
  return {
    url: env.SUPABASE_URL || "",
    anonKey: env.SUPABASE_ANON_KEY || ""
  };
}

function isSupabaseConfigPath(pathname) {
  return pathname === "/src/supabase-config.js" || pathname === "/supabase-config.js";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isSupabaseConfigPath(url.pathname)) {
      const config = buildSupabaseConfig(env);

      return new Response(
        `window.DINO_SUPABASE = ${JSON.stringify(config)};`,
        {
          headers: {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
          }
        }
      );
    }

    if (url.pathname === "/api/config-check") {
      const config = buildSupabaseConfig(env);
      const anonKey = config.anonKey || "";

      return new Response(
        JSON.stringify({
          hasSupabaseUrl: Boolean(config.url),
          supabaseUrlHost: config.url ? new URL(config.url).host : "",
          hasSupabaseAnonKey: Boolean(anonKey),
          anonKeyPrefix: anonKey ? anonKey.slice(0, 15) : "",
          anonKeyLength: anonKey.length
        }, null, 2),
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
          }
        }
      );
    }

    return env.ASSETS.fetch(request);
  }
};
