"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { AuctionSubnav, ConfirmDialog, PendingStartDialog, PlayerStateBadge } from "@/app/components/auction/chrome";
import { Alert, Button, useToast, cn } from "@/app/components/ui";
import {
  highestBid,
  nextBidAmount,
  queue,
  shortSquads,
  squadOf,
  teamCanBid,
  teamRemaining,
} from "@/lib/auction/engine";
import { elapsedLabel, inr } from "@/lib/auction/format";
import { auctionService } from "@/lib/auction/store";
import type { Auction } from "@/lib/auction/types";
import { ROLE_LABEL } from "@/lib/auction/types";

export function LiveConsole({ auction }: { auction: Auction }) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"sell" | "unsold" | "end" | "undo" | null>(null);

  useEffect(() => {
    if (auction.status !== "live") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [auction.status]);

  const player = auction.players.find((p) => p.id === auction.currentPlayerId) ?? null;
  const onBlock = player?.status === "in_auction";
  const top = player ? highestBid(auction, player.id) : undefined;
  const leader = auction.teams.find((t) => t.id === top?.teamId);
  const next = nextBidAmount(auction);
  const upcoming = queue(auction).slice(0, 6);
  const sold = auction.players.filter((p) => p.status === "sold").length;
  const unsold = auction.players.filter((p) => p.status === "unsold").length;

  const short = shortSquads(auction);
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string; code?: string }>) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await fn();
      if (!result.ok) {
        if (result.code === "REGISTRATIONS_PENDING") {
          // The auctioneer decides what happens to registrations nobody approved.
          setPendingStart(result.error ?? "Some registrations still need a decision.");
          setError(null);
        } else {
          setError(result.error ?? "That action was rejected.");
          toast(result.error ?? "Rejected", { tone: result.code === "STALE_STATE" ? "info" : "error" });
        }
      } else setError(null);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (auction.status !== "live" || !onBlock || next == null) return;
      const index = Number(e.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= auction.teams.length) return;
      e.preventDefault();
      const team = auction.teams[index];
      run(() => auctionService.placeBid(auction.id, team.id));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <AppHeader context={auction.name} />
      <main className="container-page space-y-4 py-4 sm:py-6">
        <AuctionSubnav auction={auction} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm tabular-nums text-fg-muted">{elapsedLabel(auction, now)}</span>
          <span className="text-sm text-fg-subtle">
            {sold} sold · {unsold} unsold · {upcoming.length === 0 && !onBlock ? "queue empty" : `${queue(auction).length} waiting`}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            {auction.status === "scheduled" && (
              <Button onClick={() => run(() => auctionService.start(auction.id))}>Start auction</Button>
            )}
            {auction.status === "live" && (
              <Button variant="outline" onClick={() => run(() => auctionService.pause(auction.id))}>
                Pause
              </Button>
            )}
            {auction.status === "paused" && (
              <Button onClick={() => run(() => auctionService.resume(auction.id))}>Resume</Button>
            )}
            <Button variant="ghost" disabled={auction.status !== "live" && auction.status !== "paused"} onClick={() => setConfirm("undo")}>
              Undo last
            </Button>
            <Button variant="danger" disabled={auction.status !== "live" && auction.status !== "paused"} onClick={() => setConfirm("end")}>
              End
            </Button>
          </div>
        </div>

        {auction.status === "paused" && (
          <Alert tone="warning" title="Auction is paused">
            Bids and the queue stay as they are until you resume.
          </Alert>
        )}
        {error && (
          <Alert tone="danger" title="Action blocked">
            {error}
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
          <section className="rounded-card border border-line bg-surface p-4 sm:p-5">
            {!player || player.status === "withdrawn" ? (
              <div className="py-10 text-center">
                <p className="font-display text-2xl font-bold uppercase">No player on the block</p>
                <p className="mt-2 text-sm text-fg-muted">Call the next player when you are ready.</p>
                <Button className="mt-4" disabled={auction.status !== "live"} onClick={() => run(() => auctionService.presentNext(auction.id))}>
                  Next player
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">
                      {ROLE_LABEL[player.role]} · {player.overseas ? "Overseas" : player.nationality} · Cat {player.category}
                    </p>
                    <h2 className="mt-1 font-display text-4xl font-bold uppercase leading-none">{player.name}</h2>
                    <p className="mt-2 text-sm text-fg-muted">
                      Base {inr(player.basePrice)} · {player.matches} matches · bat {player.battingAvg} · bowl {player.bowlingAvg}
                    </p>
                  </div>
                  <PlayerStateBadge status={player.status} />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <figure className="rounded-card bg-canvas px-4 py-3">
                    <figcaption className="text-xs uppercase tracking-wider text-fg-subtle">Base price</figcaption>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums">{inr(player.basePrice)}</p>
                  </figure>
                  <figure className="rounded-card bg-primary-soft px-4 py-3">
                    <figcaption className="text-xs uppercase tracking-wider text-primary-soft-fg">Current bid</figcaption>
                    <p className="mt-1 font-display text-3xl font-bold tabular-nums text-fg">{top ? inr(top.amount) : "—"}</p>
                    <p className="text-sm text-fg-muted">{leader ? leader.name : "No bid yet"}</p>
                  </figure>
                  <figure className="rounded-card bg-canvas px-4 py-3">
                    <figcaption className="text-xs uppercase tracking-wider text-fg-subtle">Next bid</figcaption>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums">{onBlock && next != null ? inr(next) : "—"}</p>
                  </figure>
                </div>

                {player.status === "sold" && (
                  <p className="mt-4 text-sm font-medium text-fg">
                    Sold to {leader?.name ?? "the leading team"} for {inr(player.soldPrice ?? 0)}. Call the next player when the room is ready.
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button disabled={!onBlock || auction.status !== "live"} onClick={() => setConfirm("sell")}>
                    Mark sold
                  </Button>
                  <Button variant="outline" disabled={!onBlock || auction.status !== "live"} onClick={() => setConfirm("unsold")}>
                    Mark unsold
                  </Button>
                  <Button variant="ghost" disabled={!onBlock || auction.status !== "live"} onClick={() => run(() => auctionService.defer(auction.id))}>
                    Defer
                  </Button>
                  <Button variant="secondary" disabled={auction.status !== "live" || onBlock} onClick={() => run(() => auctionService.presentNext(auction.id))}>
                    Next player
                  </Button>
                </div>

                <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Bid for a team</h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {auction.teams.map((team, index) => {
                    const check = player && next != null ? teamCanBid(auction, team.id, next, player) : { ok: false, reason: "Waiting for a player." };
                    const remaining = teamRemaining(auction, team.id);
                    const squad = squadOf(auction, team.id).length;
                    const leading = top?.teamId === team.id;
                    return (
                      <li key={team.id}>
                        <button
                          type="button"
                          disabled={!onBlock || auction.status !== "live" || !check.ok || busy}
                          onClick={() => run(() => auctionService.placeBid(auction.id, team.id))}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-card border px-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-50",
                            leading ? "border-primary bg-primary-soft" : "border-line bg-canvas hover:border-primary/40",
                          )}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-md font-mono text-xs text-white" style={{ background: team.color }}>
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="truncate font-medium">{team.shortName}</span>
                              <span
                                className={cn("shrink-0 font-mono text-xs tabular-nums", squad < auction.rules.minSquad ? "text-fg-subtle" : "text-fg-muted")}
                                title={`${squad} players · minimum ${auction.rules.minSquad}, maximum ${auction.rules.maxSquad}`}
                              >
                                {squad}/{auction.rules.maxSquad}
                              </span>
                            </span>
                            <span className="block text-xs text-fg-subtle">
                              {check.ok
                                ? `${inr(remaining)} left${team.maxBid != null && team.maxBid < remaining ? ` · max bid ${inr(team.maxBid)}` : ""}`
                                : check.reason}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-fg-subtle">Keys 1–{auction.teams.length} place the next legal bid for that team.</p>
              </>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-card border border-line bg-surface p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Up next</h2>
              {upcoming.length === 0 ? (
                <p className="mt-2 text-sm text-fg-muted">Queue is empty.</p>
              ) : (
                <ol className="mt-2 space-y-2 text-sm">
                  {upcoming.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 text-fg-subtle">{ROLE_LABEL[p.role]}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section className="rounded-card border border-line bg-surface p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Recent activity</h2>
              <ol className="mt-2 max-h-80 space-y-2 overflow-auto text-sm">
                {[...auction.events].reverse().slice(0, 12).map((event) => (
                  <li key={event.id} className={event.reverted ? "text-fg-subtle line-through" : "text-fg-muted"}>
                    {event.message}
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </main>

      <ConfirmDialog
        open={confirm === "sell"}
        title={leader && top ? `Sell to ${leader.name}?` : "Sell this player?"}
        body={top ? `This records a sale at ${inr(top.amount)}. Undo is still available until the next action.` : "Accept a bid first."}
        confirmLabel="Confirm sale"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          run(() => auctionService.sell(auction.id));
        }}
      />
      <ConfirmDialog
        open={confirm === "unsold"}
        title="Mark this player unsold?"
        body="Only possible when nobody has a live bid. You can reopen them later."
        confirmLabel="Mark unsold"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          run(() => auctionService.unsold(auction.id));
        }}
      />
      <ConfirmDialog
        open={confirm === "undo"}
        title="Undo the last action?"
        body="This reverts the latest bid, sale, unsold, deferral, or presentation and writes an audit entry. It does not delete history."
        confirmLabel="Undo"
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          run(() => auctionService.undo(auction.id));
        }}
      />
      <ConfirmDialog
        open={confirm === "end"}
        title={short.length ? "End with short squads?" : "End the auction?"}
        body={
          (short.length ? `Below the minimum squad: ${short.join(", ")}. Results will flag them. ` : "") +
          "Every player must already be sold, unsold, or withdrawn, and the current lot must be finished." +
          (auction.tournamentId ? " Teams and squads will then be added to the linked tournament." : "")
        }
        confirmLabel="End auction"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          run(() => auctionService.complete(auction.id));
        }}
      />
      <PendingStartDialog
        message={pendingStart}
        onClose={() => setPendingStart(null)}
        onChoose={(pending) => {
          setPendingStart(null);
          run(() => auctionService.start(auction.id, pending));
        }}
      />
    </>
  );
}
