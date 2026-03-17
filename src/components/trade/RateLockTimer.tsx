import { cn } from "@/lib/utils";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface RateLockTimerProps {
  seconds: number;
  maxSeconds?: number;
  expired?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function RateLockTimer({ seconds, maxSeconds = 45, expired, onRefresh, className }: RateLockTimerProps) {
  const pct = expired ? 0 : (seconds / maxSeconds) * 100;
  const urgent = seconds <= 10 && !expired;

  if (expired) {
    return (
      <div className={cn("flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2", className)}>
        <RefreshCw className="h-4 w-4 text-destructive" />
        <span className="text-sm font-medium text-destructive">Rate expired</span>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} className="ml-auto h-7 text-xs">
            Refresh rate
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          Rate valid for
        </span>
        <span className={cn("font-mono font-semibold", urgent ? "text-destructive" : "text-foreground")}>
          {seconds}s
        </span>
      </div>
      <Progress value={pct} className={cn("h-1.5", urgent && "[&>div]:bg-destructive")} />
    </div>
  );
}
