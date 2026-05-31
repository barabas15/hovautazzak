import type { HotelOffer } from "@/types/trip";
import { formatHuf, cn } from "@/lib/utils";

type Props = {
  hotel: HotelOffer;
  variant: "cheapest" | "recommended";
  nights: number;
};

export function HotelOption({ hotel, variant, nights }: Props) {
  const isRecommended = variant === "recommended";
  return (
    <div className="bg-bg-card border border-border-default rounded-2xl p-5 space-y-2">
      <span
        className={cn(
          "inline-flex items-center rounded-full text-xs px-2.5 py-1 border",
          isRecommended
            ? "bg-accent-purple/15 border-accent-purple/30 text-accent-purple"
            : "bg-white/5 border-white/10 text-text-secondary",
        )}
      >
        {isRecommended ? "⭐ Ajánlott" : "💰 Legolcsóbb"}
      </span>
      {hotel.isEstimate ? (
        <p className="text-xs text-text-secondary italic">Hozzávetőleges ár — erre a célállomásra nincs konkrét szállásadat</p>
      ) : hotel.url ? (
        <a
          href={hotel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-primary font-medium hover:text-accent-cyan transition-colors underline underline-offset-2"
        >
          {hotel.name}
        </a>
      ) : (
        <p className="text-text-primary font-medium">{hotel.name}</p>
      )}
      <p className="text-lg font-semibold text-text-primary">
        {formatHuf(hotel.totalPriceHuf)}
      </p>
      <p className="text-xs text-text-secondary">{nights} éjszakára összesen</p>
    </div>
  );
}
