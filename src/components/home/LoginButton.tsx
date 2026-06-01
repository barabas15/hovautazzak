"use client";

import { useState } from "react";
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

const provider = new GoogleAuthProvider();

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /FBAN|FBAV|Instagram|Messenger|LinkedInApp|MicroMessenger|Twitter|Snapchat/i.test(
    navigator.userAgent,
  );
}

/** Triggers Google sign-in. In-app browsers (Messenger, Instagram etc.) use redirect flow. */
export async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase nincs konfigurálva.");
  if (isInAppBrowser()) {
    return signInWithRedirect(auth, provider);
  }
  return signInWithPopup(auth, provider);
}

export function LoginButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google bejelentkezés sikertelen:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-text-primary rounded-full px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60",
        className,
      )}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.24 1.42-1.66 4.16-5.5 4.16-3.31 0-6.01-2.74-6.01-6.12S8.69 6.02 12 6.02c1.88 0 3.15.8 3.87 1.49l2.64-2.55C16.96 3.44 14.7 2.5 12 2.5 6.98 2.5 2.92 6.56 2.92 12S6.98 21.5 12 21.5c5.78 0 9.6-4.06 9.6-9.78 0-.66-.07-1.16-.16-1.66H12z"
        />
      </svg>
      {loading ? "Bejelentkezés…" : "Bejelentkezés"}
    </button>
  );
}
