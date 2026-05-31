"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/AuthProvider";

/** Access the current Firebase auth state ({ user, loading }). */
export function useAuth() {
  return useContext(AuthContext);
}
