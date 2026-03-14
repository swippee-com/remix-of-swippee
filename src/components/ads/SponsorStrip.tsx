import { useAds, useAdTracking } from "@/hooks/use-ads";
import { useEffect } from "react";

export function SponsorStrip() {
  const { ads } = useAds("landing_sponsor");
  const { trackImpression, trackClick } = useAdTracking();

  useEffect(() => {
    ads.forEach((a) => trackImpression(a.id));
  }, [ads.map((a) => a.id).join(",")]);

  if (ads.length === 0) return null;

  return (
    <section className="border-t border-b bg-muted/10">
      <div className="container py-8">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Sponsored Partners
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-8">
          {ads.map((ad) => (
            <a
              key={ad.id}
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => trackClick(ad.id)}
              className="flex items-center gap-2 opacity-60 transition-opacity hover:opacity-100"
            >
              {ad.image_url ? (
                <img src={ad.image_url} alt={ad.title} className="h-8 w-auto object-contain" />
              ) : (
                <span className="text-sm font-semibold text-foreground">{ad.title}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
