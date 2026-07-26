import { motion, useReducedMotion } from "framer-motion";
import { Children, type ReactNode } from "react";
import { fadeUp, stagger } from "@/lib/motion";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  step?: number;
  as?: "div" | "ul" | "ol";
};

export function StaggerList({
  children,
  className,
  delay = 0.02,
  step = 0.045,
  as = "div",
}: Props) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  if (reduce) {
    return <Comp className={className}>{children}</Comp>;
  }
  return (
    <Comp
      className={className}
      variants={stagger(delay, step)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {Children.map(children, (child, i) => (
        <motion.div key={i} variants={fadeUp}>
          {child}
        </motion.div>
      ))}
    </Comp>
  );
}