"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TripResult } from "@/types/trip";
import { TRIP_STORAGE_KEY } from "@/components/home/HeroSection";
import { TripCard } from "@/components/trips/TripCard";

export default function TripsPage() {
  const [trip, setTrip] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TRIP_STORAGE_KEY);
      if (raw) setTrip(JSON.parse(raw) as TripResult);
    } catch (err) {
      console.error("Trip beolvasása sikertelen:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="h-8 w-40 bg-white/5 rounded animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        </div>
        <div className="h-28 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-xl text-text-primary">
          Nem találtunk megjeleníthető utazást.
        </p>
        <p className="text-text-secondary">
          Generálj egy újat a főoldalon!
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold rounded-full px-8 py-3.5 shadow-lg shadow-violet-600/30 transition-all"
        >
          Vissza a főoldalra
        </Link>
      </div>
    );
  }

  return <TripCard trip={trip} />;
}
