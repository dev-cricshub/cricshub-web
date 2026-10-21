"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserMatches } from "@/lib/api";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { AuctionStatusBadge } from "@/app/components/auction/chrome";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  IconTile,
  LiveBadge,
  Skeleton,
  useToast,
  cn,
} from "@/app/components/ui";
import { formatWhen } from "@/lib/auction/format";
import { readPendingInvite, type PendingInvite } from "@/lib/auction/invite";
import { auctionService, useAuctionList } from "@/lib/auction/store";
import type { AuctionListItem } from "@/lib/auction/types";
import { getStoredUser, type StoredUser } from "@/lib/session";

/*
 * Home: one place to pick up whatever the user came to do — stream a match or run an auction.
 * Live work from both modules is surfaced first; each module then gets a card with its next item
 * and its main actions. The full lists live on /stream and /auctions.
 */

// Only the fields Home reads from MatchResponse (see /stream for the full shape).
interface MatchSummary {
  id: string;
  team1: { name: string };
  team2: { name: string };
  tournamentResponse: { name: string } | null;
  matchDate: string | number[];
  matchTime: string | number[];
  venue: string;
  status: string;
}

function matchTs(m: MatchSummary): number {
  const d = Array.isArray(m.matchDate) ? new Date(m.matchDate[0], m.matchDate[1] - 1, m.matchDate[2]) : new Date(m.matchDate);
  if (m.matchTime) {
    const [h, min] = Array.isArray(m.matchTime) ? [m.matchTime[0], m.matchTime[1] ?? 0] : m.matchTime.split(":").map(Number);
    d.setHours(h, min);
  }
  return d.getTime();
}

function matchWhen(m: MatchSummary): string {
  const ts = matchTs(m);
  if (Number.isNaN(ts)) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(ts);
}

