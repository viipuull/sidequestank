import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";
import { AmbientBackground } from "@/components/motion/AmbientBackground";

/**
 * Responsive app frame.
 * Mobile: slim glass top bar + bottom tab bar (unchanged navigation model).
 * Desktop (lg+): fixed sidebar + utility top bar + wide content canvas.
 */
export function AppShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  /** Opt into the full-bleed dashboard canvas (map/dense views). */
  wide?: boolean;
}) {
  return (
    <div
      className="mesh-bg relative min-h-[100dvh] bg-background text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <AmbientBackground />
      <SideNav />

      {/* Dynamic top lighting — a slow highlight instead of a static bar. */}
      <div
        aria-hidden
        className="header-sheen pointer-events-none fixed inset-x-0 top-0 z-20 h-24"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--primary) 10%, transparent), transparent 85%)",
          maskImage: "linear-gradient(180deg, #000, transparent)",
        }}
      />

      <div className="lg:pl-64">
        <div className="mx-auto w-full px-5 lg:px-8">
          <TopBar />
          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`mx-auto w-full pb-28 lg:pb-12 ${wide ? "max-w-[1400px]" : "max-w-md lg:max-w-5xl"}`}
          >
            {children}
          </motion.main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}