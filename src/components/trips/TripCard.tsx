"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TripResult } from "@/types/trip";
import { isFlagUrl } from "@/lib/utils";
import { FlightInfo } from "@/components/trips/FlightInfo";
import { HotelOption } from "@/components/trips/HotelOption";
import { BookingLink } from "@/components/trips/BookingLink";
import { PriceSummary } from "@/components/trips/PriceSummary";
import { SaveTripButton } from "@/components/trips/SaveTripButton";

export function TripCard({ trip }: { trip: TripResult }) {
  const router = useRouter();
  const { country, flight, returnFlight, hotels } = trip;
  const nights = hotels?.nights ?? 3;

  const checkIn = flight?.departureDate ?? "";
  const checkOut = returnFlight?.departureDate ?? "";

  const totalFlightPriceHuf = (flight?.priceHuf ?? 0) + (returnFlight?.priceHuf ?? 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-text-secondary hover:text-text-primary inline-flex items-center gap-1 transition-colors"
        >
          ← Vissza
        </button>
        <span className="text-2xl font-semibold text-text-primary inline-flex items-center gap-2">
          {isFlagUrl(country.flag) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={country.flag} alt="" className="w-7 h-5 object-cover rounded-sm" />
          ) : (
            <span aria-hidden>{country.flag}</span>
          )}
          {country.name}
        </span>
      </div>

      {/* Outbound flight */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-3">Odaút</h2>
        <FlightInfo flight={flight} />
      </section>

      {/* Return flight */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-3">Visszaút</h2>
        <FlightInfo flight={returnFlight ?? null} emptyMessage="Erre az úti célra nem találtunk visszaúti járatot." />
      </section>

      {/* Hotels */}
      {hotels && (
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-3">Szállás</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HotelOption hotel={hotels.cheapest} variant="cheapest" nights={nights} />
            <HotelOption hotel={hotels.recommended} variant="recommended" nights={nights} />
          </div>
          <BookingLink
            city={flight?.toCity ?? country.name}
            checkIn={checkIn}
            checkOut={checkOut}
            browseUrl={hotels.browseUrl}
          />
        </section>
      )}

      {/* Price summary */}
      {(flight || returnFlight) && hotels && (
        <PriceSummary
          flightPriceHuf={totalFlightPriceHuf}
          hotelPriceHuf={hotels.cheapest.totalPriceHuf}
          nights={nights}
        />
      )}

      {/* Save */}
      <SaveTripButton trip={trip} />

      <div className="text-center">
        <Link
          href="/"
          className="text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          Új utazás generálása →
        </Link>
      </div>
    </div>
  );
}
