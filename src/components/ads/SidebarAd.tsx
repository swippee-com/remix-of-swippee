import { useAds, useAdTracking } from "@/hooks/use-ads";
import { useEffect } from "react";
import { ExternalLink } from "lucide-react";

export function SidebarAd() {
  const { ads } = useAds("sidebar");
  const { trackImpression, trackClick } = useAdTracking();

  const ad = ads[0]; // Show top-priority ad only

  useEffect(() => {
    if (ad) trackImpression(ad.id);
  }, [ad?.id]);

  if (!ad) return null;

  return (
    <a
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={() => trackClick(ad.id)}
      className="mx-3 mb-3 block rounded-lg border border-border/60 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
    >
      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Sponsored
      </span>
      {ad.image_url && (
        <img src={ad.image_url} alt={ad.title} className="mt-2 h-8 w-auto object-contain" />
      )}
      <p className="mt-1.5 text-xs font-semibold">{ad.title}</p>
      {ad.description && (
        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{ad.description}</p>
      )}
      <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
        {ad.link_text} <ExternalLink className="h-2.5 w-2.5" />
      </span>
    </a>
  );
}
