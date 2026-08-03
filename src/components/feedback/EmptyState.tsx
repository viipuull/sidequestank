import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="status"
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      className={
        "glass-panel mx-auto flex max-w-md flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-10 text-center " +
        className
      }
    >
      <div className="relative grid h-16 w-16 place-items-center">
        <span
          aria-hidden
          className="glow-breathe absolute inset-0 rounded-full bg-primary/10"
        />
        <span
          aria-hidden
          className="absolute inset-2 rounded-full border border-primary/25"
        />
        <span className="float-soft relative grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </motion.div>
  );
}