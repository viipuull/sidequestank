import { Link } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { Clock, MapPin, Sparkles, Star } from "lucide-react";
import { QUEST_CATEGORIES, QUEST_DIFFICULTIES } from "@/lib/quests.types";
import { useHaptic } from "@/hooks/useHaptic";
import { easings, springs } from "@/lib/motion";

type Props = {
  quest: {
    id: string;
    slug: string;
    title: string;
    short_description: string | null;
    cover_image_url: string | null;
    category: string;
    difficulty: string;
    estimated_minutes: number;
    city: string;
    reward_xp: number;
    featured: boolean;
    tags: string[] | null;
  };
  index?: number;
};

export function QuestCard({ quest, index = 0 }: Props) {
  const cat = QUEST_CATEGORIES.find((c) => c.value === quest.category);
  const diff = QUEST_DIFFICULTIES.find((d) => d.value === quest.difficulty);
  const haptic = useHaptic();
  const reduce = useReducedMotion();

  // Pointer-driven tilt (fine pointers only — touch keeps it flat).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [5, -5]), springs.soft);
  const ry = useSpring(useTransform(px, [0, 1], [-6, 6]), springs.soft);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, delay: index * 0.045, ease: easings.premium }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      whileHover={reduce ? undefined : { y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      style={{ rotateX: reduce ? 0 : rx, rotateY: reduce ? 0 : ry, transformPerspective: 900 }}
    >
      <Link
        to="/quests/$slug"
        params={{ slug: quest.slug }}
        onClick={() => haptic.tap()}
        className="card-shine hud-panel hud-edge group relative block overflow-hidden rounded-2xl transition-[border-color,box-shadow] duration-300 hover:border-primary/50 hover:shadow-[0_18px_50px_-18px_var(--glow-primary)]"
      >
        <div className="relative h-40 overflow-hidden bg-muted">
          {quest.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={quest.cover_image_url}
              alt={quest.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-5xl"
              style={{ background: "radial-gradient(80% 80% at 30% 20%, oklch(0.7 0.19 40 / 0.35), transparent 70%), radial-gradient(70% 70% at 80% 90%, oklch(0.55 0.21 285 / 0.35), transparent 70%)" }}
            >
              <span className="float-soft drop-shadow-[0_6px_18px_var(--glow-primary)]">{cat?.emoji ?? "🧭"}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
          {quest.featured && (
            <div className="neon-primary absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              <Sparkles className="h-3 w-3" /> Featured
            </div>
          )}
          <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-background/70 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
            {cat?.emoji} {cat?.label ?? quest.category}
          </div>
          <div className="neon-magenta absolute bottom-3 right-3 rounded-lg bg-background/80 px-2 py-1 text-[11px] font-bold tabular-nums text-accent backdrop-blur">
            +{quest.reward_xp} XP
          </div>
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-1 text-base font-bold text-foreground">{quest.title}</h3>
          {quest.short_description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{quest.short_description}</p>
          )}
          <div className="flex items-center justify-between border-t border-white/5 pt-2.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {quest.city}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {quest.estimated_minutes}m
            </span>
            <span
              className="flex items-center gap-1 font-semibold uppercase tracking-wide"
              style={{ color: diff?.color }}
            >
              <Star className="h-3 w-3" /> {diff?.label ?? quest.difficulty}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}