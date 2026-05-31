"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/components/home/LoginButton";
import type { TripResult } from "@/types/trip";

type SaveState = "idle" | "saving" | "saved" | "error";

export function SaveTripButton({ trip }: { trip: TripResult }) {
  const { user } = useAuth();
  const [state, setState] = useState<SaveState>("idle");

  async function persist() {
    setState("saving");
    try {
      const current = user ?? (await signInWithGoogle()).user;
      const token = await current.getIdToken();
      const res = await fetch("/api/saved-trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(trip),
      });
      if (!res.ok) throw new Error(`save ${res.status}`);
      setState("saved");
    } catch (err) {
      console.error("Mentés sikertelen:", err);
      setState("error");
    }
  }

  if (state === "saved") {
    return (
      <div className="w-full text-center rounded-full py-3.5 bg-white/5 border border-white/10 text-text-primary font-semibold">
        Mentve ✓
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={persist}
        disabled={state === "saving"}
        className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold rounded-full py-3.5 shadow-lg shadow-violet-600/30 transition-all disabled:opacity-70 inline-flex items-center justify-center gap-2"
      >
        {state === "saving" && (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}
        {state === "saving" ? "Mentés…" : "💾 Utazás mentése"}
      </button>
      {!user && state === "idle" && (
        <p className="text-sm text-text-muted text-center">
          A mentéshez bejelentkezés szükséges (Google).
        </p>
      )}
      {state === "error" && (
        <p className="text-sm text-red-400 text-center">
          Nem sikerült menteni. Próbáld újra.
        </p>
      )}
    </div>
  );
}
