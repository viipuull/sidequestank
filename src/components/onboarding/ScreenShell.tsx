import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function ScreenShell({ children, className = "", glow = true }: Props) {
  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 0%, oklch(0.35 0.15 295 / 0.55), transparent 70%), radial-gradient(50% 40% at 80% 100%, oklch(0.45 0.18 40 / 0.3), transparent 70%)",
          }}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 py-8 ${className}`}
      >
        {children}
      </motion.div>
    </main>
  );
}