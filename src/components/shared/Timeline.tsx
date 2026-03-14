import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { format } from "date-fns";

interface TimelineStep {
  label: string;
  description?: string;
  timestamp?: string;
  completed: boolean;
  active?: boolean;
}

export function Timeline({ steps, className }: { steps: TimelineStep[]; className?: string }) {
  return (
    <div className={cn("relative space-y-6", className)}>
      <div className="absolute left-5 top-0 h-full w-0.5 bg-border" />
      {steps.map((step, i) => (
        <div key={i} className="relative flex items-start gap-4">
          <div
            className={cn(
              "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background",
              step.completed ? "bg-success text-success-foreground" : step.active ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {step.completed ? <Check className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
          </div>
          <div className="pt-1.5">
            <h4 className="text-sm font-medium">{step.label}</h4>
            {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
            {step.timestamp && (
              <time className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {format(new Date(step.timestamp), "MMM d, HH:mm")}
              </time>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
