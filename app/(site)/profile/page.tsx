"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchCurrentUserProfile,
  updateUserProfile,
  fetchMySubscription,
  fetchTransactionHistory,
} from "@/lib/api";
import { logout } from "@/lib/session";
import { AppHeader } from "@/app/components/layout/AppHeader";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  Field,
  IconTile,
  Input,
  PageHeader,
  SectionTitle,
  Skeleton,
  cn,
  useToast,
} from "@/app/components/ui";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

type SubscriptionStatus = "active" | "expired" | "none";

interface Subscription {
  id: string;
  planName: string;
  cycle: "monthly" | "sixmonth";
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "SUCCESS" | "FAILED" | "REVERSED" | "PENDING";
  invoiceId: string;
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmtDate = (d: string) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function calcDaysRemaining(dateStr: string): number {
  if (!dateStr) return 0;
  const remaining = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86400000,
  );
  return remaining > 0 ? remaining : 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SECTIONS = [
  { id: "personal", label: "Personal details", icon: "ri-user-line" },
  { id: "subscription", label: "Subscription", icon: "ri-vip-crown-line" },
  { id: "overlays", label: "Overlays", icon: "ri-layout-top-2-line" },
  { id: "billing", label: "Billing history", icon: "ri-receipt-line" },
  { id: "account", label: "Sign out", icon: "ri-logout-box-r-line" },
] as const;

const BENEFITS = [
  { icon: "ri-layout-grid-line", text: "IPL Bundle auto-unlocked for every match" },
  { icon: "ri-price-tag-3-line", text: "No ₹99/match fee — overlays activate instantly" },
  { icon: "ri-layout-top-2-line", text: "Main Match Banner & Live Score Overlay" },
  { icon: "ri-file-list-3-line", text: "Match Summary with top batters & bowlers" },
  { icon: "ri-team-line", text: "Playing XI — combined, batting & bowling (×4)" },
  { icon: "ri-stack-line", text: "All 8 IPL Bundle overlays per match" },
];

// Preview gradients represent the real broadcast overlays' look (data, not chrome).
const BUNDLE_OVERLAYS = [
  {
    icon: "ri-layout-top-2-line",
    name: "Main Match Banner",
    desc: "Tournament name, both teams, venue, date and toss result. Perfect opening graphic.",
    bg: "linear-gradient(135deg,#34B8FF,#1E88E5)",
  },
  {
    icon: "ri-bar-chart-line",
    name: "Live Score Overlay",
    desc: "Always-on bottom bar — live score, batters, bowler and ball-by-ball over tracker.",
    bg: "linear-gradient(135deg,#0a1628,#1E88E5)",
  },
  {
    icon: "ri-file-list-3-line",
    name: "Match Summary",
    desc: "Top batters & bowlers from both teams. Shows required rate or final result at bottom.",
    bg: "linear-gradient(135deg,#E2B94B,#8B6914)",
  },
  {
    icon: "ri-team-line",
    name: "Playing XI — Both Teams",
    desc: "Side-by-side full lineup with player roles, captain badge and live match footer.",
    bg: "linear-gradient(135deg,#4A9EF5,#A855F7)",
  },
  {
    icon: "ri-group-line",
    name: "Batting XI — Team 1",
    desc: "Full batting lineup for Team 1 — live runs, strike rate and dismissal info.",
    bg: "linear-gradient(135deg,#00b4d8,#0077b6)",
  },
  {
    icon: "ri-group-line",
    name: "Batting XI — Team 2",
    desc: "Full batting lineup for Team 2 — live runs, strike rate and dismissal info.",
    bg: "linear-gradient(135deg,#00b4d8,#0077b6)",
  },
  {
    icon: "ri-group-2-line",
    name: "Bowling XI — Team 1",
    desc: "Bowling lineup for Team 1 — overs bowled, wickets taken and economy rate.",
    bg: "linear-gradient(135deg,#8E54E9,#4776E6)",
  },
  {
    icon: "ri-group-2-line",
    name: "Bowling XI — Team 2",
    desc: "Bowling lineup for Team 2 — overs bowled, wickets taken and economy rate.",
    bg: "linear-gradient(135deg,#8E54E9,#4776E6)",
  },
];

function txMeta(description: string | undefined) {
  const desc = description?.toLowerCase() ?? "";
  const isBundle = desc.includes("bundle");
  const isAddon = !isBundle && (desc.includes("overlay") || desc.includes("addon"));
  const isSub =
    !isBundle && !isAddon && (desc.includes("plan") || desc.includes("subscription"));
  if (isBundle) return { label: "Bundle", icon: "ri-layout-grid-line", tone: "primary" as const };
  if (isAddon) return { label: "Add-on", icon: "ri-vip-crown-line", tone: "warning" as const };
  if (isSub) return { label: "Subscription", icon: "ri-broadcast-line", tone: "success" as const };
  return { label: "Payment", icon: "ri-money-rupee-circle-line", tone: "neutral" as const };
}

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

function SubBadge({ status }: { status: SubscriptionStatus }) {
  if (status === "active")
    return (
      <Badge tone="success" icon="ri-checkbox-circle-fill">
        Active
      </Badge>
    );
  if (status === "expired")
    return (
      <Badge tone="danger" icon="ri-close-circle-line">
        Expired
      </Badge>
    );
  return (
    <Badge tone="neutral" icon="ri-minus-circle-line">
      No plan
    </Badge>
  );
}

function TxStatusBadge({ status }: { status: Transaction["status"] }) {
  if (status === "SUCCESS")
    return (
      <Badge tone="success" icon="ri-checkbox-circle-fill">
        Paid
      </Badge>
    );
  if (status === "FAILED")
    return (
      <Badge tone="danger" icon="ri-close-circle-fill">
        Failed
      </Badge>
    );
  if (status === "PENDING")
    return (
      <Badge tone="warning" icon="ri-time-fill">
        Pending
      </Badge>
    );
  return (
    <Badge tone="neutral" icon="ri-arrow-go-back-line">
      Reversed
    </Badge>
  );
}

/** Section wrapper with an anchor target for the side navigation. */
function Section({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <SectionTitle
        id={`${id}-title`}
        title={title}
        description={description}
        action={action}
        className="mb-3 flex-wrap gap-3"
      />
      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
  icon,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 sm:grid sm:grid-cols-[180px_1fr]">
      <dt className="flex items-center gap-2 text-sm text-fg-muted max-sm:w-20 max-sm:flex-shrink-0">
        <i className={cn(icon, "text-base text-fg-subtle")} aria-hidden />
        {label}
      </dt>
      <dd className={cn("min-w-0 truncate text-sm font-medium", muted ? "text-fg-subtle" : "text-fg")}>
        {value}
      </dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container-page py-6 sm:py-10" aria-busy="true" aria-label="Loading your profile">
      <span className="sr-only">Loading your profile…</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <div className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
        <Card padding="md" className="h-fit">
          <div className="flex items-center gap-4 lg:flex-col lg:items-start">
            <Skeleton className="h-14 w-14 rounded-card lg:h-20 lg:w-20" />
            <div className="flex-1 space-y-2 lg:w-full">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="mt-6 hidden space-y-2 lg:block">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </Card>
        <div className="space-y-8">
          {[3, 4, 3].map((rows, i) => (
            <div key={i}>
              <Skeleton className="mb-3 h-5 w-40" />
              <Card padding="md" className="space-y-4">
                {Array.from({ length: rows }).map((_, j) => (
                  <div key={j} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function ProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [activeSection, setActiveSection] = useState<string>("personal");
  const [showAllTx, setShowAllTx] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    toast(message, { tone: type });

  useEffect(() => {
    const loadData = async () => {
      const currentUserId = localStorage.getItem("userUUID");
      if (!currentUserId) {
        window.location.href = "/";
        return;
      }

      try {
        const userDto = await fetchCurrentUserProfile();
        const pData: UserProfile = {
          id: userDto.id,
          name: userDto.name,
          phone: userDto.phone,
          email: userDto.email !== "default" ? userDto.email : null,
        };
        setProfile(pData);
        setEditName(pData.name ?? "");
        setEditEmail(pData.email ?? "");

        const subData = await fetchMySubscription(currentUserId);
        if (subData?.hasActiveSubscription) {
          setSubscription({
            id: "sub",
            planName:
              subData.plan === "MONTHLY" ? "Monthly Plan" : "6-Month Bundle",
            cycle: subData.plan === "MONTHLY" ? "monthly" : "sixmonth",
            status: "active",
            startDate:
              subData.history[0]?.startDate || new Date().toISOString(),
            expiryDate: subData.expiresAt,
            daysRemaining: calcDaysRemaining(subData.expiresAt),
          });
        } else {
          setSubscription({
            id: "",
            planName: "None",
            cycle: "monthly",
            status: "none",
            startDate: "",
            expiryDate: "",
            daysRemaining: 0,
          });
        }

        const txData = await fetchTransactionHistory();
        setTransactions(Array.isArray(txData) ? txData : []);
      } catch (err) {
        console.error("Failed to load profile data", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Highlight the section currently in view in the side navigation.
  useEffect(() => {
    if (loading || !profile) return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -55% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, profile]);

  const nameError = !editName.trim() ? "Name is required" : undefined;
  const emailError =
    editEmail.trim() && !EMAIL_RE.test(editEmail.trim())
      ? "Enter a valid email address"
      : undefined;
  const isDirty =
    !!profile &&
    (editName !== profile.name || editEmail !== (profile.email ?? ""));

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    try {
      const res = await updateUserProfile({
        name: editName,
        email: editEmail || null,
      });
      if (res.success) {
        setProfile((p) =>
          p ? { ...p, name: editName, email: editEmail || null } : p,
        );
        localStorage.setItem("userName", editName);
        setEditMode(false);
        setSubmitAttempted(false);
        showToast("Profile updated successfully");
      } else {
        showToast(res.message || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast("Network error while saving profile", "error");
    }
    setSavingProfile(false);
  };

  const onSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (nameError || emailError || !isDirty) return;
    handleSaveProfile();
  };

  const cancelEdit = () => {
    setEditMode(false);
    setSubmitAttempted(false);
    setEditName(profile?.name ?? "");
    setEditEmail(profile?.email ?? "");
  };

  const handleLogout = async () => {
    setSigningOut(true);
    await logout();
  };

  if (loading)
    return (
      <div className="min-h-screen bg-canvas">
        <AppHeader />
        <ProfileSkeleton />
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen bg-canvas">
        <AppHeader />
        <main className="container-page py-10 sm:py-16">
          <EmptyState
            icon="ri-wifi-off-line"
            title="We couldn't load your profile"
            description="Check your connection and try again. If the problem continues, sign out and back in."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  icon="ri-refresh-line"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </Button>
                <Button
                  variant="outline"
                  icon="ri-logout-box-r-line"
                  loading={signingOut}
                  onClick={handleLogout}
                >
                  Sign out
                </Button>
              </div>
            }
          />
        </main>
      </div>
    );

  const displayedTx = showAllTx ? transactions : transactions.slice(0, 3);
  const isActive = subscription?.status === "active";
  const cycleDays = subscription?.cycle === "monthly" ? 30 : 180;
  const subProgress =
    subscription && subscription.status === "active"
      ? Math.max(
          0,
          Math.min(
            100,
            ((cycleDays - subscription.daysRemaining) / cycleDays) * 100,
          ),
        )
      : 0;
  const expiringSoon = isActive && (subscription?.daysRemaining ?? 0) <= 7;
  const successfulTx = transactions.filter((t) => t.status === "SUCCESS");
  const totalSpent = successfulTx.reduce((s, t) => s + t.amount, 0);
  const txLoadFailed = loadError && transactions.length === 0;

  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader
        user={{
          id: profile.id,
          name: profile.name,
          hasSubscription: isActive,
        }}
      />

      <main className="container-page py-6 sm:py-10">
        <PageHeader
          className="animate-fade-in"
          title="Account"
          description="Manage your profile, subscription and billing."
        />

        <div className="mt-6 grid gap-6 sm:mt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          {/* ── SUMMARY + SECTION NAV ── */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <Card padding="md" className="animate-fade-up">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <div className="relative flex-shrink-0">
                  <Avatar name={profile.name || "User"} size="xl" className="max-lg:h-14 max-lg:w-14 max-lg:text-base" />
                  {isActive && (
                    <span
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs text-canvas ring-2 ring-surface"
                      title="Subscriber"
                    >
                      <i className="ri-vip-crown-fill" aria-hidden />
                      <span className="sr-only">Subscriber</span>
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 lg:w-full">
                  <p className="truncate text-base font-semibold text-fg lg:text-lg">
                    {profile.name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-fg-muted">
                    <i className="ri-phone-line text-fg-subtle" aria-hidden />
                    <span className="font-mono tabular-nums">{profile.phone}</span>
                  </p>
                  {profile.email && (
                    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-fg-muted">
                      <i className="ri-mail-line text-fg-subtle" aria-hidden />
                      <span className="truncate">{profile.email}</span>
                    </p>
                  )}
                  {subscription && (
                    <div className="mt-3">
                      <SubBadge status={subscription.status} />
                    </div>
                  )}
                </div>
              </div>

              <nav
                aria-label="Account sections"
                className="mt-5 hidden border-t border-line pt-4 lg:block"
              >
                <ul className="space-y-0.5">
                  {SECTIONS.map((s) => {
                    const active = activeSection === s.id;
                    return (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          onClick={() => setActiveSection(s.id)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-surface-3",
                            active
                              ? "bg-primary-soft text-primary-soft-fg"
                              : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                          )}
                        >
                          <i
                            className={cn(s.icon, "text-base", active ? "text-current" : "text-fg-subtle")}
                            aria-hidden
                          />
                          {s.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </Card>
          </aside>

          {/* ── SECTIONS ── */}
          <div className="min-w-0 space-y-10">
            {/* PERSONAL DETAILS */}
            <Section
              id="personal"
              title="Personal details"
              description="Your name and contact information."
              action={
                !editMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon="ri-edit-line"
                    onClick={() => setEditMode(true)}
                  >
                    Edit
                  </Button>
                )
              }
            >
              <Card padding="md">
                {editMode ? (
                  <form onSubmit={onSubmitProfile} noValidate className="space-y-5 animate-fade-in">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        label="Full name"
                        required
                        error={submitAttempted || !editName.trim() ? nameError : undefined}
                      >
                        {({ id, describedBy, invalid }) => (
                          <Input
                            id={id}
                            aria-describedby={describedBy}
                            invalid={invalid}
                            icon="ri-user-line"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Full name"
                            autoComplete="name"
                            autoFocus
                          />
                        )}
                      </Field>
                      <Field
                        label="Email"
                        optional
                        error={emailError}
                        hint="Used for receipts and account updates."
                      >
                        {({ id, describedBy, invalid }) => (
                          <Input
                            id={id}
                            type="email"
                            aria-describedby={describedBy}
                            invalid={invalid}
                            icon="ri-mail-line"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                          />
                        )}
                      </Field>
                      <Field label="Phone" hint="Your phone number is your login and can't be changed.">
                        {({ id, describedBy }) => (
                          <Input
                            id={id}
                            aria-describedby={describedBy}
                            icon="ri-phone-line"
                            value={profile.phone ?? ""}
                            disabled
                            readOnly
                            className="font-mono tabular-nums"
                          />
                        )}
                      </Field>
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-fg-subtle" aria-live="polite">
                        {isDirty ? (
                          <span className="inline-flex items-center gap-1.5 text-warning-soft-fg">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
                            Unsaved changes
                          </span>
                        ) : (
                          "No changes yet"
                        )}
                      </p>
                      <div className="flex gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={cancelEdit}
                          disabled={savingProfile}
                          className="max-sm:flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          icon="ri-check-line"
                          loading={savingProfile}
                          disabled={savingProfile || !isDirty || !!nameError || !!emailError}
                          className="max-sm:flex-1"
                        >
                          {savingProfile ? "Saving…" : "Save changes"}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <dl className="divide-y divide-line">
                    <DetailRow label="Name" icon="ri-user-line" value={profile.name} />
                    <DetailRow
                      label="Phone"
                      icon="ri-phone-line"
                      value={<span className="font-mono tabular-nums">{profile.phone}</span>}
                    />
                    <DetailRow
                      label="Email"
                      icon="ri-mail-line"
                      value={profile.email ?? "Not added"}
                      muted={!profile.email}
                    />
                  </dl>
                )}
              </Card>
            </Section>

            {/* SUBSCRIPTION */}
            <Section
              id="subscription"
              title="Subscription"
              description="Your plan and what it unlocks."
            >
              <div className="space-y-4">
                {!subscription ? (
                  <Alert
                    tone="danger"
                    title="Couldn't load your subscription"
                    action={
                      <Button size="sm" variant="outline" icon="ri-refresh-line" onClick={() => window.location.reload()}>
                        Retry
                      </Button>
                    }
                  >
                    Your plan details are temporarily unavailable.
                  </Alert>
                ) : isActive ? (
                  <Card padding="none" className="overflow-hidden">
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <IconTile icon="ri-vip-crown-line" tone="warning" />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-fg sm:text-lg">
                                {subscription.planName}
                              </h3>
                              <SubBadge status={subscription.status} />
                            </div>
                            <p className="mt-0.5 text-sm text-fg-muted">
                              {subscription.cycle === "monthly" ? "Billed monthly" : "6-month term"}
                            </p>
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-xs text-fg-subtle">Expires</p>
                          <p className="text-sm font-semibold text-fg">
                            {fmtDate(subscription.expiryDate)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="mb-2 flex items-baseline justify-between gap-3">
                          <p className="text-sm text-fg-muted">
                            <span
                              className={cn(
                                "font-display text-3xl font-bold leading-none tabular-nums",
                                expiringSoon ? "text-warning-soft-fg" : "text-fg",
                              )}
                            >
                              {subscription.daysRemaining}
                            </span>{" "}
                            days remaining
                          </p>
                          <p className="font-mono text-xs tabular-nums text-fg-subtle">
                            {Math.round(subProgress)}% used
                          </p>
                        </div>
                        <div
                          className="h-2 overflow-hidden rounded-full bg-surface-3"
                          role="progressbar"
                          aria-label="Subscription period used"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(subProgress)}
                        >
                          <div
                            className={cn(
                              "h-full rounded-full transition-[width] duration-700 ease-out",
                              expiringSoon ? "bg-warning" : "bg-primary",
                            )}
                            style={{ width: `${subProgress}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex justify-between text-xs text-fg-subtle">
                          <span>Started {fmtDate(subscription.startDate)}</span>
                          <span>Ends {fmtDate(subscription.expiryDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 border-t border-line bg-surface-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <p className="text-sm text-fg-muted">
                        {expiringSoon
                          ? "Your plan ends soon — extend to keep overlays unlocked."
                          : "Extend anytime to add more days to your plan."}
                      </p>
                      <ButtonLink href="/pricing" icon="ri-arrow-up-circle-line" size="sm">
                        Extend plan
                      </ButtonLink>
                    </div>
                  </Card>
                ) : (
                  <Card padding="md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <IconTile icon="ri-gift-line" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-fg">
                              No active subscription
                            </h3>
                            <SubBadge status={subscription.status} />
                          </div>
                          <p className="mt-1 max-w-md text-sm text-fg-muted">
                            You can stream for free with the live score overlay. Subscribe
                            to auto-unlock the IPL Bundle (8 professional overlays) for
                            every match you run — no ₹99/match fee.
                          </p>
                        </div>
                      </div>
                      <ButtonLink href="/pricing" icon="ri-vip-crown-line" className="flex-shrink-0">
                        View plans
                      </ButtonLink>
                    </div>
                  </Card>
                )}

                {isActive && (
                  <Card padding="md">
                    <CardHeader
                      title="Subscription benefits"
                      description="What your plan gives you on top of the free tier"
                    />
                    <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                      {BENEFITS.map((f) => (
                        <li key={f.text} className="flex items-start gap-2.5 text-sm text-fg">
                          <i className="ri-check-line mt-px text-base text-success" aria-hidden />
                          {f.text}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
                  <i className="ri-broadcast-line mt-0.5 text-lg text-success" aria-hidden />
                  <p className="text-sm text-fg-muted">
                    <span className="font-medium text-fg">Streaming is free.</span>{" "}
                    Dashboard access, OBS URL generation, real-time score sync, and the
                    live score overlay are available on every match at no cost.
                  </p>
                </div>
              </div>
            </Section>

            {/* OVERLAYS */}
            <Section
              id="overlays"
              title="Overlays"
              description="8 IPL Bundle overlays per match — buy once for ₹99 or auto-unlock every match with a subscription."
              action={
                isActive ? (
                  <Badge tone="success" icon="ri-lock-unlock-line">
                    Auto-unlocked
                  </Badge>
                ) : (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1 rounded text-sm font-medium text-primary underline-offset-2 transition-colors hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Subscribe to auto-unlock
                    <i className="ri-arrow-right-line" aria-hidden />
                  </Link>
                )
              }
            >
              <Card padding="md">
                <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <span
                    className="h-10 w-14 flex-shrink-0 rounded-lg"
                    style={{ background: "linear-gradient(135deg,#11998e,#38ef7d)" }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">Live Score Overlay</p>
                    <p className="text-xs text-fg-muted">
                      Real-time bottom scoreboard for OBS — always on, always free
                    </p>
                  </div>
                  <Badge tone="success" size="xs">
                    Free
                  </Badge>
                </div>

                <p className="eyebrow mb-3 mt-6 text-fg-subtle">IPL Bundle</p>
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {BUNDLE_OVERLAYS.map((b) => (
                    <li
                      key={b.name}
                      className="overflow-hidden rounded-xl border border-line bg-surface"
                      title={b.desc}
                    >
                      <div className="h-10 sm:h-12" style={{ background: b.bg }} aria-hidden />
                      <div className="p-2.5 sm:p-3">
                        <p className="flex items-center gap-1.5 text-xs font-medium leading-tight text-fg sm:text-sm">
                          <i className={cn(b.icon, "flex-shrink-0 text-fg-subtle")} aria-hidden />
                          <span className="min-w-0">{b.name}</span>
                        </p>
                        <p className="mt-1 line-clamp-2 text-2xs leading-snug text-fg-muted sm:text-xs">
                          {b.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {!isActive && (
                  <Alert tone="info" className="mt-4">
                    Buy the IPL Bundle for ₹99/match from the stream dashboard, or{" "}
                    <Link href="/pricing" className="rounded-sm font-medium underline underline-offset-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      subscribe
                    </Link>{" "}
                    to auto-unlock it for every match.
                  </Alert>
                )}
              </Card>
            </Section>

            {/* BILLING HISTORY */}
            <Section
              id="billing"
              title="Billing history"
              description="All payments and invoices."
            >
              {transactions.length > 0 && (
                <dl className="mb-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Total spent", value: `₹${totalSpent.toLocaleString("en-IN")}` },
                    { label: "Successful", value: successfulTx.length.toString() },
                    { label: "Transactions", value: transactions.length.toString() },
                  ].map((s) => (
                    <div key={s.label} className="rounded-card border border-line bg-surface px-3 py-3 shadow-card sm:px-5 sm:py-4">
                      <dt className="truncate text-xs text-fg-muted sm:text-sm">{s.label}</dt>
                      <dd className="mt-1.5 truncate font-display text-2xl font-bold leading-none tabular-nums text-fg sm:text-4xl">
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {txLoadFailed ? (
                <Alert
                  tone="danger"
                  title="Couldn't load your billing history"
                  action={
                    <Button size="sm" variant="outline" icon="ri-refresh-line" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  }
                >
                  Your payments are safe — we just couldn&apos;t fetch them right now.
                </Alert>
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon="ri-receipt-line"
                  title="No transactions yet"
                  description="Your payment history will appear here."
                  action={
                    <ButtonLink href="/pricing" variant="outline" size="sm" icon="ri-vip-crown-line">
                      View plans
                    </ButtonLink>
                  }
                />
              ) : (
                <Card padding="none" className="overflow-hidden">
                  {/* Desktop table */}
                  <table className="hidden w-full table-fixed text-left text-sm md:table">
                    <thead className="border-b border-line bg-surface-2 text-xs font-medium text-fg-muted">
                      <tr>
                        <th scope="col" className="px-5 py-2.5 font-medium">Description</th>
                        <th scope="col" className="w-28 px-3 py-2.5 font-medium">Date</th>
                        <th scope="col" className="w-40 px-3 py-2.5 font-medium">Reference</th>
                        <th scope="col" className="w-24 px-3 py-2.5 text-right font-medium">Amount</th>
                        <th scope="col" className="w-32 px-5 py-2.5 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {displayedTx.map((tx) => {
                        const m = txMeta(tx.description);
                        return (
                          <tr key={tx.id} className="transition-colors hover:bg-surface-2">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <IconTile icon={m.icon} tone={m.tone} size="sm" />
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-fg">{tx.description}</p>
                                  <p className="text-xs text-fg-subtle">{m.label}</p>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-fg-muted">{fmtDate(tx.date)}</td>
                            <td className="px-3 py-3">
                              <span className="block truncate font-mono text-xs text-fg-muted">{tx.invoiceId}</span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right font-mono font-semibold tabular-nums text-fg">
                              ₹{tx.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <TxStatusBadge status={tx.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Mobile cards */}
                  <ul className="divide-y divide-line md:hidden">
                    {displayedTx.map((tx) => {
                      const m = txMeta(tx.description);
                      return (
                        <li key={tx.id} className="flex items-start gap-3 px-4 py-3.5">
                          <IconTile icon={m.icon} tone={m.tone} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="min-w-0 truncate text-sm font-medium text-fg">
                                {tx.description}
                              </p>
                              <p className="flex-shrink-0 font-mono text-sm font-semibold tabular-nums text-fg">
                                ₹{tx.amount.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-3">
                              <p className="min-w-0 truncate text-xs text-fg-subtle">
                                {fmtDate(tx.date)} · {m.label}
                              </p>
                              <TxStatusBadge status={tx.status} />
                            </div>
                            {tx.invoiceId && (
                              <p className="mt-1 truncate font-mono text-2xs text-fg-subtle">
                                {tx.invoiceId}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {transactions.length > 3 && (
                    <div className="border-t border-line bg-surface-2 px-4 py-2.5 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={showAllTx ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
                        onClick={() => setShowAllTx((v) => !v)}
                        aria-expanded={showAllTx}
                      >
                        {showAllTx ? "Show less" : `Show all ${transactions.length} transactions`}
                      </Button>
                    </div>
                  )}
                </Card>
              )}
            </Section>

            {/* SIGN OUT */}
            <Section id="account" title="Sign out" description="End your session on this device.">
              <Card padding="md" className="border-danger/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <IconTile icon="ri-logout-box-r-line" tone="danger" />
                    <div>
                      <p className="text-sm font-medium text-fg">Sign out of CricsHub</p>
                      <p className="mt-0.5 text-sm text-fg-muted">
                        You&apos;ll need your phone number and OTP to sign back in.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    icon="ri-logout-box-r-line"
                    loading={signingOut}
                    onClick={handleLogout}
                    className="flex-shrink-0"
                  >
                    Sign out
                  </Button>
                </div>
              </Card>
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}
