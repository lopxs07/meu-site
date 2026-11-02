import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getHomeSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient()
    .from("store_settings")
    .select("hero_eyebrow, hero_subtitle, hero_image_url, essence_title, essence_text, show_featured")
    .eq("id", 1)
    .maybeSingle();
  return data;
});

/** Photos uploaded in the admin panel, keyed by product slug. */
export const getProductImages = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("products").select("slug, image_url").not("image_url", "is", null);
  const map: Record<string, string> = {};
  for (const r of data ?? []) if (r.image_url) map[r.slug] = r.image_url;
  return map;
});
