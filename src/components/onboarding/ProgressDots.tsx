import { motion } from "framer-motion";

export function ProgressDots({ total, index }: { total: number; index: number }) {
  return (
    <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Progress">
      {Array.from({ length: total }).map((_, i) => (
        <motion.span
          key={i}
          role="tab"
          aria-selected={i === index}
          className="block h-1.5 rounded-full bg-muted"
          animate={{ width: i === index ? 24 : 8, opacity: i === index ? 1 : 0.5 }}
          transition={{ duration: 0.25 }}
          style={i === index ? { background: "var(--primary)" } : undefined}
        />
      ))}
    </div>
  );
}