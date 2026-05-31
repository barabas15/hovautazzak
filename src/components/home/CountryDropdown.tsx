"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Country } from "@/types/trip";
import { isFlagUrl } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (countryCode: string) => void;
};

function FlagGlyph({ flag }: { flag: string }) {
  if (isFlagUrl(flag)) {
    // Country flags can be CDN URLs; a plain img keeps this simple (no fixed dims).
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={flag} alt="" className="w-6 h-4 object-cover rounded-sm" />;
  }
  return (
    <span aria-hidden className="text-xl">
      {flag || "🏳️"}
    </span>
  );
}

export function CountryDropdown({ open, onClose, onSelect }: Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch countries when first opened.
  useEffect(() => {
    if (!open || countries.length > 0) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/countries")
      .then((res) => {
        if (!res.ok) throw new Error(`countries ${res.status}`);
        return res.json();
      })
      .then((data: Country[]) => {
        if (!cancelled) setCountries(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Nem sikerült betölteni az országokat.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, countries.length]);

  // Focus input + Esc to close.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q));
  }, [countries, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Válassz célországot"
        className="w-full max-w-md bg-bg-card border border-border-default rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-semibold">Válassz célországot</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Bezárás"
            className="text-text-muted hover:text-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Keresés ország szerint..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple"
        />

        {/* List */}
        <div className="max-h-72 overflow-y-auto mt-4 space-y-1">
          {loading && (
            <p className="text-sm text-text-muted py-4 text-center">Betöltés…</p>
          )}
          {error && (
            <p className="text-sm text-red-400 py-4 text-center">{error}</p>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-sm text-text-muted py-4 text-center">
              Nincs találat.
            </p>
          )}
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => onSelect(c.code)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-left transition-colors"
            >
              <FlagGlyph flag={c.flag} />
              <span className="text-text-primary">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
