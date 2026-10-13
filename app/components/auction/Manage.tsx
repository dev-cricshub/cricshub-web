"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { AuctionSubnav, ConfirmDialog, PlayerStateBadge, Select, downloadText } from "@/app/components/auction/chrome";
import { Alert, Badge, Button, ButtonLink, Card, EmptyState, Input, Tabs, useToast } from "@/app/components/ui";
import { squadsToCsv } from "@/lib/auction/csv";
import {
  highestBid,
  queue,
  roleCounts,
  squadOf,
  teamBudget,
  teamRemaining,
  teamSpent,
  validateConfig,
} from "@/lib/auction/engine";
import { formatWhen, inr } from "@/lib/auction/format";
import { auctionService } from "@/lib/auction/store";
import type { Auction, PlayerRole, PlayerState } from "@/lib/auction/types";
import { PLAYER_ROLES, ROLE_LABEL } from "@/lib/auction/types";

const SECTIONS = ["overview", "teams", "players", "rules", "results", "settings"] as const;
type Section = (typeof SECTIONS)[number];

export function Manage({ auction }: { auction: Auction }) {
  const params = useSearchParams();
  const router = useRouter();
  const requested = params.get("section");
  const section: Section = SECTIONS.includes(requested as Section) ? (requested as Section) : "overview";
  const setSection = (key: Section) => {
    const url = key === "overview" ? `/auctions/${auction.id}` : `/auctions/${auction.id}?section=${key}`;
    router.replace(url);
  };

  return (
    <>
      <AppHeader context={auction.name} />
      <main className="container-page space-y-6 py-6 sm:py-10">
        <AuctionSubnav auction={auction} />
        <Tabs
          ariaLabel="Auction sections"
          value={section}
          onChange={setSection}
          items={[
            { key: "overview", label: "Overview" },
            { key: "teams", label: "Teams", count: auction.teams.length },
            { key: "players", label: "Players", count: auction.players.length },
            { key: "rules", label: "Rules" },
            { key: "results", label: "Results" },
            { key: "settings", label: "Settings" },
          ]}
        />
        {section === "overview" && <Overview auction={auction} />}
        {section === "teams" && <Teams auction={auction} />}
        {section === "players" && <Players auction={auction} />}
        {section === "rules" && <Rules auction={auction} />}
        {section === "results" && <Results auction={auction} />}
        {section === "settings" && <Settings auction={auction} />}
      </main>
    </>
  );
}

