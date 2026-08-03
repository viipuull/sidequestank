import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme";
import { useHaptic } from "@/hooks/useHaptic";
import { cn } from "@/lib/utils";

/** Compact glass day/night switch. Purely presentational state. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const haptic = useHaptic();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        haptic.tick();
        toggle();
      }}
      className={cn(
        "group relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/70 bg-card/60 text-muted-foreground backdrop-blur-xl transition-colors hover:border-primary/40 hover:text-foreground active:scale-95",
        className,
      )}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        className="grid place-items-center"
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </motion.span>
    </button>
  );
}