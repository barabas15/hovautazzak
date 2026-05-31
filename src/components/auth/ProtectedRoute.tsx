"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * Client-side auth guard. Renders children only for authenticated users.
 * While auth loads, shows a skeleton (avoids the unauthenticated flash).
 * The backend middleware is the primary protection; this is the UX layer.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-9 w-56 bg-white/5 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-36 bg-bg-card border border-border-default rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
