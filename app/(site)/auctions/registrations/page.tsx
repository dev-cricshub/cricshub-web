"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { AuctionStatusBadge } from "@/app/components/auction/chrome";
import { Alert, Badge, ButtonLink, EmptyState, PageHeader, Skeleton } from "@/app/components/ui";
import { formatWhen, inr } from "@/lib/auction/format";
import { auctionService } from "@/lib/auction/store";
import type { MyRegistration } from "@/lib/auction/types";
import { REGISTRATION_STATUS_LABEL } from "@/lib/auction/types";

/** Every auction the signed-in player registered for, newest first. */
export default function MyRegistrationsPage() {
  const [items, setItems] = useState<MyRegistration[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void auctionService.myRegistrations().then((result) => {
      if (result.ok) setItems(result.value);
      else setError(result.error);
    });
  }, []);

  return (
    <>
      <AppHeader />
      <main className="container-page space-y-6 py-6 sm:py-10">
        <PageHeader eyebrow="Auctions" title="My registrations" description="Auctions you registered for as a player." />
        {error ? (
          <Alert tone="danger">{error}</Alert>
        ) : items == null ? (
          <Skeleton className="h-24 w-full" />
        ) : items.length === 0 ? (
          <EmptyState icon="ri-user-add-line" title="No registrations yet" description="Open an invite link from an organiser to register." />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {items.map((r) => {
              const live = r.auctionStatus === "live" || r.auctionStatus === "paused";
              return (
                <li key={r.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-display text-lg font-bold uppercase tracking-wide">{r.auctionName}</span>
                      <AuctionStatusBadge status={r.auctionStatus} />
                      <Badge tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : r.status === "pending" ? "warning" : "neutral"}>
                        {REGISTRATION_STATUS_LABEL[r.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-fg-muted">
                      {r.tournament || "No tournament"}
                      {r.startsAt ? ` · ${formatWhen(r.startsAt, r.timezone)}` : ""}
                    </p>
                    {r.soldToTeam && (
                      <p className="mt-1 text-sm font-medium">
                        Sold to {r.soldToTeam}
                        {r.soldPrice != null ? ` for ${inr(r.soldPrice)}` : ""}
                      </p>
                    )}
                    {r.status === "rejected" && r.reason && <p className="mt-1 text-sm text-fg-muted">{r.reason}</p>}
                  </div>
                  {(r.status === "approved" || live) && (
                    <ButtonLink href={`/auctions/${r.auctionId}/watch`} size="sm" variant={live ? "primary" : "outline"}>
                      {live ? "Watch live" : "Open"}
                    </ButtonLink>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
