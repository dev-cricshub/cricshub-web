"use client";

import { useParams } from "next/navigation";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { LiveConsole } from "@/app/components/auction/LiveConsole";
import { Watch } from "@/app/components/auction/Watch";
import { EmptyState, Skeleton } from "@/app/components/ui";
import { useAuction } from "@/lib/auction/store";

export default function LivePage() {
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
  // Only the auctioneer runs the console; everyone else gets the spectator view.
  if (auction.role !== "auctioneer") return <Watch auction={auction} />;
  return <LiveConsole auction={auction} />;
}
