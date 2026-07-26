import type { Transition, Variants } from "framer-motion";

export const springs = {
  snappy: { type: "spring", stiffness: 500, damping: 30, mass: 0.8 } as Transition,
  soft: { type: "spring", stiffness: 260, damping: 24 } as Transition,
  bouncy: { type: "spring", stiffness: 400, damping: 14 } as Transition,
};

export const tap = {
  press: { scale: 0.96, transition: { type: "spring", stiffness: 600, damping: 25 } },
  bounce: { scale: 0.92 },
};

export const hover = {
  lift: { y: -2, transition: springs.snappy },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: springs.soft },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: springs.bouncy },
};

export const stagger = (delayChildren = 0.05, staggerChildren = 0.05): Variants => ({
  hidden: {},
  show: {
    transition: { delayChildren, staggerChildren },
  },
});

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.2, 0.7, 0.2, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
};