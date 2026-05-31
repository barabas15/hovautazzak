import type { Flight } from "@/types/trip";
import { formatHuf, formatDate } from "@/lib/utils";

export function FlightInfo({ flight, returnDate }: { flight: Flight | null; returnDate?: string }) {
  if (!flight) {
    return (
      <div className="bg-bg-card border border-border-default rounded-2xl p-6 md:p-8 text-text-secondary">
        Erre az úti célra most nem találtunk járatot. Próbálj másik országot!
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-default rounded-2xl p-6 md:p-8 space-y-3">
      <p className="text-lg md:text-xl font-medium text-text-primary">
        {flight.fromCity}{" "}
        <span className="text-accent-cyan font-mono">({flight.fromIata})</span>{" "}
        <span className="text-accent-cyan">→</span> {flight.toCity}{" "}
        <span className="text-accent-cyan font-mono">({flight.toIata})</span>
      </p>
      <p className="text-sm text-text-secondary">
        Indulás: {formatDate(flight.departureDate)}
        {returnDate && <> · Visszaút: {formatDate(returnDate)}</>}
        {" · "}{flight.airline}
      </p>
      <p className="text-3xl md:text-4xl font-bold text-text-primary">
        {formatHuf(flight.priceHuf)}
      </p>
      <a
        href={flight.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-accent-purple hover:text-accent-cyan font-medium transition-colors"
      >
        Jegy foglalása →
      </a>
    </div>
  );
}
