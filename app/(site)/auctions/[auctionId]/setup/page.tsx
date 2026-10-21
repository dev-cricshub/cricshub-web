"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/app/components/ui";

// Setup used to be a separate wizard; it now lives in the auction admin. Keeps old links working.
export default function SetupPage() {
  const params = useParams<{ auctionId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/auctions/${params.auctionId}`);
  }, [params.auctionId, router]);
  return <Skeleton className="m-8 h-40" />;
}
