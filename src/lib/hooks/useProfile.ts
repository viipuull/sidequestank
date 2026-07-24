import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  is_pioneer: boolean;
  level: number;
  xp: number;
  created_at: string;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function usePioneerSlots() {
  return useQuery({
    queryKey: ["pioneer-slots"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("pioneer_slots_remaining");
      if (error) throw error;
      return data as number;
    },
  });
}