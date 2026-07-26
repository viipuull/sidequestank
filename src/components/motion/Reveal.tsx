import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { fadeUp } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children">;

export function Reveal({ children, delay = 0, className, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "80px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={fadeUp}
      initial="hidden"
      animate={shown ? "show" : "hidden"}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}