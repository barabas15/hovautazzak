"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { SavedTrip } from "@/types/trip";

type UseSavedTrips = {
  trips: SavedTrip[];
  loading: boolean;
  error: string | null;
  deleteTrip: (id: string) => Promise<void>;
};

export function useSavedTrips(): UseSavedTrips {
  const { user, loading: authLoading } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/saved-trips", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`saved-trips ${res.status}`);
      const data: SavedTrip[] = await res.json();
      setTrips(data);
    } catch (err) {
      console.error(err);
      setError("Nem sikerült betölteni a mentett utazásokat.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }
    fetchTrips();
  }, [authLoading, user, fetchTrips]);

  const deleteTrip = useCallback(
    async (id: string) => {
      if (!user) return;
      // optimistic removal
      const prev = trips;
      setTrips((t) => t.filter((trip) => trip.id !== id));
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/saved-trips/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`delete ${res.status}`);
      } catch (err) {
        console.error(err);
        setError("Nem sikerült törölni. Visszaállítva.");
        setTrips(prev); // rollback
      }
    },
    [user, trips],
  );

  return { trips, loading, error, deleteTrip };
}
