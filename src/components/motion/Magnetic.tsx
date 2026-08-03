import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { springs } from "@/lib/motion";

/**
 * Desktop-only magnetic hover: the wrapped element leans slightly toward the
 * cursor. Touch pointers and reduced-motion users get a plain wrapper.
 */
export function Magnetic({
  children,
  strength = 10,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, springs.soft);
  const y = useSpring(my, springs.soft);

  if (reduce) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ x, y, display: "inline-flex" }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        mx.set(((e.clientX - (r.left + r.width / 2)) / r.width) * strength * 2);
        my.set(((e.clientY - (r.top + r.height / 2)) / r.height) * strength * 2);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}