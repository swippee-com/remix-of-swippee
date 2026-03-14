import { useAds, useAdTracking } from "@/hooks/use-ads";
import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdBannerProps {
  placement: "dashboard_banner" | "live_prices" | "public_footer";
  className?: string;
}

export function AdBanner({ placement, className }: AdBannerProps) {
  const { ads } = useAds(placement);
  const { trackImpression, trackClick } = useAdTracking();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = ads.filter((a) => !dismissed.has(a.id));

  useEffect(() => {
    visible.forEach((a) => trackImpression(a.id));
  }, [visible.map((a) => a.id).join(",")]);

  if (visible.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {visible.map((ad) => (
        <div
          key={ad.id}
          className="flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 shadow-subtle"
        >
          {ad.image_url && (
            <img
              src={ad.image_url}
              alt={ad.title}
              className="h-10 w-10 shrink-0 rounded-md object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Sponsored
              </span>
              <span className="text-sm font-semibold truncate">{ad.title}</span>
            </div>
            {ad.description && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{ad.description}</p>
            )}
          </div>
          <a
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={() => trackClick(ad.id)}
          >
            <Button size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs">
              {ad.link_text} <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
          <button
            onClick={() => setDismissed((s) => new Set(s).add(ad.id))}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
