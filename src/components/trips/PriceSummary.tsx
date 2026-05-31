import { formatHuf } from "@/lib/utils";

type Props = {
  flightPriceHuf: number;
  hotelPriceHuf: number;
  nights: number;
};

export function PriceSummary({ flightPriceHuf, hotelPriceHuf, nights }: Props) {
  const total = flightPriceHuf + hotelPriceHuf;
  return (
    <div className="bg-bg-card border border-border-default rounded-2xl p-6 space-y-2">
      <div className="flex justify-between text-text-secondary">
        <span>Repülő</span>
        <span>{formatHuf(flightPriceHuf)}</span>
      </div>
      <div className="flex justify-between text-text-secondary">
        <span>Szállás ({nights} éj, legolcsóbb)</span>
        <span>{formatHuf(hotelPriceHuf)}</span>
      </div>
      <div className="border-t border-border-default my-2" />
      <div className="flex justify-between items-baseline">
        <span className="text-text-primary font-semibold">Összesen</span>
        <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          {formatHuf(total)}
        </span>
      </div>
    </div>
  );
}
