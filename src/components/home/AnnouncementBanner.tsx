import { motion } from "framer-motion";
import { useAnnouncements } from "@/lib/hooks/useLiveOps";

export function AnnouncementBanner() {
  const { data } = useAnnouncements();
  const top = (data ?? [])[0];
  if (!top) return null;
  const tone = top.priority === "critical"
    ? "border-red-400/50 bg-red-500/10 text-red-100"
    : top.priority === "high"
    ? "border-amber-400/50 bg-amber-400/10 text-amber-100"
    : "border-primary/40 bg-primary/10";
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className={`mt-4 flex items-start gap-3 rounded-2xl border p-3 backdrop-blur ${tone}`}>
      <span className="text-lg">{top.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{top.title}</p>
        {top.body && <p className="mt-0.5 text-xs opacity-90">{top.body}</p>}
      </div>
    </motion.div>
  );
}