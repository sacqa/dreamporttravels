import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteContentMap = Record<string, any>;

async function fetchSiteContent(): Promise<SiteContentMap> {
  const { data, error } = await supabase.from("site_content").select("key,value");
  if (error) throw error;
  const map: SiteContentMap = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

export function useSiteContent() {
  return useQuery({
    queryKey: ["site_content"],
    queryFn: fetchSiteContent,
    staleTime: 5 * 60_000,
  });
}

/** Read a single key with a fallback default. */
export function useContentValue<T = any>(key: string, fallback: T): T {
  const { data } = useSiteContent();
  return (data?.[key] as T) ?? fallback;
}
