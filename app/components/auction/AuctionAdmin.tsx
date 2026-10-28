"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/app/components/layout/AppHeader";
import { primaryBtn, secondaryBtn, softBtn } from "@/app/components/layout/appStyles";
import { PendingStartDialog } from "@/app/components/auction/chrome";
import { PlayerPool, Results, Settings } from "@/app/components/auction/AdminPanels";
import { DEFAULT_REGISTRATION, RegistrationsPanel, useRegistrations } from "@/app/components/auction/Registrations";
import { CsvImport, DetailsForm, PendingQueue, PlayerEditor, TEAM_COLORS, TIME_ZONES, TeamEditor } from "@/app/components/auction/SetupForms";
import { Input, Modal, Switch, useToast, cn } from "@/app/components/ui";
import { editable, highestBid, playerById, queue, squadOf, teamBudget, teamById, teamRemaining, teamSpent, validateConfig } from "@/lib/auction/engine";
import { formatWhen, fromDateTimeLocal, inr, toDateTimeLocal } from "@/lib/auction/format";
import { auctionService } from "@/lib/auction/store";
import type { Auction, AuctionRules, AuctionTeam } from "@/lib/auction/types";
import { PLAYER_ROLES, ROLE_LABEL } from "@/lib/auction/types";

/*
 * The auctioneer's single place for an auction: set it up, follow it live and read the results.
 * Sections live in ?section= so they survive reloads and can be linked to. Bidding itself stays in
 * the live console (/auctions/{id}/live), which "Live room" opens.
 */

const SECTIONS = ["overview", "teams", "players", "registrations", "rules", "results", "settings"] as const;
type Section = (typeof SECTIONS)[number];

const isRunning = (a: Auction) => a.status === "live" || a.status === "paused";
const hasStarted = (a: Auction) => isRunning(a) || a.status === "completed";
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ─── Setup checklist ─────────────────────────────────────────────────────

type StepKey = "details" | "teams" | "players" | "rules";
interface SetupStep {
  key: StepKey;
  title: string;
  done: boolean;
  desc: string;
  cta: string;
}

/** The four things a draft needs, from the same checks the server runs before publishing. */
function setupSteps(a: Auction): SetupStep[] {
  const issues = validateConfig(a).filter((i) => i.severity === "error");
  const errorFor = (step: StepKey) => issues.find((i) => i.step === step)?.message;
  const pool = a.players.filter((p) => p.status !== "withdrawn").length;
  const registering = a.registration?.enabled === true;

  const named = !errorFor("details") && a.name !== "Untitled auction";
  const teamsOk = a.teams.length >= 2 && !errorFor("teams");
  const playersOk = !errorFor("players") && (pool > 0 || registering);
  const rulesOk = !errorFor("rules");

  return [
    {
      key: "details",
      title: "Name your auction",
      done: named,
      desc: named ? [a.name, a.tournament].filter(Boolean).join(" · ") : (errorFor("details") ?? "Give it a name your teams will recognise"),
      cta: named ? "Edit" : "Add name",
    },
    {
      key: "teams",
      title: "Add teams",
      done: teamsOk,
      desc: teamsOk
        ? `${a.teams.length} teams added`
        : a.teams.length === 1
          ? "1 team added, add 1 more"
          : a.teams.length > 1
            ? (errorFor("teams") ?? "")
            : "At least 2 teams",
      cta: teamsOk ? "Manage" : "Add teams",
    },
    {
      key: "players",
      title: "Add players",
      done: playersOk,
      desc:
        pool > 0
          ? playersOk
            ? `${pool} player${pool === 1 ? "" : "s"} in the pool`
            : (errorFor("players") ?? "")
          : registering
            ? "Registration is open. Approved players join the pool"
            : "Add players, import a CSV or open registrations",
      cta: playersOk ? "Manage" : "Add players",
    },
    {
      key: "rules",
      title: "Check the rules",
      done: rulesOk,
      desc: rulesOk
        ? `Defaults set: squad ${a.rules.minSquad}–${a.rules.maxSquad}, ${inr(a.rules.pursePerTeam)} purse`
        : (errorFor("rules") ?? ""),
      cta: "Review",
    },
  ];
}

// ─── Page ────────────────────────────────────────────────────────────────

