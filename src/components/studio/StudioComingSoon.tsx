import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StudioComingSoon({ title, description, phase }: { title: string; description: string; phase: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Studio</div>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      <Card className="p-6 border-dashed border-border/60">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium">Rolling out in {phase}</div>
            <p className="mt-1 text-sm text-muted-foreground max-w-prose">{description}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}