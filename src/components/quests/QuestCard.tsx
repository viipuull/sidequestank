import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Clock, MapPin, Sparkles, Star } from "lucide-react";
import { QUEST_CATEGORIES, QUEST_DIFFICULTIES } from "@/lib/quests.types";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
    >
      <Link
        to="/quests/$slug"
        params={{ slug: quest.slug }}
        className="group relative block overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-lg backdrop-blur-xl transition-all duration-200 active:scale-[0.985] hover:border-primary/40"
      >
        <div className="relative h-40 overflow-hidden bg-muted">
          {quest.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={quest.cover_image_url}
              alt={quest.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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