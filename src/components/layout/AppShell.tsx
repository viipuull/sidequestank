import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { AmbientBackground } from "@/components/motion/AmbientBackground";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-[100dvh] bg-background text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <AmbientBackground />
      {/* Dynamic top lighting — a slow highlight instead of a static bar. */}
      <div
        aria-hidden
        className="header-sheen pointer-events-none fixed inset-x-0 top-0 z-30 h-24"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.62 0.22 295 / 0.10), transparent 85%)",
          maskImage: "linear-gradient(180deg, #000, transparent)",
        }}
      />
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto max-w-md px-5 pb-28 pt-4"
      >
        {children}
      </motion.main>
      <BottomNav />
    </div>
  );
}