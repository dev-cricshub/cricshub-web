"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { Wizard } from "@/app/components/auction/Wizard";
import { ButtonLink, EmptyState, Skeleton } from "@/app/components/ui";
import { useAuction } from "@/lib/auction/store";

export default function SetupPage() {
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
  if (auction.status !== "draft" && auction.status !== "scheduled") {
    return (
      <>
        <AppHeader />
        <main className="container-page space-y-4 py-10">
          <EmptyState
            icon="ri-lock-line"
            title="Setup is closed"
            description="Rules, teams and the player pool lock once the auction is live."
            action={<ButtonLink href={`/auctions/${auction.id}`}>Back to auction</ButtonLink>}
          />
          <Link href={`/auctions/${auction.id}/live`} className="text-sm text-accent">
            Open the console
          </Link>
        </main>
      </>
    );
  }
  return <Wizard auction={auction} />;
}
