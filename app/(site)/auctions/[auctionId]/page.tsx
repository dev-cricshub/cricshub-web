"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { Manage } from "@/app/components/auction/Manage";
import { EmptyState, Skeleton } from "@/app/components/ui";
import { useAuction } from "@/lib/auction/store";

export default function AuctionPage() {
  return (
    <Suspense fallback={<Skeleton className="m-8 h-40" />}>
      <AuctionPageInner />
    </Suspense>
  );
}

function AuctionPageInner() {
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
          <EmptyState icon="ri-auction-line" title="Auction not found" description="It may have been removed when demo data was reset." />
        </main>
      </>
    );
  }
  return <Manage auction={auction} />;
}
