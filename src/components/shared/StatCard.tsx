import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 sm:p-6 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">{title}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>
      <div className="mt-1.5 sm:mt-2">
        <p className="text-lg sm:text-2xl font-semibold tracking-tight truncate">{value}</p>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-success" : "text-destructive")}>
            {trend.positive ? "+" : ""}{trend.value}%
          </p>
        )}
      </div>
    </div>
  );
}
