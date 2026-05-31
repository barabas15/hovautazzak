"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { LoginButton } from "@/components/home/LoginButton";

function Avatar({
  photoURL,
  name,
}: {
  photoURL: string | null;
  name: string | null;
}) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt={name ?? "Felhasználó"}
        width={32}
        height={32}
        className="rounded-full border border-white/10"
      />
    );
  }
  return (
    <span className="w-8 h-8 rounded-full bg-accent-purple/30 border border-white/10 flex items-center justify-center text-sm font-semibold text-text-primary">
      {initial}
    </span>
  );
}

export function Navbar() {
  const { user, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-40 bg-bg-nav/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="text-lg">
            ✈
          </span>
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            RandomUtazás
          </span>
        </Link>

        {/* Auth-aware right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="w-24 h-8 rounded-full bg-white/5 animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/saved"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:inline"
              >
                Mentett utazások
              </Link>
              <Link
                href="/saved"
                aria-label="Mentett utazások"
                className="sm:hidden text-text-secondary hover:text-text-primary"
              >
                💾
              </Link>
              <Avatar photoURL={user.photoURL} name={user.displayName} />
              <button
                type="button"
                onClick={() => signOut(auth)}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Kilépés
              </button>
            </>
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </nav>
  );
}
