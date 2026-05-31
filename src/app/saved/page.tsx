"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useSavedTrips } from "@/hooks/useSavedTrips";
import type { SavedTrip } from "@/types/trip";
import { formatHuf, formatDate, isFlagUrl } from "@/lib/utils";

function FlagGlyph({ flag }: { flag: string }) {
  if (isFlagUrl(flag)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={flag} alt="" className="w-7 h-5 object-cover rounded-sm" />;
  }
  return (
    <span aria-hidden className="text-xl">
      {flag || "🏳️"}
    </span>
  );
}

function SavedTripCard({
  trip,
  onDelete,
}: {
  trip: SavedTrip;
  onDelete: (id: string) => void;
}) {
  const { country, flight, totalPriceHuf } = trip;

  function handleDelete() {
    if (window.confirm("Biztosan törlöd ezt a mentett utazást?")) {
      onDelete(trip.id);
    }
  }

  return (
    <div className="relative bg-bg-card border border-border-default rounded-2xl p-6 hover:shadow-xl hover:shadow-violet-900/20 transition-shadow">
      <div className="flex items-start justify-between">
        <span className="inline-flex items-center gap-2 text-xl font-semibold text-text-primary">
          <FlagGlyph flag={country.flag} />
          {country.name}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Törlés"
          className="text-text-muted hover:text-red-500 transition-colors p-1"
        >
          🗑
        </button>
      </div>

      {flight && (
        <>
          <p className="text-sm text-text-secondary mt-2">
            {flight.fromIata} → {flight.toCity} ({flight.toIata})
          </p>
          <p className="text-sm text-text-muted">
            {formatDate(flight.departureDate)}
          </p>
        </>
      )}

      <p className="text-lg font-bold text-text-primary mt-3">
        {formatHuf(totalPriceHuf)}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
      <span aria-hidden className="text-6xl opacity-60">
        🗺
      </span>
      <p className="text-xl text-text-primary">Még nincs mentett utazásod</p>
      <p className="text-text-secondary">
        Generálj egyet, és mentsd el a kedvenced!
      </p>
      <Link
        href="/"
        className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold rounded-full px-8 py-3.5 shadow-lg shadow-violet-600/30 transition-all"
      >
        Generálj egyet!
      </Link>
    </div>
  );
}

function SavedTripsContent() {
  const { trips, loading, error, deleteTrip } = useSavedTrips();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-text-primary mb-6">
        Mentett utazások
        {!loading && trips.length > 0 && (
          <span className="text-text-secondary text-lg font-normal ml-3">
            {trips.length} mentett kaland
          </span>
        )}
      </h1>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-bg-card border border-border-default rounded-2xl p-6 animate-pulse space-y-3"
            >
              <div className="h-6 w-32 bg-white/5 rounded" />
              <div className="h-4 w-40 bg-white/5 rounded" />
              <div className="h-5 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trips.map((trip) => (
            <SavedTripCard key={trip.id} trip={trip} onDelete={deleteTrip} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return (
    <ProtectedRoute>
      <SavedTripsContent />
    </ProtectedRoute>
  );
}
