import type { Database } from "@/integrations/supabase/types";

export type QuestRow = Database["public"]["Tables"]["quests"]["Row"];
export type QuestInsert = Database["public"]["Tables"]["quests"]["Insert"];
export type QuestUpdate = Database["public"]["Tables"]["quests"]["Update"];
export type ObjectiveRow = Database["public"]["Tables"]["quest_objectives"]["Row"];
export type ObjectiveInsert = Database["public"]["Tables"]["quest_objectives"]["Insert"];

export type QuestCategory = Database["public"]["Enums"]["quest_category"];
export type QuestDifficulty = Database["public"]["Enums"]["quest_difficulty"];
export type QuestType = Database["public"]["Enums"]["quest_type"];
export type QuestStatus = Database["public"]["Enums"]["quest_status"];
export type QuestVisibility = Database["public"]["Enums"]["quest_visibility"];
export type ObjectiveType = Database["public"]["Enums"]["objective_type"];

export const QUEST_CATEGORIES: { value: QuestCategory; label: string; emoji: string }[] = [
  { value: "exploration", label: "Exploration", emoji: "🧭" },
  { value: "food", label: "Food", emoji: "🍜" },
  { value: "culture", label: "Culture", emoji: "🎭" },
  { value: "nature", label: "Nature", emoji: "🌿" },
  { value: "history", label: "History", emoji: "🏛️" },
  { value: "photography", label: "Photo", emoji: "📸" },
  { value: "trivia", label: "Trivia", emoji: "🧠" },
  { value: "fitness", label: "Fitness", emoji: "🏃" },
  { value: "nightlife", label: "Nightlife", emoji: "🌙" },
  { value: "community", label: "Community", emoji: "🤝" },
];

export const QUEST_DIFFICULTIES: { value: QuestDifficulty; label: string; color: string }[] = [
  { value: "easy", label: "Easy", color: "oklch(0.78 0.14 155)" },
  { value: "medium", label: "Medium", color: "oklch(0.82 0.16 85)" },
  { value: "hard", label: "Hard", color: "oklch(0.72 0.19 40)" },
  { value: "expert", label: "Expert", color: "oklch(0.68 0.22 15)" },
];

export const QUEST_TYPES: { value: QuestType; label: string; emoji: string }[] = [
  { value: "walking", label: "Walking", emoji: "🚶" },
  { value: "photo", label: "Photo", emoji: "📸" },
  { value: "trivia", label: "Trivia", emoji: "🧠" },
  { value: "treasure_hunt", label: "Treasure Hunt", emoji: "🗺️" },
  { value: "gps_checkin", label: "GPS Check-in", emoji: "📍" },
  { value: "qr_hunt", label: "QR Hunt", emoji: "🔳" },
  { value: "event", label: "Event", emoji: "🎉" },
  { value: "limited_time", label: "Limited-Time", emoji: "⏳" },
];

export const OBJECTIVE_TYPES: { value: ObjectiveType; label: string; emoji: string }[] = [
  { value: "visit_location", label: "Visit Location", emoji: "📍" },
  { value: "gps_checkin", label: "GPS Check-in", emoji: "🛰️" },
  { value: "scan_qr", label: "Scan QR", emoji: "🔳" },
  { value: "take_photo", label: "Take Photo", emoji: "📷" },
  { value: "answer_trivia", label: "Answer Trivia", emoji: "❓" },
  { value: "collect_item", label: "Collect Item", emoji: "🎁" },
  { value: "custom", label: "Custom", emoji: "✨" },
];

export type QuestWithObjectives = QuestRow & { objectives: ObjectiveRow[] };

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}