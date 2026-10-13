"use client";

import { useParams } from "next/navigation";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { Watch } from "@/app/components/auction/Watch";
import { EmptyState, Skeleton } from "@/app/components/ui";
import { useAuction } from "@/lib/auction/store";

export default function WatchPage() {
  const params = useParams<{ auctionId: string }>();
  const auction = useAuction(params.auctionId);
  if (auction === undefined) {
    return (
      <>
        <AppHeader />
        <main className="container-page py-10">
          <Skeleton className="h-40 w-full" />
        </main>
      </>
    );
  }
  if (!auction) {
    return (
      <>
        <AppHeader />
        <main className="container-page py-10">
          <EmptyState icon="ri-auction-line" title="Auction not found" />
        </main>
      </>
    );
  }
  return <Watch auction={auction} />;
}
