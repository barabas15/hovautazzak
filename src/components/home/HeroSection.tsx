"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CountryDropdown } from "@/components/home/CountryDropdown";
import type { TripResult } from "@/types/trip";

/** sessionStorage key shared with /trips page. */
export const TRIP_STORAGE_KEY = "randomutazas:lastTrip";

export function HeroSection() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateTrip(countryCode?: string) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(countryCode ? { countryCode } : {}),
      });
      if (!res.ok) throw new Error(`Trip generálás sikertelen (${res.status})`);
      const trip: TripResult = await res.json();
      sessionStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip));
      router.push("/trips");
    } catch (err) {
      console.error(err);
      setError("Nem sikerült utazást generálni. Próbáld újra.");
      setGenerating(false);
    }
  }

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
      {/* Background blur decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-violet-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="flex flex-col items-center gap-6 animate-fadeInUp">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-sm text-text-secondary">
          <span aria-hidden>✈</span> Fedezd fel a világot
        </span>

        {/* H1 gradient */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          Véletlenszerű
          <br />
          Utazás Generátor
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-xl text-text-secondary max-w-2xl">
          Hagyd, hogy a véletlenszerűség vigyen el a következő kalandba.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button
            type="button"
            onClick={() => generateTrip()}
            disabled={generating}
            className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold rounded-full px-8 py-3.5 shadow-lg shadow-violet-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {generating && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {generating ? "Generálás…" : "Generálj utazást!"}
          </button>

          <button
            type="button"
            onClick={() => setDropdownOpen(true)}
            disabled={generating}
            className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-text-primary rounded-full px-8 py-3.5 transition-colors disabled:opacity-60"
          >
            Célország →
          </button>
        </div>

        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>

      <CountryDropdown
        open={dropdownOpen}
        onClose={() => setDropdownOpen(false)}
        onSelect={(code) => {
          setDropdownOpen(false);
          generateTrip(code);
        }}
      />
    </section>
  );
}