function Overview({ auction }: { auction: Auction }) {
  const toast = useToast();
  const router = useRouter();
  const issues = validateConfig(auction);
  const sold = auction.players.filter((p) => p.status === "sold").length;
  const unsold = auction.players.filter((p) => p.status === "unsold").length;
  const roles = roleCounts(auction.players);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Starts</p>
          <p className="mt-1 font-medium">{formatWhen(auction.startsAt, auction.timezone)}</p>
          <p className="text-xs text-fg-subtle">{auction.timezone}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Sold / unsold</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">
            {sold} <span className="text-fg-subtle">/</span> {unsold}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Still to come</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{queue(auction).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Purse each</p>
          <p className="mt-1 font-medium tabular-nums">{inr(auction.rules.pursePerTeam)}</p>
        </Card>
      </div>
      {issues.length > 0 && (auction.status === "draft" || auction.status === "scheduled") && (
        <Alert tone="warning" title="Setup is incomplete" action={<ButtonLink href={`/auctions/${auction.id}/setup`} size="sm">Continue setup</ButtonLink>}>
          {issues[0].message}
          {issues.length > 1 ? ` and ${issues.length - 1} more.` : ""}
        </Alert>
      )}
      <div className="flex flex-wrap gap-2 text-sm text-fg-muted">
        {PLAYER_ROLES.map((role) => (
          <span key={role} className="rounded-control bg-surface px-2 py-1 ring-1 ring-line">
            {ROLE_LABEL[role]} <span className="font-mono text-fg">{roles[role]}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {auction.status === "scheduled" && (
          <Button
            onClick={() => {
              const result = auctionService.start(auction.id);
              if (!result.ok) toast(result.error, { tone: "error" });
              else router.push(`/auctions/${auction.id}/live`);
            }}
          >
            Start auction
          </Button>
        )}
        {(auction.status === "live" || auction.status === "paused") && (
          <ButtonLink href={`/auctions/${auction.id}/live`}>Open live console</ButtonLink>
        )}
        <ButtonLink href={`/auctions/${auction.id}/watch`} variant="outline">
          Spectator view
        </ButtonLink>
      </div>
    </div>
  );
}

function Teams({ auction }: { auction: Auction }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {auction.teams.length === 0 ? (
        <EmptyState icon="ri-team-line" title="No teams" description="Add teams from setup before the auction starts." />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {auction.teams.map((team) => {
            const squad = squadOf(auction, team.id);
            const budget = teamBudget(auction, team);
            const spent = teamSpent(auction, team.id);
            const remaining = teamRemaining(auction, team.id);
            const full = squad.length >= auction.rules.maxSquad || remaining <= 0;
            return (
              <li key={team.id}>
                <button type="button" onClick={() => setOpen(team.id)} className="w-full rounded-card border border-line bg-surface p-4 text-left hover:border-primary/40">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-md" style={{ background: team.color }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold uppercase tracking-wide">{team.shortName}</p>
                      <p className="truncate text-sm text-fg-muted">{team.name}</p>
                    </div>
                    {full && <Badge tone="warning">At limit</Badge>}
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-xs text-fg-subtle">Spent</dt>
                      <dd className="tabular-nums">{inr(spent)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-fg-subtle">Left</dt>
                      <dd className="tabular-nums">{inr(remaining)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-fg-subtle">Squad</dt>
                      <dd className="tabular-nums">
                        {squad.length}/{auction.rules.maxSquad}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-2 text-xs text-fg-subtle">Budget {inr(budget)}{team.ownerName ? ` · ${team.ownerName}` : ""}</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {open && <TeamDrawer auction={auction} teamId={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function TeamDrawer({ auction, teamId, onClose }: { auction: Auction; teamId: string; onClose: () => void }) {
  const team = auction.teams.find((t) => t.id === teamId);
  if (!team) return null;
  const squad = squadOf(auction, team.id);
  const history = auction.events.filter((e) => !e.reverted && (e.payload.teamId === team.id || squad.some((p) => p.id === e.payload.playerId)));
  const roles = roleCounts(squad.map((p) => ({ ...p, status: "available" as const })));
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold uppercase">{team.name}</h2>
          <p className="text-sm text-fg-muted">{team.ownerName || "No representative listed"}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="mt-3 text-sm text-fg-muted">
        {PLAYER_ROLES.map((role) => `${ROLE_LABEL[role]} ${roles[role]}`).join(" · ")}
      </p>
      {squad.length === 0 ? (
        <p className="mt-4 text-sm text-fg-subtle">No players bought yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {squad.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {p.name} <span className="text-fg-subtle">{ROLE_LABEL[p.role]}</span>
              </span>
              <span className="tabular-nums">{inr(p.soldPrice ?? 0)}</span>
            </li>
          ))}
        </ul>
      )}
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-fg-subtle">Related activity</h3>
      <ul className="mt-2 space-y-1 text-sm text-fg-muted">
        {history.slice(-8).reverse().map((e) => (
          <li key={e.id}>{e.message}</li>
        ))}
        {history.length === 0 && <li>No transactions yet.</li>}
      </ul>
    </Card>
  );
}

function Players({ auction }: { auction: Auction }) {
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

  const withdrawSelected = () => {
    let failed = 0;
    for (const id of selected) {
      const result = auctionService.withdraw(auction.id, id);
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
                    <span className="mt-0.5 block text-xs text-fg-subtle">
                      {p.category} · {p.overseas ? "Overseas" : p.nationality} · {p.matches} matches
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
                        onClick={() => {
                          const result = auctionService.reopen(auction.id, p.id);
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

function Rules({ auction }: { auction: Auction }) {
  return (
    <div className="max-w-2xl space-y-3 text-sm">
      <p className="text-fg-muted">
        Purse {inr(auction.rules.pursePerTeam)} · squad {auction.rules.minSquad}–{auction.rules.maxSquad} · overseas{" "}
        {auction.rules.overseasLimit ?? "no cap"} · overrides {auction.rules.allowPurseOverride ? "allowed" : "off"}
      </p>
      <ul className="space-y-1">
        {auction.rules.increments.map((slab, i) => (
          <li key={i} className="text-fg-muted">
            Step {inr(slab.step)} {slab.upTo == null ? "thereafter" : `below ${inr(slab.upTo)}`}
          </li>
        ))}
      </ul>
      <ul className="space-y-1">
        {auction.rules.roleLimits.map((limit) => (
          <li key={limit.role} className="text-fg-muted">
            {ROLE_LABEL[limit.role]}: min {limit.min}
            {limit.max != null ? `, max ${limit.max}` : ""}
          </li>
        ))}
      </ul>
      {(auction.status === "draft" || auction.status === "scheduled") && (
        <ButtonLink href={`/auctions/${auction.id}/setup`} variant="outline" size="sm">
          Edit in setup
        </ButtonLink>
      )}
      {auction.status !== "draft" && auction.status !== "scheduled" && (
        <Alert tone="info" title="Rules are locked">
          Purse, increments and squad limits stay as they were when the auction started.
        </Alert>
      )}
    </div>
  );
}

function Results({ auction }: { auction: Auction }) {
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
      {auction.teams.map((team) => {
        const squad = squadOf(auction, team.id);
        return (
          <section key={team.id} className="rounded-card border border-line bg-surface">
            <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="font-display text-lg font-bold uppercase">{team.name}</h2>
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

function Settings({ auction }: { auction: Auction }) {
  const toast = useToast();
  const [confirm, setConfirm] = useState<"cancel" | "complete" | null>(null);
  const run = (kind: "cancel" | "complete") => {
    const result = kind === "cancel" ? auctionService.cancel(auction.id) : auctionService.complete(auction.id);
    if (!result.ok) toast(result.error, { tone: "error" });
    else toast(kind === "cancel" ? "Auction cancelled." : "Auction completed.", { tone: "success" });
    setConfirm(null);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold uppercase">Lifecycle</h2>
        <p className="text-sm text-fg-muted">
          Cancelling removes a draft or a live auction that has no sales. Completing is only possible when every player is sold, unsold, or withdrawn.
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
        title="End the auction?"
        body="This locks bidding. Every waiting player must already be sold, unsold, or withdrawn."
        confirmLabel="End auction"
        danger
        onClose={() => setConfirm(null)}
        onConfirm={() => run("complete")}
      />
    </div>
  );
}

export function currentBidLabel(auction: Auction): string {
  const playerId = auction.currentPlayerId;
  if (!playerId) return "—";
  const bid = highestBid(auction, playerId);
  return bid ? inr(bid.amount) : "No bid yet";
}