const isLiveAuction = (a: AuctionListItem) => a.status === "live" || a.status === "paused";

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  const auctions = useAuctionList();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [greeting, setGreeting] = useState("");
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [registrations, setRegistrations] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    setInvite(readPendingInvite());
    if (!u) return;
    fetchUserMatches(u.id)
      .then((rows) => setMatches(rows as MatchSummary[]))
      .catch(() => setMatches([]));
    void auctionService.myRegistrations().then((r) => setRegistrations(r.ok ? r.value.length : 0));
  }, []);

  const createAuction = async () => {
    if (creating) return;
    setCreating(true);
    const result = await auctionService.createDraft();
    setCreating(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else router.push(`/auctions/${result.value.id}/setup`);
  };

  const liveMatches = (matches ?? []).filter((m) => m.status === "Live");
  const upcomingMatches = (matches ?? []).filter((m) => m.status === "Upcoming").sort((a, b) => matchTs(a) - matchTs(b));
  const activeAuctions = (auctions ?? []).filter((a) => !a.archived);
  const liveAuctions = activeAuctions.filter(isLiveAuction);
  const nextAuction = activeAuctions
    .filter((a) => a.status === "draft" || a.status === "scheduled")
    .sort((a, b) => (a.startsAt || "9").localeCompare(b.startsAt || "9"))[0];
  const liveCount = liveMatches.length + liveAuctions.length;

  return (
    <>
      <AppHeader />

      <main className="container-page space-y-6 py-6 sm:space-y-8 sm:py-10">
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-muted">{greeting ? `${greeting},` : " "}</p>
          <h1 className="font-display text-3xl font-bold uppercase leading-none text-fg sm:text-4xl">
            {user?.name ?? <Skeleton className="h-8 w-48" />}
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted sm:text-base">What are you working on today?</p>
        </div>

        {invite && (
          <Alert
            tone="info"
            icon="ri-user-add-line"
            title={`Finish registering${invite.auctionName ? ` for ${invite.auctionName}` : ""}`}
            action={
              <ButtonLink href={`/join/${invite.code}`} size="sm" className="w-full sm:w-auto">
                Continue registration
              </ButtonLink>
            }
          >
            You opened a player invite before signing in.
          </Alert>
        )}

        {/* Live across both modules: the thing the user most likely came back for */}
        {liveCount > 0 && (
          <section aria-labelledby="live-now" className="space-y-3">
            <h2 id="live-now" className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide text-fg">
              Live now
            </h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {liveMatches.map((m) => (
                <LiveRow
                  key={`m-${m.id}`}
                  href={`/stream/${m.id}`}
                  icon="ri-broadcast-line"
                  kind="Match"
                  title={`${m.team1.name} vs ${m.team2.name}`}
                  meta={m.tournamentResponse?.name ?? m.venue}
                  action="Open studio"
                />
              ))}
              {liveAuctions.map((a) => (
                <LiveRow
                  key={`a-${a.id}`}
                  href={`/auctions/${a.id}/live`}
                  icon="ri-auction-line"
                  kind={a.status === "paused" ? "Auction · paused" : "Auction"}
                  title={a.name}
                  meta={a.tournament}
                  action={a.status === "paused" ? "Resume" : "Open console"}
                />
              ))}
            </ul>
          </section>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <ModuleCard
            icon="ri-broadcast-line"
            title="Stream Studio"
            body="Live score overlays and stream controls for your YouTube broadcast."
            stats={[
              { label: "Live", value: matches ? liveMatches.length : null, live: liveMatches.length > 0 },
              { label: "Upcoming", value: matches ? upcomingMatches.length : null },
            ]}
            next={
              matches == null ? null : upcomingMatches[0] ? (
                <NextItem
                  href={`/stream/${upcomingMatches[0].id}`}
                  label="Next match"
                  title={`${upcomingMatches[0].team1.name} vs ${upcomingMatches[0].team2.name}`}
                  meta={matchWhen(upcomingMatches[0])}
                />
              ) : (
                <EmptyNext>
                  Create a match in the CricsHub app — it shows up here, ready to stream.
                </EmptyNext>
              )
            }
            actions={
              <>
                <ButtonLink href="/stream" icon="ri-broadcast-line" className="flex-1 sm:flex-none">
                  Open Stream Studio
                </ButtonLink>
                <ButtonLink href="/pricing" variant="outline" icon="ri-vip-crown-line" className="flex-1 sm:flex-none">
                  Overlay plans
                </ButtonLink>
              </>
            }
          />

          <ModuleCard
            icon="ri-auction-line"
            title="Auctions"
            body="Register players, run live bidding and hand squads to your tournament."
            stats={[
              { label: "Live", value: auctions ? liveAuctions.length : null, live: liveAuctions.length > 0 },
              { label: "Active", value: auctions ? activeAuctions.length : null },
              { label: "Registered", value: registrations, href: "/auctions/registrations" },
            ]}
            next={
              auctions == null ? null : nextAuction ? (
                <NextItem
                  href={`/auctions/${nextAuction.id}${nextAuction.status === "draft" ? "/setup" : ""}`}
                  label={nextAuction.status === "draft" ? "Continue setup" : "Next auction"}
                  title={nextAuction.name}
                  meta={nextAuction.startsAt ? formatWhen(nextAuction.startsAt, nextAuction.timezone) : "Date not set"}
                  badge={<AuctionStatusBadge status={nextAuction.status} />}
                />
              ) : (
                <EmptyNext>Set up teams, purses and a player pool, then run the bidding live.</EmptyNext>
              )
            }
            actions={
              <>
                <Button icon="ri-add-line" onClick={createAuction} loading={creating} className="flex-1 sm:flex-none">
                  New auction
                </Button>
                <ButtonLink href="/auctions" variant="outline" icon="ri-list-check" className="flex-1 sm:flex-none">
                  All auctions
                </ButtonLink>
              </>
            }
          />
        </div>

        {!user?.hasSubscription && (
          <Link
            href="/pricing"
            className="flex items-center gap-3 rounded-card border border-line bg-surface-2/60 p-4 text-sm transition-colors hover:border-primary/40"
          >
            <IconTile icon="ri-vip-crown-line" tone="warning" size="sm" />
            <span className="min-w-0 flex-1 text-fg-muted">
              <span className="font-medium text-fg">Make your streams look pro.</span> Unlock overlay bundles for a match or
              subscribe for all of them.
            </span>
            <i className="ri-arrow-right-s-line text-lg text-fg-subtle" aria-hidden />
          </Link>
        )}
      </main>
    </>
  );
}

function LiveRow({
  href,
  icon,
  kind,
  title,
  meta,
  action,
}: {
  href: string;
  icon: string;
  kind: string;
  title: string;
  meta?: string;
  action: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-card border border-live/30 bg-surface p-4 shadow-card transition-colors hover:border-live/60"
      >
        <IconTile icon={icon} tone="danger" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-xs text-fg-muted">
            <LiveBadge />
            {kind}
          </span>
          <span className="mt-1 block truncate font-medium text-fg">{title}</span>
          {meta && <span className="block truncate text-xs text-fg-subtle">{meta}</span>}
        </span>
        <span className="hidden flex-shrink-0 text-sm font-medium text-live sm:inline">{action}</span>
        <i className="ri-arrow-right-s-line text-lg text-fg-subtle" aria-hidden />
      </Link>
    </li>
  );
}

function ModuleCard({
  icon,
  title,
  body,
  stats,
  next,
  actions,
}: {
  icon: string;
  title: string;
  body: string;
  stats: { label: string; value: number | null; live?: boolean; href?: string }[];
  next: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <Card padding="none" className="flex flex-col">
      <div className="flex items-start gap-3 p-5 pb-4">
        <IconTile icon={icon} size="lg" />
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-fg">{title}</h2>
          <p className="mt-0.5 text-sm text-fg-muted">{body}</p>
        </div>
      </div>

      <dl className={cn("mx-5 grid divide-x divide-line rounded-xl border border-line bg-surface-2/50", stats.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {stats.map((s) => {
          const value =
            s.value == null ? (
              <span className="skeleton inline-block h-6 w-6 align-middle" aria-hidden />
            ) : (
              <span className={cn(s.live && "text-live")}>{s.value}</span>
            );
          return (
            <div key={s.label} className="min-w-0 px-3 py-2.5">
              <dt className="truncate text-2xs font-medium uppercase tracking-wider text-fg-subtle">{s.label}</dt>
              <dd className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-fg">
                {s.href ? (
                  <Link href={s.href} className="hover:text-primary">
                    {value}
                  </Link>
                ) : (
                  value
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="flex-1 px-5 py-4">{next ?? <Skeleton className="h-14 w-full" />}</div>

      <div className="flex flex-wrap gap-2 border-t border-line p-4 sm:px-5">{actions}</div>
    </Card>
  );
}

function NextItem({ href, label, title, meta, badge }: { href: string; label: string; title: string; meta?: string; badge?: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl p-2 -m-2 transition-colors hover:bg-surface-2">
      <span className="min-w-0 flex-1">
        <span className="text-xs font-medium text-fg-subtle">{label}</span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className="truncate font-medium text-fg">{title}</span>
          {badge}
        </span>
        {meta && <span className="block truncate text-xs text-fg-muted">{meta}</span>}
      </span>
      <i className="ri-arrow-right-s-line text-lg text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function EmptyNext({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-fg-muted">{children}</p>;
}
