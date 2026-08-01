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