import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const visasQuery = queryOptions({
  queryKey: ["visas"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("visa_services")
      .select("*")
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("country");
    if (error) throw error;
    return data;
  },
});

export const visaBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["visa", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visa_services")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

export const umrahQuery = queryOptions({
  queryKey: ["umrah"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("umrah_packages")
      .select("*")
      .eq("active", true)
      .order("price_pkr");
    if (error) throw error;
    return data;
  },
});
