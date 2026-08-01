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
        className="card-shine group relative block overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-lg backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-primary/50 hover:shadow-[0_18px_50px_-18px_oklch(0.62_0.22_295/0.55)]"
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
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-fuchsia-500/20 to-transparent text-5xl">
              {cat?.emoji ?? "🧭"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
          {quest.featured && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-semibold text-primary-foreground shadow">
              <Sparkles className="h-3 w-3" /> Featured
            </div>
          )}
          <div className="absolute right-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
            {cat?.emoji} {cat?.label ?? quest.category}
          </div>
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-1 text-base font-semibold text-foreground">{quest.title}</h3>
          {quest.short_description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{quest.short_description}</p>
          )}
          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {quest.city}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {quest.estimated_minutes}m
            </span>
            <span
              className="flex items-center gap-1 font-semibold"
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