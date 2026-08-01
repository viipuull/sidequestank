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

export const easings = {
  premium: [0.2, 0.7, 0.2, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
};

export const durations = { fast: 0.14, base: 0.22, slow: 0.42 };

/** Fade + rise + a touch of blur. The house reveal. */
export const fadeBlurUp: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.38, ease: easings.premium },
  },
};

export const heroReveal: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easings.premium },
  },
};

export const listStagger = stagger(0.04, 0.055);

export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -3, scale: 1.015, transition: springs.snappy },
  tap: { scale: 0.985, transition: springs.snappy },
};

export const pressTap = { scale: 0.96, transition: springs.snappy };