"use client";

import { useRouter } from "next/navigation";
import { getStoredUser, requestLogin } from "@/lib/session";

/** Sends signed-in users to the dashboard; otherwise opens the login modal with that redirect. */
export function useStartStreaming() {
  const router = useRouter();
  return () => {
    if (getStoredUser()) router.push("/dashboard");
    else requestLogin("/dashboard");
  };
}
