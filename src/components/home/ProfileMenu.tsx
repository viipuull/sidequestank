import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const FOUNDER_EMAIL = "ankleshwarweb@gmail.com";

export function ProfileMenu({
  displayName,
  username,
  email,
  avatarUrl,
  initials,
}: {
  displayName: string;
  username: string;
  email: string | null | undefined;
  avatarUrl: string | null;
  initials: string;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFounder = (email ?? "").toLowerCase() === FOUNDER_EMAIL;

  const close = () => setOpen(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    // Clear cached user data but preserve onboarding flags.
    queryClient.clear();
    setSigningOut(false);
    close();
    navigate({ to: "/auth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Avatar className="h-12 w-12 border-2 border-primary/40">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback className="bg-primary/20 text-sm font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              aria-hidden
            />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 top-14 z-50 w-64 origin-top-right overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-xl"
              style={{ boxShadow: "var(--shadow-elevated)" }}
            >
              <div className="px-4 py-3">
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">@{username}</p>
              </div>
              <div className="h-px w-full bg-border" />
              <div className="py-1">
                {isFounder && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      close();
                      navigate({ to: "/founder" });
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary/10"
                  >
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span>Founder Dashboard</span>
                  </button>
                )}
                <button
                  role="menuitem"
                  onClick={signOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{signingOut ? "Signing out…" : "Sign out"}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}