export function AuctionAdmin({ auction }: { auction: Auction }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const requested = params.get("section");
  const section: Section = SECTIONS.includes(requested as Section) ? (requested as Section) : "overview";
  const go = (key: Section) => router.replace(key === "overview" ? `/auctions/${auction.id}` : `/auctions/${auction.id}?section=${key}`, { scroll: false });

  const [editingDetails, setEditingDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const steps = setupSteps(auction);
  const doneCount = steps.filter((s) => s.done).length;
  const ready = doneCount === steps.length;
  const canEdit = editable(auction);

  const openStep = (key: StepKey) => {
    if (key !== "details") return go(key);
    if (section !== "overview") go("overview");
    setEditingDetails(true);
    focusBasics();
  };

  // Coming from another section, the form only exists once the overview has rendered.
  useEffect(() => {
    if (editingDetails && section === "overview") focusBasics();
  }, [editingDetails, section]);

  const publish = async () => {
    setBusy(true);
    const result = await auctionService.publish(auction.id);
    setBusy(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else toast("Auction scheduled. You can start it from here on auction day.", { tone: "success" });
  };

  const start = async (pending?: "reject" | "expire") => {
    setBusy(true);
    const result = await auctionService.start(auction.id, pending);
    setBusy(false);
    if (result.ok) router.push(`/auctions/${auction.id}/live`);
    else if (result.code === "REGISTRATIONS_PENDING") setPendingStart(result.error);
    else toast(result.error, { tone: "error" });
  };

  const copySpectator = async () => {
    const url = `${window.location.origin}/auctions/${auction.id}/watch`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (auction.visibility === "private") {
        toast("Spectator link copied", {
          tone: "info",
          description: "The auction is private, so only you can open it. Change who can watch in the auction details.",
        });
      }
    } catch {
      toast(url, { tone: "info" });
    }
  };

  // The one action the header leads with, by status.
  const primary = (() => {
    if (isRunning(auction)) return <Link href={`/auctions/${auction.id}/live`} className={primaryBtn}>{auction.status === "paused" ? "Resume in live room" : "Open live room"}<Arrow /></Link>;
    if (auction.status === "scheduled")
      return (
        <button type="button" className={primaryBtn} disabled={busy} onClick={() => void start()}>
          Start auction
          <Arrow />
        </button>
      );
    if (auction.status === "draft")
      return ready ? (
        <button type="button" className={primaryBtn} disabled={busy} onClick={() => void publish()}>
          Schedule auction
          <Arrow />
        </button>
      ) : (
        <button type="button" className={primaryBtn} onClick={() => openStep(steps.find((s) => !s.done)!.key)}>
          Continue setup
          <Arrow />
        </button>
      );
    if (auction.status === "completed")
      return (
        <button type="button" className={primaryBtn} onClick={() => go("results")}>
          View results
          <Arrow />
        </button>
      );
    return null;
  })();

  const pool = auction.players.filter((p) => p.status !== "withdrawn").length;
  const rulesOk = steps[3].done;
  const nav: { key: Section | "live"; label: string; icon: string; badge?: string; badgeTone?: "ok" | "live" | "muted" | "warn"; disabled?: boolean }[] = [
    { key: "overview", label: "Overview", icon: "ri-dashboard-line" },
    { key: "teams", label: "Teams", icon: "ri-team-line", badge: String(auction.teams.length) },
    { key: "players", label: "Players", icon: "ri-user-line", badge: String(pool) },
    {
      key: "registrations",
      label: "Registrations",
      icon: "ri-user-add-line",
      badge: (auction.pendingRegistrations ?? 0) > 0 ? `${auction.pendingRegistrations} new` : auction.registration?.enabled ? "Open" : "Off",
      badgeTone: (auction.pendingRegistrations ?? 0) > 0 ? "warn" : "muted",
    },
    { key: "rules", label: "Rules", icon: "ri-equalizer-line", badge: rulesOk ? "✓" : "!", badgeTone: rulesOk ? "ok" : "warn" },
    {
      key: "live",
      label: "Live room",
      icon: "ri-slideshow-3-line",
      badge: auction.status === "live" ? "Live" : auction.status === "paused" ? "Paused" : undefined,
      badgeTone: "live",
      disabled: auction.status !== "scheduled" && !isRunning(auction),
    },
    { key: "results", label: "Results", icon: "ri-trophy-line", badge: hasStarted(auction) ? undefined : "Later" },
  ];

  const statusPill = {
    draft: "border-line bg-surface-3/60 text-fg-muted",
    scheduled: "border-line-accent bg-raised text-primary-soft-fg",
    live: "border-[#2F6DB8] bg-[rgb(47_109_184/0.2)] text-primary-soft-fg",
    paused: "border-warning/40 bg-warning-soft text-warning-soft-fg",
    completed: "border-success/30 bg-success-soft text-success-soft-fg",
    cancelled: "border-danger/30 bg-danger-soft text-danger-soft-fg",
  }[auction.status];
  const statusText = { draft: "Draft", scheduled: "Scheduled", live: "Live", paused: "Paused", completed: "Completed", cancelled: "Cancelled" }[auction.status];

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-[1320px] flex-col gap-5 px-4 pb-12 pt-5 sm:gap-[22px] sm:px-7 sm:pt-6">
        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <Link href="/auctions" className="text-[13px] text-fg-subtle hover:text-fg">
              ← All auctions
            </Link>
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h1 className="min-w-0 truncate text-[22px] font-bold tracking-[-0.02em] text-fg sm:text-[26px]">{auction.name}</h1>
              {canEdit && (
                <button
                  type="button"
                  aria-label="Edit auction details"
                  onClick={() => openStep("details")}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-line text-fg-subtle transition-colors hover:border-line-strong hover:text-fg"
                >
                  <i className="ri-pencil-line text-sm" aria-hidden />
                </button>
              )}
              <span className={cn("flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold", statusPill)}>
                {auction.status === "live" && <Pulse />}
                {statusText}
              </span>
              {auction.archived && <span className="text-xs text-fg-subtle">Archived</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-muted">
              <span className="flex items-center gap-1.5">
                <i className="ri-calendar-line" aria-hidden />
                {auction.startsAt ? formatWhen(auction.startsAt, auction.timezone) : "Date not set"}
              </span>
              <span>{inr(auction.rules.pursePerTeam)} purse per team</span>
              {auction.tournamentId ? <span>Tournament: {auction.tournament}</span> : auction.tournament ? <span>{auction.tournament}</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void copySpectator()} className={cn(secondaryBtn, "h-[38px] bg-surface-2")}>
              <i className={cn(copied ? "ri-check-line" : "ri-eye-line", "text-[15px]")} aria-hidden />
              {copied ? "Link copied" : "Spectator link"}
            </button>
            <button
              type="button"
              aria-label="Auction settings"
              aria-current={section === "settings" ? "page" : undefined}
              onClick={() => go("settings")}
              className={cn(
                "flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border bg-surface-2 text-fg-muted transition-colors hover:text-fg",
                section === "settings" ? "border-line-accent text-fg" : "border-line",
              )}
            >
              <i className="ri-settings-3-line text-base" aria-hidden />
            </button>
            {primary}
          </div>
        </div>

        {/* Phones and tablets: sections as a scrolling strip */}
        <nav aria-label="Auction sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:hidden">
          {nav.map((n) => (
            <NavItem key={n.key} item={n} active={section === n.key} auctionId={auction.id} onPick={go} compact />
          ))}
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
          <nav aria-label="Auction sections" className="sticky top-[84px] hidden flex-col gap-0.5 lg:flex">
            {nav.map((n) => (
              <NavItem key={n.key} item={n} active={section === n.key} auctionId={auction.id} onPick={go} />
            ))}
          </nav>

          <section aria-live="polite" className="flex min-w-0 flex-col gap-[18px]">
            {section === "overview" &&
              (hasStarted(auction) ? (
                <LiveOverview auction={auction} onResults={() => go("results")} />
              ) : (
                <SetupOverview
                  auction={auction}
                  steps={steps}
                  busy={busy}
                  onStep={openStep}
                  editingDetails={editingDetails}
                  onDetailsClosed={() => setEditingDetails(false)}
                  onPublish={publish}
                  onStart={() => void start()}
                  onPlayers={() => go("players")}
                />
              ))}
            {section === "teams" && <TeamsSection auction={auction} />}
            {section === "players" && <PlayersSection auction={auction} onRegistrations={() => go("registrations")} />}
            {section === "registrations" && (
              <Panel title="Registrations" sub="Share a link, let players sign up themselves and approve who joins the pool.">
                <div className="p-4 sm:p-[22px]">
                  <RegistrationsPanel auction={auction} />
                </div>
              </Panel>
            )}
            {section === "rules" && <RulesSection auction={auction} />}
            {section === "results" &&
              (hasStarted(auction) ? (
                <Results auction={auction} />
              ) : (
                <Empty icon="ri-trophy-line" title="Results appear after the auction">
                  Final squads, spend per team and unsold players, ready to export as CSV.
                </Empty>
              ))}
            {section === "settings" && (
              <>
                {canEdit && (
                  <Panel title="Auction details" sub="Name, tournament, date and who can watch.">
                    <div className="p-4 sm:p-[22px]">
                      <DetailsForm
                        auction={auction}
                        onSaved={(r) => (r.ok ? toast("Details saved.", { tone: "success" }) : toast(r.error, { tone: "error" }))}
                      />
                    </div>
                  </Panel>
                )}
                <Panel title="Lifecycle and activity">
                  <div className="p-4 sm:p-[22px]">
                    <Settings auction={auction} />
                  </div>
                </Panel>
              </>
            )}
          </section>
        </div>
      </main>

      <PendingStartDialog
        message={pendingStart}
        onClose={() => setPendingStart(null)}
        onChoose={(pending) => {
          setPendingStart(null);
          void start(pending);
        }}
      />
    </div>
  );
}

// ─── Chrome ──────────────────────────────────────────────────────────────

function Arrow() {
  return <i className="ri-arrow-right-line text-[15px]" aria-hidden />;
}

function Pulse() {
  return <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent animate-pulse motion-reduce:animate-none" aria-hidden />;
}

function NavItem({
  item,
  active,
  auctionId,
  onPick,
  compact,
}: {
  item: { key: Section | "live"; label: string; icon: string; badge?: string; badgeTone?: "ok" | "live" | "muted" | "warn"; disabled?: boolean };
  active: boolean;
  auctionId: string;
  onPick: (key: Section) => void;
  compact?: boolean;
}) {
  const cls = cn(
    "flex h-10 flex-shrink-0 items-center gap-2.5 rounded-[10px] px-3 text-left text-sm transition-colors",
    active ? "bg-raised font-semibold text-white" : "font-medium text-fg-muted hover:bg-surface-2 hover:text-fg",
    item.disabled && "pointer-events-none opacity-45",
    compact && "h-9 whitespace-nowrap border border-line",
    compact && active && "border-line-accent",
  );
  const badgeCls = {
    ok: "text-success-soft-fg",
    live: "text-accent-soft",
    warn: "text-warning-soft-fg",
    muted: "text-fg-subtle",
  }[item.badgeTone ?? "muted"];
  const content = (
    <>
      <i className={cn(item.icon, "text-[17px]", active ? "text-accent-soft" : "text-fg-subtle")} aria-hidden />
      <span className={cn(!compact && "flex-1")}>{item.label}</span>
      {item.badge && <span className={cn("text-xs font-semibold", badgeCls)}>{item.badge}</span>}
    </>
  );
  if (item.key === "live") {
    return item.disabled ? (
      <span className={cls} aria-disabled title="Opens once the auction is scheduled">
        {content}
      </span>
    ) : (
      <Link href={`/auctions/${auctionId}/live`} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" aria-current={active ? "page" : undefined} onClick={() => onPick(item.key as Section)} className={cls}>
      {content}
    </button>
  );
}

function Panel({ title, sub, action, children }: { title: string; sub?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-[22px]">
        <span className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          {sub && <span className="text-[13px] text-fg-subtle">{sub}</span>}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ icon, title, children, action }: { icon: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-5 py-12 text-center">
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary-soft text-accent-soft">
        <i className={cn(icon, "text-2xl")} aria-hidden />
      </span>
      <span className="text-base font-semibold text-fg">{title}</span>
      <span className="max-w-[340px] text-[13px] text-fg-subtle">{children}</span>
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  );
}

// ─── Overview: before the auction ────────────────────────────────────────

function SetupOverview({
  auction,
  steps,
  busy,
  onStep,
  editingDetails,
  onDetailsClosed,
  onPublish,
  onStart,
  onPlayers,
}: {
  auction: Auction;
  steps: SetupStep[];
  busy: boolean;
  onStep: (key: StepKey) => void;
  /** Step 1 is open for editing in place (it's always open until the auction has its basics). */
  editingDetails: boolean;
  onDetailsClosed: () => void;
  onPublish: () => void;
  onStart: () => void;
  onPlayers: () => void;
}) {
  const doneCount = steps.filter((s) => s.done).length;
  const ready = doneCount === steps.length;
  const scheduled = auction.status === "scheduled";
  const cancelled = auction.status === "cancelled";
  const needsBasics = !steps[0].done && !cancelled;

  return (
    <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
      <div className="flex min-w-0 flex-col gap-[18px]">
      {/* A new auction starts here: the details everything else depends on, filled in on the page. */}
      {needsBasics && (
        <div className="overflow-hidden rounded-2xl border border-line-accent bg-surface-2">
          <div className="flex items-start gap-3 border-b border-line px-4 pb-4 pt-5 sm:px-[22px]">
            <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-[#2F6DB8] text-xs font-bold text-white">1</span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-lg font-semibold text-fg">Start with the basics</h2>
              <span className="text-[13px] text-fg-subtle">Teams and players see these. You can change them until the auction starts.</span>
            </span>
          </div>
          <div className="px-4 py-5 sm:px-[22px]">
            <BasicsForm key={auction.id} auction={auction} onDone={onDetailsClosed} />
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface-2">
        <div className="flex flex-col gap-3 border-b border-line px-4 pb-4 pt-5 sm:px-[22px]">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-fg">{scheduled ? "Ready for auction day" : "Get your auction ready"}</h2>
            <span className="flex-shrink-0 text-[13px] text-fg-muted">
              <b className="text-fg">
                {doneCount} of {steps.length}
              </b>{" "}
              steps done
            </span>
          </div>
          <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#5FA8E8,#2F6DB8)] transition-[width] duration-300"
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <ol className="py-1.5">
          {steps.map((st, i) => {
            const editingHere = st.key === "details" && st.done && editingDetails;
            return (
              <li key={st.key} className={cn("transition-colors", editingHere ? "bg-surface" : "hover:bg-surface")}>
                <div className="flex items-center gap-3.5 px-4 py-3.5 sm:px-[22px]">
                  <StepDot done={st.done} n={i + 1} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-fg">{st.title}</span>
                    <span className={cn("text-[13px]", st.done ? "text-success-soft-fg" : "text-fg-subtle")}>{st.desc}</span>
                  </span>
                  {!editingHere && (
                    <button
                      type="button"
                      onClick={() => onStep(st.key)}
                      disabled={cancelled}
                      className={st.done ? cn(secondaryBtn, "h-[34px] bg-transparent text-fg-muted") : softBtn}
                    >
                      {st.key === "details" && needsBasics ? "Fill in above" : st.cta}
                    </button>
                  )}
                </div>
                {editingHere && (
                  <div className="border-t border-line px-4 pb-5 pt-4 sm:px-[22px]">
                    <BasicsForm auction={auction} onDone={onDetailsClosed} onCancel={onDetailsClosed} />
                  </div>
                )}
              </li>
            );
          })}
          <li className="flex items-center gap-3.5 px-4 py-3.5 sm:px-[22px]">
            <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-line-strong text-xs font-bold text-fg-subtle">
              {steps.length + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={cn("text-sm font-semibold", ready ? "text-fg" : "text-fg-subtle")}>
                {scheduled ? "Start the auction" : "Schedule the auction"}
              </span>
              <span className="text-[13px] text-fg-subtle">
                {scheduled
                  ? `Scheduled for ${auction.startsAt ? formatWhen(auction.startsAt, auction.timezone) : "a date to be set"}`
                  : ready
                    ? "Everything is ready. Schedule it, then start it on auction day"
                    : "Unlocks when the steps above are done"}
              </span>
            </span>
            <button
              type="button"
              disabled={!ready || busy || cancelled}
              onClick={scheduled ? onStart : onPublish}
              className={cn(primaryBtn, "h-[34px] rounded-[9px] px-3.5")}
            >
              {scheduled ? "Start" : "Schedule"}
            </button>
          </li>
        </ol>
      </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <RegistrationCard auction={auction} onPlayers={onPlayers} />
        <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface-2 px-5 py-[18px]">
          <h3 className="text-[15px] font-semibold text-fg">On auction day</h3>
          <ul className="flex list-disc flex-col gap-1.5 pl-[18px] text-[13px] leading-normal text-fg-muted">
            <li>
              Run bids from the <b className="text-fg">Live room</b> on a laptop.
            </li>
            <li>
              Put the <b className="text-fg">Spectator link</b> on a big screen or share it with fans.
            </li>
            <li>Unsold players can be brought back at the end.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StepDot({ done, n }: { done: boolean; n: number }) {
  return done ? (
    <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-[#2F6DB8] text-white">
      <i className="ri-check-line text-base" aria-hidden />
      <span className="sr-only">Done</span>
    </span>
  ) : (
    <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-strong text-xs font-bold text-fg-muted">
      {n}
    </span>
  );
}

/** Quick on/off for self-registration with the default invite link; the full settings live under Registrations. */
function RegistrationCard({ auction, onPlayers }: { auction: Auction; onPlayers: () => void }) {
  const toast = useToast();
  const { data } = useRegistrations(auction);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const open = auction.registration?.enabled === true;
  const link = data?.links.find((l) => l.defaultLink && !l.revoked) ?? data?.links.find((l) => !l.revoked);
  const canToggle = editable(auction);

  const toggle = async () => {
    setBusy(true);
    const result = await auctionService.saveRegistration(auction.id, { ...DEFAULT_REGISTRATION, ...auction.registration, enabled: !open });
    setBusy(false);
    if (!result.ok) toast(result.error, { tone: "error" });
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(link.url, { tone: "info" });
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-2 px-5 py-[18px]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-fg">Player registrations</h3>
        <Toggle checked={open} disabled={busy || !canToggle} onChange={() => void toggle()} label="Accept player registrations" />
      </div>
      <p className="text-[13px] leading-normal text-fg-muted">
        {open
          ? (auction.pendingRegistrations ?? 0) > 0
            ? `Open. ${auction.pendingRegistrations} sign-up${auction.pendingRegistrations === 1 ? "" : "s"} waiting for you to approve.`
            : "Open. Players who sign up through the link appear in Players for you to approve."
          : "Closed. Turn on to get a link players can use to sign up themselves."}
      </p>
      <div className={cn("flex h-[38px] items-center gap-2 rounded-[10px] border border-line bg-well pl-3 pr-1.5", !open && "opacity-45")}>
        <span className="min-w-0 flex-1 truncate text-xs text-fg-lead">{open ? (link?.url ?? "Creating your link…") : "Link appears when registrations are open"}</span>
        <button
          type="button"
          disabled={!open || !link}
          onClick={() => void copy()}
          className="flex h-7 items-center gap-1.5 rounded-[7px] bg-raised px-2.5 text-xs font-semibold text-primary-soft-fg disabled:pointer-events-none"
        >
          <i className={copied ? "ri-check-line" : "ri-file-copy-line"} aria-hidden />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {open && (auction.pendingRegistrations ?? 0) > 0 && (
        <button type="button" onClick={onPlayers} className="self-start text-[13px] font-semibold text-primary-soft-fg hover:text-fg">
          Review sign-ups →
        </button>
      )}
    </div>
  );
}

function Toggle({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn("relative h-[22px] w-10 flex-shrink-0 rounded-full transition-colors disabled:opacity-50", checked ? "bg-[#2F6DB8]" : "bg-line-strong")}
    >
      <span className={cn("absolute top-[3px] h-4 w-4 rounded-full bg-white transition-[left] duration-200", checked ? "left-[21px]" : "left-[3px]")} />
    </button>
  );
}

// ─── Overview: during and after the auction ──────────────────────────────

function LiveOverview({ auction, onResults }: { auction: Auction; onResults: () => void }) {
  const pool = auction.players.filter((p) => p.status !== "withdrawn");
  const sold = pool.filter((p) => p.status === "sold");
  const unsold = pool.filter((p) => p.status === "unsold");
  const waiting = queue(auction);
  const totalPurse = auction.teams.reduce((sum, t) => sum + teamBudget(auction, t), 0);
  const spent = auction.teams.reduce((sum, t) => sum + teamSpent(auction, t.id), 0);
  const onBlock = playerById(auction, auction.currentPlayerId);
  const lot = sold.length + unsold.length + (onBlock ? 1 : 0);
  const running = isRunning(auction);

  const kpis = [
    { label: "Sold", value: String(sold.length), sub: `of ${pool.length} players` },
    { label: "Unsold", value: String(unsold.length), sub: running ? "Can come back at the end" : "Not bought" },
    { label: "Still to come", value: String(waiting.length), sub: onBlock ? `Lot ${lot} on now` : running ? "Waiting for the next lot" : "Auction over" },
    { label: "Total spent", value: lakhs(spent), sub: `of ${lakhs(totalPurse)} in purses` },
  ];

  // Most recent first; undone sales are left out.
  const sales = auction.events
    .filter((e) => (e.type === "sold" || e.type === "unsold") && !e.reverted)
    .slice(-4)
    .reverse()
    .map((e) => {
      const player = playerById(auction, e.payload.playerId as string);
      const team = e.type === "sold" ? teamById(auction, (e.payload.teamId as string) ?? player?.soldToTeamId) : undefined;
      const price = typeof e.payload.amount === "number" ? e.payload.amount : player?.soldPrice;
      return { id: e.id, player: player?.name ?? "Player", team: e.type === "sold" ? (team?.name ?? "") : "Unsold", price: e.type === "sold" && price != null ? inr(price) : "Unsold", sold: e.type === "sold" };
    });

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-1 rounded-[14px] border border-line bg-surface-2 px-4 py-3.5">
            <span className="text-xs font-medium text-fg-subtle">{k.label}</span>
            <span className="text-2xl font-semibold tabular-nums text-fg">{k.value}</span>
            <span className="text-xs text-fg-subtle">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold text-fg">Team purses</h2>
            <span className="text-xs text-fg-subtle">
              Squad {auction.rules.minSquad}–{auction.rules.maxSquad}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-fg-subtle">
                  <th className="px-4 py-2.5 font-medium sm:px-5">Team</th>
                  <th className="px-2 py-2.5 font-medium">Players</th>
                  <th className="w-[38%] px-2 py-2.5 font-medium">Purse left</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">Top buy</th>
                </tr>
              </thead>
              <tbody>
                {auction.teams.map((t) => {
                  const squad = squadOf(auction, t.id);
                  const left = teamRemaining(auction, t.id);
                  const budget = teamBudget(auction, t);
                  const pct = budget > 0 ? Math.max(0, Math.min(100, (left / budget) * 100)) : 0;
                  const top = squad.reduce((m, p) => Math.max(m, p.soldPrice ?? 0), 0);
                  return (
                    <tr key={t.id} className="border-t border-line transition-colors hover:bg-surface">
                      <td className="px-4 py-3 sm:px-5">
                        <span className="flex items-center gap-2.5 font-semibold text-fg">
                          <TeamTile team={t} size="sm" />
                          <span className="truncate">{t.name}</span>
                        </span>
                      </td>
                      <td className="px-2 py-3 text-fg-lead">
                        {squad.length} / {auction.rules.maxSquad}
                      </td>
                      <td className="px-2 py-3">
                        <span className="flex flex-col gap-1.5">
                          <span className="font-semibold tabular-nums text-fg">{inr(left)}</span>
                          <span aria-hidden className="h-[5px] overflow-hidden rounded-full bg-line">
                            <span className={cn("block h-full rounded-full", pct < 15 ? "bg-danger-soft-fg" : "bg-accent")} style={{ width: `${pct}%` }} />
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-fg-lead sm:px-5">{top ? inr(top) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {running ? (
            <OnTheBlock auction={auction} lot={lot} total={pool.length} />
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-line-accent bg-[linear-gradient(160deg,rgb(var(--raised))_0%,rgb(var(--surface-2))_80%)] px-5 py-[18px]">
              <span className="text-xs font-semibold text-primary-soft-fg">Auction complete</span>
              <p className="text-sm text-fg-muted">
                {sold.length} players sold for {inr(spent)}. Squads and exports are in Results.
              </p>
              <button type="button" onClick={onResults} className={primaryBtn}>
                <i className="ri-trophy-line text-[15px]" aria-hidden />
                View results
              </button>
            </div>
          )}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface-2 px-5 py-4">
            <h3 className="text-[15px] font-semibold text-fg">Latest sales</h3>
            {sales.length === 0 ? (
              <p className="text-[13px] text-fg-subtle">No players sold yet.</p>
            ) : (
              sales.map((s) => (
                <div key={s.id} className="flex justify-between gap-2.5 text-[13px]">
                  <span className="flex min-w-0 flex-col gap-px">
                    <span className="truncate font-semibold text-fg">{s.player}</span>
                    <span className="truncate text-xs text-fg-subtle">{s.team}</span>
                  </span>
                  <span className={cn("flex-shrink-0 font-semibold tabular-nums", s.sold ? "text-fg" : "text-fg-subtle")}>{s.price}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OnTheBlock({ auction, lot, total }: { auction: Auction; lot: number; total: number }) {
  const player = playerById(auction, auction.currentPlayerId);
  const bid = player ? highestBid(auction, player.id) : undefined;
  const leader = bid ? teamById(auction, bid.teamId) : undefined;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line-accent bg-[linear-gradient(160deg,rgb(var(--raised))_0%,rgb(var(--surface-2))_80%)] px-5 py-[18px]">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-primary-soft-fg">
        {auction.status === "live" && <Pulse />}
        {auction.status === "paused" ? "Paused" : player ? `On the block · Lot ${lot} of ${total}` : "Between lots"}
      </span>
      {player ? (
        <>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-accent bg-well font-bold text-fg">
              {player.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initialsOf(player.name)
              )}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-base font-semibold text-fg">{player.name}</span>
              <span className="text-xs text-fg-muted">
                {ROLE_LABEL[player.role]} · base {inr(player.basePrice)}
              </span>
            </span>
          </div>
          <div className="flex items-end justify-between gap-3 border-t border-accent-soft/20 pt-2.5">
            <span className="flex flex-col gap-0.5">
              <span className="text-xs text-fg-subtle">Current bid</span>
              <span className="text-[22px] font-bold tabular-nums text-fg">{bid ? inr(bid.amount) : "No bid yet"}</span>
            </span>
            {leader && <span className="truncate text-xs font-semibold text-primary-soft-fg">{leader.name}</span>}
          </div>
        </>
      ) : (
        <p className="text-sm text-fg-muted">Bring the next player up from the live room.</p>
      )}
      <Link href={`/auctions/${auction.id}/live`} className={primaryBtn}>
        <i className="ri-auction-line text-[15px]" aria-hidden />
        {auction.status === "paused" ? "Resume in live room" : "Open live room"}
      </Link>
    </div>
  );
}

/** ₹74 L / ₹1.2 Cr, the way purses are talked about. */
function lakhs(n: number): string {
  if (n >= 1_00_00_000) return `₹${+(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${+(n / 1_00_000).toFixed(1)} L`;
  return inr(n);
}

function TeamTile({ team, size = "md" }: { team: AuctionTeam; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "flex flex-shrink-0 items-center justify-center bg-raised font-bold text-primary-soft-fg ring-1 ring-inset",
        size === "sm" ? "h-7 w-7 rounded-lg text-[11px]" : "h-9 w-9 rounded-[10px] text-xs",
      )}
      style={{ "--tw-ring-color": `${team.color}66` } as React.CSSProperties}
    >
      {(team.shortName || initialsOf(team.name)).slice(0, 3)}
    </span>
  );
}

// ─── Teams ───────────────────────────────────────────────────────────────

function TeamsSection({ auction }: { auction: Auction }) {
  const toast = useToast();
  const canEdit = editable(auction);
  const [draft, setDraft] = useState<Omit<AuctionTeam, "id"> | AuctionTeam | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const add = () =>
    setDraft({ name: "", shortName: "", ownerName: "", color: TEAM_COLORS[auction.teams.length % TEAM_COLORS.length], purseOverride: null });

  return (
    <Panel
      title="Teams"
      sub={`Each team starts with ${inr(auction.rules.pursePerTeam)}. Add at least 2.`}
      action={
        canEdit && (
          <button type="button" onClick={add} className={cn(primaryBtn, "h-9")}>
            <i className="ri-add-line text-[15px]" aria-hidden />
            Add team
          </button>
        )
      }
    >
      {auction.teams.length === 0 ? (
        <Empty icon="ri-team-line" title="No teams yet">
          Add the teams that will bid. Each needs a name and a short name for the scoreboard.
        </Empty>
      ) : (
        <ul>
          {auction.teams.map((t) => {
            const squad = squadOf(auction, t.id);
            const expanded = open === t.id;
            return (
              <li key={t.id} className="border-b border-line last:border-b-0">
                <div className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface sm:px-[22px]">
                  <TeamTile team={t} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-semibold text-fg">{t.name}</span>
                    <span className="truncate text-xs text-fg-subtle">
                      {t.ownerName ? `Owner: ${t.ownerName}` : "No owner listed"}
                      {t.appTeamId ? " · CricsHub team" : ""}
                    </span>
                  </span>
                  {canEdit ? (
                    <>
                      <span className="hidden text-[13px] tabular-nums text-fg-lead sm:inline">
                        {inr(teamBudget(auction, t))}
                        {t.purseOverride != null ? " (custom)" : ""}
                      </span>
                      <button type="button" onClick={() => setDraft(t)} className="h-[30px] rounded-lg border border-line px-2.5 text-xs text-fg-muted hover:text-fg">
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${t.name}`}
                        onClick={async () => {
                          const result = await auctionService.removeTeam(auction.id, t.id);
                          if (!result.ok) toast(result.error, { tone: "error" });
                        }}
                        className="h-[30px] rounded-lg border border-line px-2.5 text-xs text-fg-muted hover:border-danger/40 hover:text-danger"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? null : t.id)}
                      className="flex items-center gap-3 text-right text-[13px] text-fg-lead"
                    >
                      <span className="hidden sm:inline">
                        {squad.length}/{auction.rules.maxSquad} players · {inr(teamRemaining(auction, t.id))} left
                      </span>
                      <span className="sm:hidden">{squad.length}/{auction.rules.maxSquad}</span>
                      <i className={cn("ri-arrow-down-s-line text-lg text-fg-subtle transition-transform", expanded && "rotate-180")} aria-hidden />
                    </button>
                  )}
                </div>
                {expanded && (
                  <ul className="border-t border-line bg-well px-4 py-2 sm:px-[22px]">
                    {squad.length === 0 ? (
                      <li className="py-2 text-[13px] text-fg-subtle">No players bought yet.</li>
                    ) : (
                      squad.map((p) => (
                        <li key={p.id} className="flex justify-between py-1.5 text-[13px]">
                          <span className="text-fg">
                            {p.name} <span className="text-fg-subtle">{ROLE_LABEL[p.role]}</span>
                          </span>
                          <span className="tabular-nums text-fg-lead">{inr(p.soldPrice ?? 0)}</span>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft && "id" in draft ? "Edit team" : "Add team"} size="lg">
        {draft && <TeamEditor auction={auction} initial={draft} teamId={"id" in draft ? draft.id : undefined} onClose={() => setDraft(null)} />}
      </Modal>
    </Panel>
  );
}

// ─── Players ─────────────────────────────────────────────────────────────

function PlayersSection({ auction, onRegistrations }: { auction: Auction; onRegistrations: () => void }) {
  const toast = useToast();
  const canEdit = editable(auction);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState("");
  const [opening, setOpening] = useState(false);
  const { data } = useRegistrations(auction);
  const registering = auction.registration?.enabled === true;
  const link = data?.links.find((l) => l.defaultLink && !l.revoked) ?? data?.links.find((l) => !l.revoked);

  if (!canEdit && auction.players.length > 0) {
    return (
      <Panel title="Players" sub={`${auction.players.length} in the pool`}>
        <div className="p-4 sm:p-[22px]">
          <PlayerPool auction={auction} />
        </div>
      </Panel>
    );
  }

  const rows = auction.players.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  const openRegistration = async () => {
    if (registering) {
      if (!link) return onRegistrations();
      try {
        await navigator.clipboard.writeText(link.url);
        toast("Registration link copied.", { tone: "success" });
      } catch {
        toast(link.url, { tone: "info" });
      }
      return;
    }
    setOpening(true);
    const result = await auctionService.saveRegistration(auction.id, { ...DEFAULT_REGISTRATION, ...auction.registration, enabled: true });
    setOpening(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else toast("Registrations are open. Share the link from here or the overview.", { tone: "success" });
  };

  return (
    <>
      {registering && <PendingQueue auction={auction} />}
      <Panel
        title="Players"
        sub="Add players yourself, import a list, or let them register."
        action={
          canEdit && (
            <span className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setImporting(true)} className={cn(secondaryBtn, "h-9")}>
                <i className="ri-upload-2-line text-[15px]" aria-hidden />
                Import CSV
              </button>
              <button type="button" onClick={() => setEditing("new")} className={cn(primaryBtn, "h-9")}>
                <i className="ri-add-line text-[15px]" aria-hidden />
                Add player
              </button>
            </span>
          )
        }
      >
        {auction.players.length === 0 ? (
          <Empty
            icon="ri-user-line"
            title="No players yet"
            action={
              canEdit && (
                <button type="button" disabled={opening} onClick={() => void openRegistration()} className={cn(softBtn, "h-9")}>
                  <i className="ri-links-line text-[15px]" aria-hidden />
                  {registering ? "Copy registration link" : "Open registrations"}
                </button>
              )
            }
          >
            The fastest way is to open registrations and share the link in your WhatsApp groups. New sign-ups appear here for you to approve.
          </Empty>
        ) : (
          <>
            <div className="border-b border-line px-4 py-3 sm:px-[22px]">
              <Input icon="ri-search-line" placeholder="Search players" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search players" className="max-w-xs" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-fg-subtle">
                    <th className="px-4 py-2.5 font-medium sm:px-[22px]">Player</th>
                    <th className="px-2 py-2.5 font-medium">Role</th>
                    <th className="px-2 py-2.5 font-medium">Category</th>
                    <th className="px-2 py-2.5 font-medium">Base price</th>
                    <th className="px-4 py-2.5 sm:px-[22px]" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-t border-line transition-colors hover:bg-surface">
                      <td className="px-4 py-3 sm:px-[22px]">
                        <span className="font-semibold text-fg">{p.name}</span>
                        {p.nationality && <span className="ml-2 text-xs text-fg-subtle">{p.nationality}</span>}
                        {p.source === "registration" && <span className="ml-2 text-xs font-semibold text-primary-soft-fg">Registered</span>}
                      </td>
                      <td className="px-2 py-3 text-fg-lead">{ROLE_LABEL[p.role]}</td>
                      <td className="px-2 py-3 font-mono text-xs text-fg-lead">{p.category || "—"}</td>
                      <td className="px-2 py-3 tabular-nums text-fg">{inr(p.basePrice)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right sm:px-[22px]">
                        {canEdit && (
                          <>
                            <button type="button" onClick={() => setEditing(p.id)} className="h-[30px] rounded-lg px-2.5 text-xs text-fg-muted hover:text-fg">
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${p.name}`}
                              onClick={async () => {
                                const result = await auctionService.removePlayer(auction.id, p.id);
                                if (!result.ok) toast(result.error, { tone: "error" });
                              }}
                              className="h-[30px] rounded-lg px-2.5 text-xs text-fg-muted hover:text-danger"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>

      <Modal open={editing != null} onClose={() => setEditing(null)} title={editing === "new" ? "Add player" : "Edit player"} size="lg">
        {editing && <PlayerEditor auction={auction} playerId={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      </Modal>
      <Modal open={importing} onClose={() => setImporting(false)} title="Import players from CSV" size="lg">
        <CsvImport auction={auction} onDone={() => setImporting(false)} />
      </Modal>
    </>
  );
}

// ─── Rules ───────────────────────────────────────────────────────────────

function RulesSection({ auction }: { auction: Auction }) {
  const toast = useToast();
  const canEdit = editable(auction);
  const [rules, setRules] = useState<AuctionRules>(auction.rules);
  const [base, setBase] = useState<AuctionRules>(auction.rules);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<AuctionRules>) => setRules((r) => ({ ...r, ...patch }));
  const dirty = JSON.stringify(rules) !== JSON.stringify(base);

  // Take in rule changes from the server (another tab, a save) unless the form has unsaved edits.
  useEffect(() => {
    if (JSON.stringify(auction.rules) === JSON.stringify(base)) return;
    if (!dirty) setRules(auction.rules);
    setBase(auction.rules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction.rules]);

  const save = async () => {
    setSaving(true);
    const result = await auctionService.saveRules(auction.id, rules);
    setSaving(false);
    if (!result.ok) toast(result.error, { tone: "error" });
    else {
      setBase(rules);
      toast("Rules saved.", { tone: "success" });
    }
  };

  const num = (v: string) => (v === "" ? 0 : Number(v.replace(/[^\d]/g, "")));

  return (
    <Panel
      title="Rules"
      sub={canEdit ? "Defaults are set. Change only what your league needs." : "Rules are locked once the auction starts."}
      action={
        canEdit && (
          <button type="button" disabled={!dirty || saving} onClick={() => void save()} className={cn(primaryBtn, "h-9")}>
            {saving ? "Saving…" : "Save rules"}
          </button>
        )
      }
    >
      <fieldset disabled={!canEdit} className="grid gap-x-6 gap-y-[18px] px-4 py-5 sm:grid-cols-2 sm:px-[22px]">
        <RuleField label="Purse per team" required>
          <FieldBox prefix="₹">
            <input inputMode="numeric" value={rules.pursePerTeam.toLocaleString("en-IN")} onChange={(e) => set({ pursePerTeam: num(e.target.value) })} className={inputCls} />
          </FieldBox>
        </RuleField>
        <RuleField label="Squad size" required>
          <span className="flex gap-2">
            <FieldBox prefix="Min" grow>
              <input inputMode="numeric" value={rules.minSquad} onChange={(e) => set({ minSquad: num(e.target.value) })} className={inputCls} />
            </FieldBox>
            <FieldBox prefix="Max" grow>
              <input inputMode="numeric" value={rules.maxSquad} onChange={(e) => set({ maxSquad: num(e.target.value) })} className={inputCls} />
            </FieldBox>
          </span>
        </RuleField>
        <div className="flex flex-col gap-3 sm:pt-6">
          <Switch
            checked={rules.reserveForMinSquad !== false}
            onChange={(reserveForMinSquad) => set({ reserveForMinSquad })}
            label="Keep purse for the minimum squad"
          />
          <Switch checked={rules.allowPurseOverride} onChange={(allowPurseOverride) => set({ allowPurseOverride })} label="Allow a different purse for a team" />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-[13px] font-semibold text-fg">Bid increments</span>
          <div className="overflow-hidden rounded-[10px] border border-line text-[13px]">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-well px-3 py-2.5 text-fg-subtle">
              <span>When the bid is below</span>
              <span>Raise by</span>
              <span className="w-[60px]" />
            </div>
            {rules.increments.map((slab, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-t border-line px-3 py-2">
                <FieldBox prefix="₹" compact>
                  <input
                    inputMode="numeric"
                    aria-label="Applies while the bid is below"
                    placeholder="Any amount"
                    value={slab.upTo == null ? "" : slab.upTo.toLocaleString("en-IN")}
                    onChange={(e) => {
                      const increments = rules.increments.slice();
                      increments[i] = { ...slab, upTo: e.target.value === "" ? null : num(e.target.value) };
                      set({ increments });
                    }}
                    className={inputCls}
                  />
                </FieldBox>
                <FieldBox prefix="₹" compact>
                  <input
                    inputMode="numeric"
                    aria-label="Raise by"
                    value={slab.step.toLocaleString("en-IN")}
                    onChange={(e) => {
                      const increments = rules.increments.slice();
                      increments[i] = { ...slab, step: num(e.target.value) };
                      set({ increments });
                    }}
                    className={inputCls}
                  />
                </FieldBox>
                <button
                  type="button"
                  disabled={rules.increments.length === 1}
                  onClick={() => set({ increments: rules.increments.filter((_, j) => j !== i) })}
                  className="w-[60px] text-xs text-fg-subtle hover:text-danger disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => set({ increments: [...rules.increments, { upTo: null, step: 10_000 }] })}
              className="self-start text-[13px] font-semibold text-primary-soft-fg hover:text-fg"
            >
              + Add a step
            </button>
          )}
          <span className="text-xs text-fg-subtle">Leave the last row&apos;s amount empty so it covers every bid above.</span>
        </div>

        <div className="flex flex-col gap-3 sm:col-span-2">
          <Switch
            checked={rules.roleLimits.length > 0}
            onChange={(on) => set({ roleLimits: on ? PLAYER_ROLES.map((role) => ({ role, min: null, max: null })) : [] })}
            label="Role limits"
          />
          <span className="-mt-1 text-xs text-fg-subtle">
            Optional. A maximum stops a team buying more of that role; a minimum never blocks a sale, results flag teams below it.
          </span>
          {rules.roleLimits.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {PLAYER_ROLES.map((role) => {
                const limit = rules.roleLimits.find((r) => r.role === role) ?? { role, min: null, max: null };
                const write = (patch: Partial<typeof limit>) =>
                  set({ roleLimits: [...rules.roleLimits.filter((r) => r.role !== role), { ...limit, ...patch }] });
                return (
                  <li key={role} className="grid grid-cols-[7rem_1fr_1fr] items-center gap-2">
                    <span className="text-[13px] text-fg-lead">{ROLE_LABEL[role]}</span>
                    <FieldBox prefix="Min" compact>
                      <input
                        inputMode="numeric"
                        aria-label={`${ROLE_LABEL[role]} minimum`}
                        placeholder="Any"
                        value={limit.min ?? ""}
                        onChange={(e) => write({ min: e.target.value === "" ? null : num(e.target.value) })}
                        className={inputCls}
                      />
                    </FieldBox>
                    <FieldBox prefix="Max" compact>
                      <input
                        inputMode="numeric"
                        aria-label={`${ROLE_LABEL[role]} maximum`}
                        placeholder="Any"
                        value={limit.max ?? ""}
                        onChange={(e) => write({ max: e.target.value === "" ? null : num(e.target.value) })}
                        className={inputCls}
                      />
                    </FieldBox>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </fieldset>
    </Panel>
  );
}

// ─── Basics (inline details) ─────────────────────────────────────────────

const BASICS_ID = "auction-basics";

/** Scroll the basics form into view and put the cursor in the name field. */
function focusBasics() {
  requestAnimationFrame(() => {
    document.getElementById(BASICS_ID)?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById(`${BASICS_ID}-name`)?.focus({ preventScroll: true });
  });
}

/**
 * The basics, edited in place: name (the only required field), tournament label, when, and how much each
 * team gets. Description, visibility and home country stay in Settings. Linking a CricsHub tournament is
 * not part of setup: it happens on Results once the auction is completed.
 */
function BasicsForm({ auction, onDone, onCancel }: { auction: Auction; onDone: () => void; onCancel?: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(auction.name === "Untitled auction" ? "" : auction.name);
  const [tournament, setTournament] = useState(auction.tournament);
  const [starts, setStarts] = useState(toDateTimeLocal(auction.startsAt, auction.timezone));
  const [timezone, setTimezone] = useState(auction.timezone);
  const [purse, setPurse] = useState(auction.rules.pursePerTeam);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Give your auction a name.";
    if (!purse || purse <= 0) next.purse = "Enter how much each team can spend.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const details = await auctionService.saveDetails(auction.id, {
      name: name.trim(),
      tournament: tournament.trim(),
      startsAt: starts ? fromDateTimeLocal(starts, timezone) : null,
      timezone,
    });
    if (!details.ok) {
      setSaving(false);
      toast(details.error, { tone: "error" });
      return;
    }
    const rules = auctionService.get(auction.id)?.rules ?? auction.rules;
    if (purse !== rules.pursePerTeam) {
      const saved = await auctionService.saveRules(auction.id, { ...rules, pursePerTeam: purse });
      if (!saved.ok) {
        setSaving(false);
        toast(saved.error, { tone: "error" });
        return;
      }
    }
    setSaving(false);
    onDone();
  };

  return (
    <form id={BASICS_ID} onSubmit={submit} noValidate className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      <RuleField label="Auction name" required error={errors.name} full>
        <FieldBox invalid={!!errors.name}>
          <input
            id={`${BASICS_ID}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. City Premier League 2026 auction"
            maxLength={120}
            autoComplete="off"
            className={inputCls}
          />
        </FieldBox>
      </RuleField>

      <RuleField label="Tournament" optional full>
        <FieldBox>
          <input value={tournament} onChange={(e) => setTournament(e.target.value)} placeholder="e.g. City Premier League" maxLength={120} className={inputCls} />
        </FieldBox>
        <span className="text-xs text-fg-subtle">Just a label for now. After the auction you can add the squads to a CricsHub tournament.</span>
      </RuleField>

      <RuleField label="Auction date and time" optional>
        <FieldBox>
          <input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} className={inputCls} />
        </FieldBox>
      </RuleField>
      <RuleField label="Time zone" optional>
        <FieldBox>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={cn(inputCls, "h-full")}>
            {TIME_ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </FieldBox>
      </RuleField>

      <RuleField label="Purse per team" required error={errors.purse}>
        <FieldBox prefix="₹" invalid={!!errors.purse}>
          <input
            inputMode="numeric"
            value={purse ? purse.toLocaleString("en-IN") : ""}
            onChange={(e) => setPurse(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
            className={inputCls}
          />
        </FieldBox>
        <span className="text-xs text-fg-subtle">What every team can spend. You can fine-tune bidding in Rules.</span>
      </RuleField>

      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <button type="submit" disabled={saving} className={primaryBtn}>
          {saving ? "Saving…" : onCancel ? "Save" : "Save and continue"}
          {!saving && !onCancel && <Arrow />}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryBtn}>
            Cancel
          </button>
        )}
        <span className="text-xs text-fg-subtle">Description and who can watch are in Settings.</span>
      </div>
    </form>
  );
}

const inputCls =
  "h-full w-full min-w-0 flex-1 border-0 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:outline-none disabled:text-fg-muted";

function RuleField({
  label,
  error,
  full,
  required,
  optional,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", full && "sm:col-span-2")}>
      <span className="text-[13px] font-semibold text-fg">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
        {optional && <span className="ml-1.5 font-normal text-fg-subtle">(optional)</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="flex items-center gap-1 text-xs font-medium text-danger">
          <i className="ri-error-warning-fill" aria-hidden />
          {error}
        </span>
      )}
    </label>
  );
}

/** Bordered input shell; the ring sits on the shell, so the input inside draws no outline of its own. */
function FieldBox({
  prefix,
  compact,
  invalid,
  grow,
  children,
}: {
  prefix?: string;
  compact?: boolean;
  invalid?: boolean;
  /** Share a row with other boxes (e.g. Min / Max). */
  grow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex w-full flex-shrink-0 items-center rounded-[10px] border bg-well px-3 transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(95,168,232,0.16)]",
        invalid ? "border-danger" : "border-line",
        compact ? "h-9" : "h-10",
        grow && "min-w-0 flex-1",
      )}
    >
      {prefix && <span className="mr-1.5 text-xs text-fg-subtle">{prefix}</span>}
      {children}
    </span>
  );
}
