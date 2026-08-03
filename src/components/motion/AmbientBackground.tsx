import { motion, useReducedMotion } from "framer-motion";

/**
 * Very slow drifting aurora blobs behind the app content.
 * Purely decorative: pointer-events none, GPU transforms only.
 */
export function AmbientBackground({ intensity = 1 }: { intensity?: number }) {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 60% at 50% -10%, oklch(0.4 0.16 40 / 0.28), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(1 0 0 / 0.035) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.035) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(120% 80% at 50% 0%, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(120% 80% at 50% 0%, black, transparent 72%)",
        }}
      />
      <motion.div
        className="absolute -left-1/4 top-[-10%] h-[70vh] w-[70vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.7 0.19 40 / 0.22), transparent 65%)",
          filter: "blur(40px)",
          opacity: 0.9 * intensity,
          willChange: "transform",
        }}
        animate={reduce ? undefined : { x: ["-4%", "8%", "-4%"], y: ["-3%", "5%", "-3%"], scale: [1, 1.12, 1] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-1/4 bottom-[-15%] h-[60vh] w-[60vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.22 356 / 0.18), transparent 65%)",
          filter: "blur(50px)",
          opacity: 0.9 * intensity,
          willChange: "transform",
        }}
        animate={reduce ? undefined : { x: ["5%", "-7%", "5%"], y: ["6%", "-4%", "6%"], scale: [1.08, 0.95, 1.08] }}
        transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}