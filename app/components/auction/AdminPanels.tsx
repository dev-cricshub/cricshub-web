"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog, PlayerStateBadge, Select, downloadText } from "@/app/components/auction/chrome";
import { CreateTournamentForm } from "@/app/components/auction/CreateTournamentForm";
import { Alert, Badge, Button, Input, useToast } from "@/app/components/ui";
import { normalizePhone, squadsToCsv } from "@/lib/auction/csv";
import { shortSquads, squadOf, teamRemaining, teamSpent } from "@/lib/auction/engine";
import { formatWhen, inr } from "@/lib/auction/format";
import { auctionService } from "@/lib/auction/store";
import type { Auction, LinkableTournament, PlayerRole, PlayerState, ServiceResult } from "@/lib/auction/types";
import { PLAYER_ROLES, ROLE_LABEL } from "@/lib/auction/types";

// Panels the auction admin (AuctionAdmin.tsx) shows once an auction is underway.

/** The pool once bidding has started: filter, withdraw, reopen unsold players. */
export function PlayerPool({ auction }: { auction: Auction }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<PlayerRole | "all">("all");
  const [state, setState] = useState<PlayerState | "all">("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"queue" | "price" | "name">("queue");
  const [selected, setSelected] = useState<string[]>([]);
  const categories = [...new Set(auction.players.map((p) => p.category))].sort();
  const rows = useMemo(() => {
    const list = auction.players.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.trim().toLowerCase())) return false;
      if (role !== "all" && p.role !== role) return false;
      if (state !== "all" && p.status !== state) return false;
      if (category !== "all" && p.category !== category) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price") return b.basePrice - a.basePrice;
      return a.queueOrder - b.queueOrder;
    });
    return list;
  }, [auction.players, q, role, state, category, sort]);

  const withdrawSelected = async () => {
    let failed = 0;
    for (const id of selected) {
      const result = await auctionService.withdraw(auction.id, id);
      if (!result.ok) failed += 1;
    }
    setSelected([]);
    if (failed) toast(`${failed} player${failed === 1 ? "" : "s"} could not be withdrawn.`, { tone: "error" });
    else toast("Selected players withdrawn.", { tone: "success" });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row">
        <Input icon="ri-search-line" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" aria-label="Search players" />
        <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as PlayerRole | "all")} className="lg:max-w-[150px]">
          <option value="all">All roles</option>
          {PLAYER_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </Select>
        <Select aria-label="Status" value={state} onChange={(e) => setState(e.target.value as PlayerState | "all")} className="lg:max-w-[150px]">
          <option value="all">All states</option>
          <option value="available">Available</option>
          <option value="in_auction">In auction</option>
          <option value="sold">Sold</option>
          <option value="unsold">Unsold</option>
          <option value="deferred">Deferred</option>
          <option value="withdrawn">Withdrawn</option>
        </Select>
        <Select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="lg:max-w-[140px]">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as "queue" | "price" | "name")} className="lg:max-w-[140px]">
          <option value="queue">Queue</option>
          <option value="price">Base price</option>
          <option value="name">Name</option>
        </Select>
      </div>
      {selected.length > 0 && (
        <div className="flex items-center justify-between rounded-card border border-line bg-surface px-3 py-2 text-sm">
          <span>{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={withdrawSelected}>
            Withdraw selected
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wider text-fg-subtle">
            <tr>
              <th className="px-3 py-2" />
              <th className="px-3 py-2 font-medium">Player</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Base</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const buyer = auction.teams.find((t) => t.id === p.soldToTeamId);
              const selectable = p.status === "available" || p.status === "deferred" || p.status === "unsold";
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      disabled={!selectable}
                      checked={selected.includes(p.id)}
                      onChange={(e) => setSelected((cur) => (e.target.checked ? [...cur, p.id] : cur.filter((id) => id !== p.id)))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium">{p.name}</span>
                    {p.source === "registration" && (
                      <Badge tone="primary" className="ml-2">
                        Registered
                      </Badge>
                    )}
                    <span className="mt-0.5 block text-xs text-fg-subtle">
                      {[p.category && `Cat ${p.category}`, p.nationality, p.matches ? `${p.matches} matches` : ""].filter(Boolean).join(" · ")}
                    </span>
                  </td>
                  <td className="px-3 py-2">{ROLE_LABEL[p.role]}</td>
                  <td className="px-3 py-2 tabular-nums">{inr(p.basePrice)}</td>
                  <td className="px-3 py-2">
                    <PlayerStateBadge status={p.status} />
                  </td>
                  <td className="px-3 py-2 text-fg-muted">
                    {p.status === "sold" && buyer ? `${buyer.shortName} · ${inr(p.soldPrice ?? 0)}` : "—"}
                    {p.status === "unsold" && (auction.status === "live" || auction.status === "paused") && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={async () => {
                          const result = await auctionService.reopen(auction.id, p.id);
                          if (!result.ok) toast(result.error, { tone: "error" });
                        }}
                      >
                        Reopen
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Results({ auction }: { auction: Auction }) {
  const sold = auction.players.filter((p) => p.status === "sold");
  const unsold = auction.players.filter((p) => p.status === "unsold");
  const exportCsv = () => {
    const rows = sold.map((p) => ({
      team: auction.teams.find((t) => t.id === p.soldToTeamId)?.name ?? "",
      player: p.name,
      role: p.role,
      price: p.soldPrice ?? 0,
      base: p.basePrice,
    }));
    downloadText(`${auction.name.replace(/\s+/g, "-").toLowerCase()}-squads.csv`, squadsToCsv(rows));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">
          {sold.length} sold · {unsold.length} unsold
          {auction.status !== "completed" ? " · auction still open, so these figures can change" : ""}
        </p>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={sold.length === 0}>
          Export CSV
        </Button>
      </div>
      {auction.role === "auctioneer" && <TournamentHandover auction={auction} />}
      {auction.teams.map((team) => {
        const squad = squadOf(auction, team.id);
        const short = squad.length < auction.rules.minSquad;
        return (
          <section key={team.id} className={`rounded-card border bg-surface ${short && auction.status === "completed" ? "border-danger/40" : "border-line"}`}>
            <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="flex flex-wrap items-center gap-2 font-display text-lg font-bold uppercase">
                {team.name}
                {short && (
                  <Badge tone={auction.status === "completed" ? "danger" : "warning"}>
                    {squad.length} of {auction.rules.minSquad} minimum
                  </Badge>
                )}
              </h2>
              <p className="text-sm tabular-nums text-fg-muted">
                Spent {inr(teamSpent(auction, team.id))} · left {inr(teamRemaining(auction, team.id))}
              </p>
            </header>
            {squad.length === 0 ? (
              <p className="px-4 py-3 text-sm text-fg-subtle">No purchases.</p>
            ) : (
              <ul>
                {squad.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 border-t border-line px-4 py-2 text-sm">
                    <span>
                      {p.name} <span className="text-fg-subtle">{ROLE_LABEL[p.role]}</span>
                    </span>
                    <span className="tabular-nums text-fg-muted">
                      {inr(p.soldPrice ?? 0)} <span className="text-fg-subtle">base {inr(p.basePrice)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      {unsold.length > 0 && (
        <p className="text-sm text-fg-muted">Unsold: {unsold.map((p) => p.name).join(", ")}</p>
      )}
    </div>
  );
}

/**
 * "Link to CricsHub" on the Results tab (auctioneer only, once the auction is completed): fill phones for sold
 * players first, then link an existing tournament or create one. Either call links it and pushes the squads.
 */
function TournamentHandover({ auction }: { auction: Auction }) {
  const toast = useToast();
  const [tournaments, setTournaments] = useState<LinkableTournament[] | null>(null);
  const [choice, setChoice] = useState("");
  const [busy, setBusy] = useState(false);
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const linked = !!auction.tournamentId;
  const done = auction.handoverStatus === "done";
  const completed = auction.status === "completed";
  const soldNoPhone = auction.players.filter((p) => p.status === "sold" && !p.phone);
  const blocked = soldNoPhone.length > 0;

  useEffect(() => {
    if (linked || !completed) return;
    let alive = true;
    auctionService.linkableTournaments().then((r) => {
      if (alive) setTournaments(r.ok ? r.value.filter((t) => !t.linkedAuctionId || t.linkedAuctionId === auction.id) : []);
    });
    return () => {
      alive = false;
    };
  }, [linked, completed, auction.id]);

  /** The push can fail after the link succeeds; the document then says why. */
  const act = async (fn: () => Promise<ServiceResult<Auction>>) => {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else if (result.value.handoverStatus === "done") toast(`Squads added to ${result.value.tournament}.`, { tone: "success" });
    else if (result.value.handoverStatus === "failed") toast(result.value.handoverError ?? "Squads were not added.", { tone: "error" });
  };

  const savePhone = async (playerId: string) => {
    const p = auction.players.find((x) => x.id === playerId);
    const phone = normalizePhone(phones[playerId]);
    if (!p || !phone) {
      toast("Enter a 10-digit mobile number.", { tone: "error" });
      return;
    }
    setBusy(true);
    const result = await auctionService.updatePlayer(auction.id, p.id, { ...p, phone });
    setBusy(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else toast(`Phone saved for ${p.name}.`, { tone: "success" });
  };

  if (done) {
    return (
      <Alert tone="success" title={`Squads added to ${auction.tournament}`}>
        Teams, rosters and tournament squads were created in CricsHub
        {auction.handedOverAt ? ` on ${formatWhen(auction.handedOverAt, auction.timezone)}` : ""}. Schedule matches from the
        tournament in the app.
      </Alert>
    );
  }

  // Auctions linked under the old flow push their squads automatically when they complete.
  if (!completed) {
    return linked ? (
      <p className="text-sm text-fg-muted">Teams and squads are added to {auction.tournament} automatically when the auction ends.</p>
    ) : null;
  }

  const phoneList = blocked && (
    <div className="space-y-2">
      <p className="text-sm text-fg-muted">
        Every sold player needs a phone number first. It finds their CricsHub account ({soldNoPhone.length} missing):
      </p>
      <ul className="space-y-2">
        {soldNoPhone.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="w-40 truncate">{p.name}</span>
            <Input
              aria-label={`Phone for ${p.name}`}
              inputMode="tel"
              placeholder="10-digit mobile"
              value={phones[p.id] ?? ""}
              onChange={(e) => setPhones({ ...phones, [p.id]: e.target.value })}
              className="max-w-[12rem]"
            />
            <Button size="xs" variant="outline" disabled={busy} onClick={() => savePhone(p.id)}>
              Save
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );

  if (linked) {
    return (
      <section className="space-y-3 rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-semibold">Linked to {auction.tournament}</h2>
        {auction.handoverStatus === "failed" && (
          <Alert tone="danger" title="Squads were not added to the tournament">
            {auction.handoverError}
          </Alert>
        )}
        {phoneList}
        <Button size="sm" disabled={busy || blocked} onClick={() => act(() => auctionService.handover(auction.id))}>
          {auction.handoverStatus === "failed" ? "Retry" : "Add teams and squads to tournament"}
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-card border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold">Link to CricsHub</h2>
      <p className="text-sm text-fg-muted">
        Add these teams and squads to a CricsHub tournament, so it can be scheduled and scored in the app. The auction doesn&apos;t create
        fixtures.
      </p>
      {phoneList}
      {creating ? (
        <CreateTournamentForm auction={auction} disabled={blocked} onCreated={() => setCreating(false)} onCancel={() => setCreating(false)} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {tournaments && tournaments.length === 0 ? (
            <span className="text-sm text-fg-subtle">You have no open tournaments to link.</span>
          ) : (
            <>
              <Select aria-label="Existing tournament" value={choice} onChange={(e) => setChoice(e.target.value)} className="max-w-xs">
                <option value="">{tournaments ? "Choose an existing tournament" : "Loading…"}</option>
                {(tournaments ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.startDate ? ` · ${t.startDate}` : ""}
                  </option>
                ))}
              </Select>
              <Button size="sm" disabled={!choice || busy || blocked} onClick={() => act(() => auctionService.linkTournament(auction.id, choice))}>
                Link and add squads
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" icon="ri-add-line" disabled={blocked} onClick={() => setCreating(true)}>
            Create a new tournament
          </Button>
        </div>
      )}
    </section>
  );
}

/** Cancel or end the auction, and the activity log. */
export function Settings({ auction }: { auction: Auction }) {
  const toast = useToast();
  const [confirm, setConfirm] = useState<"cancel" | "complete" | null>(null);
  const short = shortSquads(auction);
  const run = async (kind: "cancel" | "complete") => {
    setConfirm(null);
    const result = kind === "cancel" ? await auctionService.cancel(auction.id) : await auctionService.complete(auction.id);
    if (!result.ok) toast(result.error, { tone: "error" });
    else toast(kind === "cancel" ? "Auction cancelled." : "Auction completed.", { tone: "success" });
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold uppercase">Lifecycle</h2>
        <p className="text-sm text-fg-muted">
          Cancelling removes a draft or a live auction that has no sales; registered players are told. Completing is only possible when every player is
          sold, unsold, or withdrawn.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={auction.status === "completed" || auction.status === "cancelled"} onClick={() => setConfirm("cancel")}>
            Cancel auction
          </Button>
          <Button variant="danger" disabled={auction.status !== "live" && auction.status !== "paused"} onClick={() => setConfirm("complete")}>
            End auction
          </Button>
        </div>
      </div>
      <div>
        <h2 className="font-display text-lg font-bold uppercase">Activity</h2>
        <ol className="mt-3 max-h-[28rem] space-y-2 overflow-auto pr-1">
          {[...auction.events].reverse().map((event) => (
            <li key={event.id} className="text-sm">
              <span className={event.reverted ? "text-fg-subtle line-through" : "text-fg"}>{event.message}</span>
              <span className="mt-0.5 block text-xs text-fg-subtle">{formatWhen(event.at, auction.timezone)}</span>
            </li>
          ))}
        </ol>
      </div>
      <ConfirmDialog
        open={confirm === "cancel"}
        title="Cancel this auction?"
        body="Cancelled auctions cannot be started. Sales already recorded must be undone first."
        confirmLabel="Cancel auction"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => run("cancel")}
      />
      <ConfirmDialog
        open={confirm === "complete"}
        title={short.length ? "End with short squads?" : "End the auction?"}
        body={
          (short.length ? `Below the minimum squad: ${short.join(", ")}. Results will flag them. ` : "") +
          "This locks bidding. Every waiting player must already be sold, unsold, or withdrawn."
        }
        confirmLabel="End auction"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => run("complete")}
      />
    </div>
  );
}
