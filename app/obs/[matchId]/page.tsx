"use client";

import { useParams, redirect } from "next/navigation";

export default function ObsRedirect() {
  const params = useParams();
  const matchId = params?.matchId as string;
  redirect(`/overlay/${matchId}`);
}
