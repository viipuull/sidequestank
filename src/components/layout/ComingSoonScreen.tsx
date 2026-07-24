import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { AuthGate } from "./AuthGate";

export function ComingSoonScreen({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <AuthGate>
      <AppShell>
        <div className="mt-16 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="grid h-24 w-24 place-items-center rounded-3xl border border-border bg-gradient-to-br from-primary/20 to-accent/10"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            {icon}
          </motion.div>
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">Coming soon</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{desc}</p>
        </div>
      </AppShell>
    </AuthGate>
  );
}