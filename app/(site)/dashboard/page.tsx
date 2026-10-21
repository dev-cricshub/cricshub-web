"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserMatches } from "@/lib/api";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { primaryBtn, secondaryBtn } from "@/app/components/layout/appStyles";
import { Alert, ButtonLink, Skeleton, useToast, cn } from "@/app/components/ui";
import { formatWhen } from "@/lib/auction/format";
import { readPendingInvite, type PendingInvite } from "@/lib/auction/invite";
import { auctionService, useAuctionList } from "@/lib/auction/store";
import type { AuctionListItem } from "@/lib/auction/types";
import { getStoredUser, type StoredUser } from "@/lib/session";
import { PLAY_STORE_URL } from "@/lib/site";

/*
 * Home: one place to pick up whatever the user came to do — stream a match or run an auction.
 * A "next step" banner surfaces the most urgent thing across both modules; each module then gets
 * a card with what it does, the user's own items and its main actions. Full lists live on
 * /stream and /auctions.
 */

// Only the fields Home reads from MatchResponse (see /stream for the full shape).
interface MatchSummary {
  id: string;
  team1: { name: string };
  team2: { name: string };
  tournamentResponse: { name: string } | null;
  venue: string;
  status: string;
}

const isLiveAuction = (a: AuctionListItem) => a.status === "live" || a.status === "paused";
const isSetupAuction = (a: AuctionListItem) => a.status === "draft" || a.status === "scheduled";

/** What a draft still needs, from the fields the list carries. Mirrors the setup wizard's order. */
function setupChecklist(a: AuctionListItem) {
  const items = [
    { done: a.name.trim() !== "" && a.name !== "Untitled auction", todo: "name your auction" },
    { done: a.teamCount >= 2, todo: "add at least 2 teams" },
    { done: a.playerCount > 0, todo: "add players or open registration" },
    { done: a.status === "scheduled", todo: "review and schedule it" },
  ];
  return { done: items.filter((i) => i.done).length, total: items.length, next: items.find((i) => !i.done)?.todo };
}

interface NextStep {
  eyebrow: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
  live?: boolean;
  progress?: { done: number; total: number };
}

