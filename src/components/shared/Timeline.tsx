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

interface TimelineProps {
  steps: TimelineStep[];
  compact?: boolean;
  className?: string;
}

export function Timeline({ steps, compact = false, className }: TimelineProps) {
  return (
    <div className={cn("relative", compact ? "space-y-4" : "space-y-6", className)}>
      <div className={cn(
        "absolute top-0 h-full w-0.5 bg-border",
        compact ? "left-4" : "left-5"
      )} />
      {steps.map((step, i) => (
        <div key={i} className="relative flex items-start gap-3">
          <div
            className={cn(
              "relative z-10 flex shrink-0 items-center justify-center rounded-full border-4 border-background",
              compact ? "h-8 w-8" : "h-10 w-10",
              step.completed ? "bg-success text-success-foreground" : step.active ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {step.completed ? (
              <Check className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
            ) : (
              <div className={cn("rounded-full bg-muted-foreground/40", compact ? "h-1.5 w-1.5" : "h-2 w-2")} />
            )}
          </div>
          <div className={cn(compact ? "pt-1" : "pt-1.5")}>
            <h4 className={cn("font-medium", compact ? "text-xs" : "text-sm")}>{step.label}</h4>
            {step.description && <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>{step.description}</p>}
            {step.timestamp && (
              <time className={cn("uppercase tracking-wider text-muted-foreground", compact ? "text-[9px] mt-0" : "text-[10px] mt-0.5")}>
                {format(new Date(step.timestamp), "MMM d, HH:mm")}
              </time>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
