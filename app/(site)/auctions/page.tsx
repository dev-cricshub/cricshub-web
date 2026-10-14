"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { AuctionStatusBadge, ConfirmDialog, Select } from "@/app/components/auction/chrome";
import {
  Button,
  ButtonLink,
  EmptyState,
  Input,
  PageHeader,
  Skeleton,
  StatTile,
  useToast,
} from "@/app/components/ui";
import { formatWhen } from "@/lib/auction/format";
import { auctionService, useAuctionList } from "@/lib/auction/store";
import type { AuctionListItem, AuctionStatus } from "@/lib/auction/types";
import { STATUS_LABEL } from "@/lib/auction/types";

type SortKey = "updated" | "starts" | "name";

const STATUSES: AuctionStatus[] = ["draft", "scheduled", "live", "paused", "completed", "cancelled"];

export default function AuctionsPage() {
  const list = useAuctionList();
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AuctionStatus | "all" | "archived">("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<AuctionListItem | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (!list) return [];
    const q = query.trim().toLowerCase();
    const rows = list.filter((a) => {
      if (status === "archived") return a.archived;
      if (a.archived) return false;
      if (status !== "all" && a.status !== status) return false;
      if (!q) return true;
      return `${a.name} ${a.tournament}`.toLowerCase().includes(q);
    });
    rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "starts") return a.startsAt.localeCompare(b.startsAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return rows;
  }, [list, query, status, sort]);

  const pageSize = 6;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const counts = {
    total: list?.filter((a) => !a.archived).length ?? 0,
    upcoming: list?.filter((a) => !a.archived && (a.status === "draft" || a.status === "scheduled")).length ?? 0,
    live: list?.filter((a) => a.status === "live" || a.status === "paused").length ?? 0,
    done: list?.filter((a) => a.status === "completed").length ?? 0,
  };

  const create = async () => {
    if (creating) return;
    setCreating(true);
    const result = await auctionService.createDraft();
    setCreating(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else router.push(`/auctions/${result.value.id}/setup`);
  };

  return (
    <>
      <AppHeader />
      <main className="container-page space-y-8 py-6 sm:py-10">
        <PageHeader
          eyebrow="Auction management"
          title="Auctions"
          description="Set up a player auction, run it from the console, and keep the squads and purses in one place."
          actions={
            <Button icon="ri-add-line" onClick={create} disabled={creating}>
              New auction
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="All auctions" value={list ? counts.total : "—"} icon="ri-auction-line" />
          <StatTile label="Upcoming" value={list ? counts.upcoming : "—"} icon="ri-calendar-line" tone="primary" />
          <StatTile label="Live or paused" value={list ? counts.live : "—"} icon="ri-broadcast-line" tone="live" />
          <StatTile label="Completed" value={list ? counts.done : "—"} icon="ri-flag-line" tone="success" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            icon="ri-search-line"
            placeholder="Search name or tournament"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            aria-label="Search auctions"
          />
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AuctionStatus | "all" | "archived");
              setPage(0);
            }}
            className="sm:max-w-[180px]"
          >
            <option value="all">Active auctions</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
            <option value="archived">Archived</option>
          </Select>
          <Select
            aria-label="Sort auctions"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="sm:max-w-[180px]"
          >
            <option value="updated">Recently updated</option>
            <option value="starts">Auction date</option>
            <option value="name">Name</option>
          </Select>
        </div>

        {list == null ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : slice.length === 0 ? (
          <EmptyState
            icon="ri-auction-line"
            title={list.length === 0 ? "No auctions yet" : "Nothing matches"}
            description={
              list.length === 0
                ? "Create an auction to add teams, register players, and run the bidding."
                : "Try a different search or status."
            }
            action={
              list.length === 0 ? (
                <Button icon="ri-add-line" onClick={create}>
                  New auction
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {slice.map((auction) => (
              <li key={auction.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/auctions/${auction.id}`} className="truncate font-display text-lg font-bold uppercase tracking-wide text-fg hover:text-accent">
                      {auction.name}
                    </Link>
                    <AuctionStatusBadge status={auction.status} />
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    {auction.tournament || "No tournament"} · {formatWhen(auction.startsAt, auction.timezone)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-fg-subtle">
                    {auction.teamCount} teams · {auction.playerCount} players
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {auction.status === "draft" || auction.status === "scheduled" ? (
                    <ButtonLink href={`/auctions/${auction.id}/setup`} size="sm" variant="outline">
                      Edit
                    </ButtonLink>
                  ) : null}
                  {auction.status === "scheduled" && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        const result = await auctionService.start(auction.id);
                        if (!result.ok) toast(result.error, { tone: "error" });
                        else router.push(`/auctions/${auction.id}/live`);
                      }}
                    >
                      Start
                    </Button>
                  )}
                  {(auction.status === "live" || auction.status === "paused") && (
                    <ButtonLink href={`/auctions/${auction.id}/live`} size="sm">
                      {auction.status === "paused" ? "Resume" : "Open console"}
                    </ButtonLink>
                  )}
                  {auction.status === "completed" && (
                    <ButtonLink href={`/auctions/${auction.id}?section=results`} size="sm" variant="outline">
                      Results
                    </ButtonLink>
                  )}
                  {!auction.archived && auction.status !== "live" && auction.status !== "paused" && (
                    <Button size="sm" variant="ghost" onClick={() => setPending(auction)}>
                      Archive
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {filtered.length > pageSize && (
          <div className="flex items-center justify-between text-sm text-fg-muted">
            <span>
              {safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                Previous
              </Button>
              <Button size="sm" variant="outline" disabled={safePage >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!pending}
        title="Archive this auction?"
        body="Archived auctions leave the active list. Their results and history stay available under the Archived filter."
        confirmLabel="Archive"
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          const result = await auctionService.archive(pending.id);
          if (!result.ok) toast(result.error, { tone: "error" });
          else toast("Auction archived.", { tone: "success" });
          setPending(null);
        }}
      />
    </>
  );
}
