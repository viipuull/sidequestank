import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { easings } from "@/lib/motion";

const variants: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.24, ease: easings.premium },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: "blur(4px)",
    transition: { duration: 0.14, ease: easings.exit },
  },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="show"
        exit="exit"
        style={{ minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}