import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Push deep links carry ?sqc=<campaign_id>. When the player lands on the app
 * we record the open once, then clean the URL.
 */
export function PushOpenTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const campaignId = url.searchParams.get("sqc");
    if (!campaignId) return;
    url.searchParams.delete("sqc");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    void (supabase as any).rpc("record_push_open", { _campaign_id: campaignId }).then(() => {}, () => {});
  }, []);
  return null;
}