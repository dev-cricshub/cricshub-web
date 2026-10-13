"use client";

import { AppHeader } from "@/app/components/layout/AppHeader";
import { AuctionStatusBadge, AuctionSubnav, PlayerStateBadge } from "@/app/components/auction/chrome";
import { highestBid, queue, teamRemaining } from "@/lib/auction/engine";
import { inr } from "@/lib/auction/format";
import type { Auction } from "@/lib/auction/types";
import { ROLE_LABEL } from "@/lib/auction/types";

/** Read-only room view. Bidding stays with the auctioneer. */
export function Watch({ auction }: { auction: Auction }) {
  const player = auction.players.find((p) => p.id === auction.currentPlayerId) ?? null;
  const top = player ? highestBid(auction, player.id) : undefined;
  const leader = auction.teams.find((t) => t.id === top?.teamId);
  const recentSold = auction.players.filter((p) => p.status === "sold").slice(-5).reverse();

  return (
    <>
      <AppHeader context="Spectator" />
      <main className="container-page space-y-5 py-6 sm:py-10">
        <AuctionSubnav auction={auction} />
        <p className="text-sm text-fg-muted">
          You are watching. Only the auctioneer can accept bids, sell, or move the queue.
          {auction.visibility === "private" ? " This auction is marked private." : " Anyone with this link can watch."}
        </p>
        <section className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <AuctionStatusBadge status={auction.status} />
            {player && <PlayerStateBadge status={player.status} />}
          </div>
          {player ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">{ROLE_LABEL[player.role]}</p>
              <h2 className="mt-1 font-display text-4xl font-bold uppercase">{player.name}</h2>
              <p className="mt-4 font-display text-3xl font-bold tabular-nums">{top ? inr(top.amount) : inr(player.basePrice)}</p>
              <p className="text-sm text-fg-muted">{leader ? `Leading: ${leader.name}` : "No bid yet — opening price shown"}</p>
            </>
          ) : (
            <p className="mt-4 text-lg text-fg">Waiting for the next player.</p>
          )}
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Teams</h2>
            <ul className="mt-2 divide-y divide-line rounded-card border border-line bg-surface">
              {auction.teams.map((team) => (
                <li key={team.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ background: team.color }} aria-hidden />
                    {team.name}
                  </span>
                  <span className="tabular-nums text-fg-muted">{inr(teamRemaining(auction, team.id))} left</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Recent sales</h2>
            {recentSold.length === 0 ? (
              <p className="mt-2 text-sm text-fg-muted">No sales yet.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {recentSold.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span>{p.name}</span>
                    <span className="tabular-nums text-fg-muted">{inr(p.soldPrice ?? 0)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-fg-subtle">{queue(auction).length} players still waiting.</p>
          </section>
        </div>
      </main>
    </>
  );
}