/** The single most useful thing to do next: live work first, then unfinished setup, then what's coming up. */
function pickNextStep(matches: MatchSummary[], auctions: AuctionListItem[]): NextStep | null {
  const liveAuction = auctions.find(isLiveAuction);
  if (liveAuction) {
    const paused = liveAuction.status === "paused";
    return {
      eyebrow: "Happening now",
      title: `${liveAuction.name} auction is ${paused ? "paused" : "live"}`,
      sub: `${liveAuction.playerCount} players · ${liveAuction.teamCount} teams`,
      cta: paused ? "Resume auction" : "Open live room",
      href: `/auctions/${liveAuction.id}/live`,
      live: true,
    };
  }
  const liveMatch = matches.find((m) => m.status === "Live");
  if (liveMatch) {
    return {
      eyebrow: "Happening now",
      title: `${liveMatch.team1.name} v ${liveMatch.team2.name} is live`,
      sub: liveMatch.tournamentResponse?.name ?? (liveMatch.venue || "Individual match"),
      cta: "Open controls",
      href: `/stream/${liveMatch.id}`,
      live: true,
    };
  }
  const draft = auctions.find((a) => a.status === "draft");
  if (draft) {
    const check = setupChecklist(draft);
    return {
      eyebrow: "Pick up where you left off",
      title: `Finish setting up ${draft.name}`,
      sub: [check.next && `Next: ${check.next}`, draft.startsAt && `auction on ${formatWhen(draft.startsAt, draft.timezone)}`]
        .filter(Boolean)
        .join(" · "),
      cta: "Continue setup",
      href: `/auctions/${draft.id}`,
      progress: check,
    };
  }
  const scheduled = auctions.find((a) => a.status === "scheduled");
  if (scheduled) {
    return {
      eyebrow: "Coming up",
      title: `${scheduled.name} auction`,
      sub: `${scheduled.startsAt ? formatWhen(scheduled.startsAt, scheduled.timezone) : "Date not set"} · ${scheduled.teamCount} teams · ${scheduled.playerCount} players`,
      cta: "Open auction",
      href: `/auctions/${scheduled.id}`,
    };
  }
  return null;
}

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  const auctions = useAuctionList();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [greeting, setGreeting] = useState("");
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [invite, setInvite] = useState<PendingInvite | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    const now = new Date();
    const h = now.getHours();
    const day = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
    setGreeting(`${h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"} · ${day}`);
    setInvite(readPendingInvite());
    if (!u) return;
    fetchUserMatches(u.id)
      .then((rows) => setMatches(rows as MatchSummary[]))
      .catch(() => setMatches([]));
  }, []);

  const createAuction = async () => {
    if (creating) return;
    setCreating(true);
    const result = await auctionService.createDraft();
    setCreating(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else router.push(`/auctions/${result.value.id}`);
  };

  const liveMatches = (matches ?? []).filter((m) => m.status === "Live");
  // Live first, then setup in progress, then everything else by most recently touched.
  const rank = (a: AuctionListItem) => (isLiveAuction(a) ? 0 : isSetupAuction(a) ? 1 : 2);
  const myAuctions = (auctions ?? [])
    .filter((a) => !a.archived && a.status !== "cancelled")
    .sort((a, b) => rank(a) - rank(b) || b.updatedAt.localeCompare(a.updatedAt));
  const next = matches && auctions ? pickNextStep(matches, myAuctions) : null;

  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_1100px_420px_at_50%_-120px,rgb(74_158_224/0.18),transparent_70%)]">
      <AppHeader
        badges={{
          "/stream": liveMatches.length > 0 ? <LivePill /> : undefined,
          "/auctions": myAuctions.length > 0 ? <CountPill n={myAuctions.length} /> : undefined,
        }}
      />

      <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-4 pb-14 pt-6 sm:gap-6 sm:px-7 sm:pt-8">
        {/* Greeting */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-[640px] flex-col gap-1.5">
            <span className="text-sm text-fg-subtle">{greeting || " "}</span>
            <h1 className="text-[26px] font-bold tracking-[-0.03em] text-fg sm:text-[30px]">
              {user?.name ?? <Skeleton className="h-8 w-48" />}
            </h1>
            <p className="text-sm leading-relaxed text-fg-muted">
              This is your CricsHub web dashboard. Score matches in the app, then come here to{" "}
              <b className="font-semibold text-fg">stream them</b> with live overlays or{" "}
              <b className="font-semibold text-fg">run player auctions</b> for your league.
            </p>
          </div>
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={secondaryBtn}>
            <i className="ri-smartphone-line text-[15px]" aria-hidden />
            Get the CricsHub app
          </a>
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

        {next && <NextStepBanner step={next} />}

        <div className="grid gap-[18px] lg:grid-cols-2">
          {/* ── Stream Studio ── */}
          <ModuleCard
            art={<StreamArt />}
            icon="ri-broadcast-line"
            title="Stream Studio"
            body="Turn any match you score in the CricsHub app into a TV-style broadcast. Add our score overlay to your YouTube stream and it updates by itself on every ball."
            chips={["Free score overlay", "OBS & vMix", "Updates every ball"]}
            actions={
              <>
                <Link href="/stream" className={primaryBtn}>
                  <i className="ri-broadcast-line text-[15px]" aria-hidden />
                  Open Stream Studio
                </Link>
                <Link href="/pricing" className={secondaryBtn}>
                  Overlay plans
                </Link>
              </>
            }
          />

          {/* ── Auctions ── */}
          <ModuleCard
            art={<AuctionArt />}
            icon="ri-auction-line"
            title="Auctions"
            body="Run an IPL-style player auction for your league. Players sign up with a link, team owners bid live from a laptop, and finished squads go straight into your tournament."
            chips={["Registration link", "Live bidding room", "Spectator screen"]}
            actions={
              <>
                <button type="button" onClick={createAuction} disabled={creating} className={primaryBtn}>
                  <i className={cn(creating ? "ri-loader-4-line animate-spin" : "ri-add-line", "text-[15px]")} aria-hidden />
                  New auction
                </button>
                <Link href="/auctions" className={secondaryBtn}>
                  All auctions
                </Link>
                <Link href="/auctions/registrations" className={cn(secondaryBtn, "border-transparent bg-transparent")}>
                  My registrations
                </Link>
              </>
            }
          />
        </div>

        <Link
          href="/pricing"
          className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface-2 px-4 py-3.5 transition-colors hover:border-line-strong sm:px-5"
        >
          <IconBox icon="ri-vip-crown-line" />
          <span className="min-w-0 flex-1 text-[13px] text-fg-muted">
            {user?.hasSubscription ? (
              <>
                <b className="font-semibold text-fg">Active plan.</b> Premium overlay bundles unlock on every match you stream.
              </>
            ) : (
              <>
                <b className="font-semibold text-fg">Free plan.</b> The standard overlay is free. Premium overlay bundles start at ₹49 per match.
              </>
            )}
          </span>
          <span className="hidden text-[13px] font-semibold text-primary-soft-fg sm:inline">{user?.hasSubscription ? "Manage plan" : "See plans"}</span>
          <Chevron />
        </Link>
      </main>
    </div>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────


function PulseDot() {
  return <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent animate-pulse motion-reduce:animate-none" aria-hidden />;
}

function LivePill() {
  return (
    <span className="flex h-[18px] items-center gap-1 rounded-full bg-accent/20 px-1.5 text-[10px] font-bold tracking-[0.05em] text-primary-soft-fg">
      <PulseDot />
      LIVE
    </span>
  );
}

function CountPill({ n }: { n: number }) {
  return (
    <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-line px-1.5 text-[10px] font-bold text-white">
      {n}
    </span>
  );
}

function Chevron() {
  return <i className="ri-arrow-right-s-line flex-shrink-0 text-lg text-fg-subtle" aria-hidden />;
}

function IconBox({ icon, className }: { icon: string; className?: string }) {
  return (
    <span className={cn("flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-accent-soft", className)}>
      <i className={cn(icon, "text-lg")} aria-hidden />
    </span>
  );
}

function NextStepBanner({ step }: { step: NextStep }) {
  // Ring: r=22 → circumference ≈ 138.2
  const C = 138.2;
  return (
    <Link
      href={step.href}
      className="flex flex-col gap-4 rounded-[18px] border border-line-accent bg-[linear-gradient(115deg,rgb(var(--raised))_0%,rgb(var(--surface-2))_70%)] px-4 py-4 transition-colors hover:border-accent/60 sm:flex-row sm:items-center sm:gap-[18px] sm:px-5"
    >
      <span className="flex min-w-0 flex-1 items-center gap-4">
        <span className="relative h-12 w-12 flex-shrink-0">
          {step.progress ? (
            <>
              <svg width="48" height="48" viewBox="0 0 52 52" aria-hidden>
                <circle cx="26" cy="26" r="22" fill="none" stroke="rgb(var(--line))" strokeWidth="5" />
                <circle
                  cx="26"
                  cy="26"
                  r="22"
                  fill="none"
                  stroke="rgb(var(--accent))"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${((C * step.progress.done) / step.progress.total).toFixed(1)} ${C}`}
                  transform="rotate(-90 26 26)"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-fg">
                {step.progress.done}/{step.progress.total}
                <span className="sr-only"> setup steps done</span>
              </span>
            </>
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-[5px] border-line text-accent">
              <i className={cn(step.live ? "ri-live-line" : "ri-calendar-event-line", "text-lg", step.live && "animate-pulse motion-reduce:animate-none")} aria-hidden />
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-soft-fg">{step.eyebrow}</span>
          <span className="truncate text-base font-semibold text-fg">{step.title}</span>
          {step.sub && <span className="text-[13px] text-fg-muted">{step.sub}</span>}
        </span>
      </span>
      <span className={cn(primaryBtn, "justify-center")}>
        {step.cta}
        <i className="ri-arrow-right-line text-[15px]" aria-hidden />
      </span>
    </Link>
  );
}

function ModuleCard({
  art,
  icon,
  title,
  body,
  chips,
  actions,
}: {
  art: React.ReactNode;
  icon: string;
  title: string;
  body: string;
  chips: string[];
  actions: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${title}-heading`} className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-surface-2">
      {art}
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-5 sm:px-[22px]">
        <div className="flex items-center gap-2.5">
          <IconBox icon={icon} />
          <h2 id={`${title}-heading`} className="text-[19px] font-semibold tracking-[-0.02em] text-fg">
            {title}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-fg-lead">{body}</p>
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <li key={c} className="flex h-7 items-center gap-1.5 rounded-full border border-line bg-well px-2.5 text-xs font-medium text-fg-lead">
              <i className="ri-check-line text-sm text-accent" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3.5 sm:px-[22px]">{actions}</div>
    </section>
  );
}

// ─── Decorative previews (aria-hidden): what each module looks like in use ──

function StreamArt() {
  return (
    <div
      aria-hidden
      className="relative h-[150px] overflow-hidden bg-[radial-gradient(ellipse_80%_90%_at_70%_0%,rgba(95,168,232,0.35),transparent_70%),linear-gradient(160deg,#142544_0%,rgb(var(--well))_100%)] sm:h-[170px]"
    >
      <div className="absolute inset-x-4 -bottom-[18px] top-[22px] overflow-hidden rounded-[14px] border border-line-strong bg-[repeating-linear-gradient(90deg,#17392B_0_46px,#1B4132_46px_92px)] shadow-[0_20px_40px_rgba(0,0,0,0.45)] sm:inset-x-[22px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_60%,transparent_0%,rgba(4,8,14,0.65)_100%)]" />
        <div className="absolute left-1/2 top-[18%] -ml-[17px] h-[64%] w-[34px] rounded-[3px] bg-[#C9B78A] opacity-50" />
        <span className="absolute left-3 top-2.5 rounded bg-[#D93025] px-1.5 py-[3px] text-[9px] font-extrabold tracking-[0.1em] text-white">LIVE</span>
        <span className="absolute right-3 top-2.5 rounded-[5px] bg-[rgba(10,14,23,0.6)] px-[7px] py-[3px] text-[10px] font-bold text-white">
          CRICS<span className="text-accent">HUB</span>
        </span>
        <div className="absolute inset-x-3 bottom-[30px] flex overflow-hidden rounded-[9px] border border-accent-soft/30 bg-[rgba(10,14,23,0.82)] text-white">
          <span className="bg-[#2F6DB8] px-2.5 py-1.5 text-[13px] font-bold">MUM</span>
          <span className="px-2.5 py-1.5 text-sm font-bold">
            142/4 <span className="text-[11px] text-fg-muted">16.2</span>
          </span>
          <span className="hidden items-center border-l border-accent-soft/20 px-2.5 py-1.5 text-[10px] text-[#C9D3E2] min-[420px]:flex">Iyer 47* (29)</span>
          <span className="ml-auto flex items-center px-2.5 py-1.5 text-[11px] font-bold text-accent">Need 36 off 22</span>
        </div>
      </div>
    </div>
  );
}

function AuctionArt() {
  return (
    <div
      aria-hidden
      className="relative h-[150px] overflow-hidden bg-[radial-gradient(ellipse_80%_90%_at_30%_0%,rgba(108,123,255,0.32),transparent_70%),linear-gradient(160deg,#1A2150_0%,rgb(var(--well))_100%)] sm:h-[170px]"
    >
      <div className="absolute left-4 top-[22px] flex w-[60%] flex-col gap-2 rounded-[14px] border border-line-accent bg-[rgba(17,24,39,0.92)] px-3.5 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.45)] sm:left-[22px] sm:w-[58%]">
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.08em] text-primary-soft-fg">
          <PulseDot />
          ON THE BLOCK · LOT 16
        </span>
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent bg-well text-[11px] font-bold text-white">44</span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-semibold text-white">Test Player 044</span>
            <span className="truncate text-[10px] text-fg-subtle">All-rounder · base ₹50,000</span>
          </span>
        </span>
        <span className="flex items-end justify-between border-t border-accent-soft/20 pt-2">
          <span className="text-[17px] font-bold text-white">₹1,40,000</span>
          <span className="text-[10px] font-semibold text-primary-soft-fg">Titans lead</span>
        </span>
      </div>
      <div className="absolute right-4 top-[30px] flex w-[30%] flex-col gap-1.5 text-center text-[11px] sm:right-[22px]">
        <span className="rounded-[10px] bg-[#2F6DB8] px-2.5 py-[7px] font-bold text-white shadow-[0_8px_18px_rgba(47,109,184,0.4)]">Bid ₹1,50,000</span>
        <span className="truncate rounded-[10px] border border-line-strong bg-[rgba(17,24,39,0.9)] px-2.5 py-[7px] font-semibold text-[#C9D3E2]">Strikers · ₹6.2 L left</span>
        <span className="rounded-[10px] border border-line-strong bg-[rgba(17,24,39,0.9)] px-2.5 py-[7px] font-semibold text-[#C9D3E2]">00:18 left</span>
      </div>
      <i className="ri-auction-line absolute -bottom-9 -right-5 text-[120px] leading-none text-[#6C7BFF] opacity-[0.22]" />
    </div>
  );
}
