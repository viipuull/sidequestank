import { motion } from "framer-motion";
import { RARITY_STYLES } from "@/lib/hooks/useTitles";

export function TitleBadge({
  name, icon, rarity, color, size = "sm",
}: {
  name: string;
  icon: string;
  rarity: string;
  color?: string;
  size?: "xs" | "sm" | "md";
}) {
  const style = RARITY_STYLES[rarity] ?? RARITY_STYLES.common;
  const pad = size === "md" ? "px-3 py-1.5 text-xs" : size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`title-glow inline-flex items-center gap-1 rounded-full border font-semibold ${style.ring} ${pad}`}
      style={{
        background: style.bg,
        color: color ?? style.text,
        boxShadow: style.glow,
      }}
    >
      <span aria-hidden>{icon}</span>
      <span className="truncate max-w-[16ch]">{name}</span>
    </motion.span>
  );
}
