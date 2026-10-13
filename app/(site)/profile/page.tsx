"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  fetchCurrentUserProfile,
  updateUserProfile,
  fetchMySubscription,
  fetchTransactionHistory,
} from "@/lib/api";

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
const initials = (n: string) =>
  n
    ? n
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

function calcDaysRemaining(dateStr: string): number {
  if (!dateStr) return 0;
  const remaining = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86400000,
  );
  return remaining > 0 ? remaining : 0;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════

function SectionHeader({
  icon,
  title,
  sub,
  action,
}: {
  icon: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start sm:items-center justify-between mb-5 gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
          <i className={`${icon} text-white text-base`} />
        </div>
        <div>
          <h2 className="font-black text-gray-900 text-lg leading-none">
            {title}
          </h2>
          {sub && (
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              {sub}
            </p>
          )}
        </div>
      </div>
      {action && <div className="ml-12 sm:ml-0">{action}</div>}
    </div>
  );
}

function SubBadge({ status }: { status: SubscriptionStatus }) {
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Active
      </span>
    );
  if (status === "expired")
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">
        <i className="ri-close-circle-line" />
        Expired
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
      <i className="ri-minus-circle-line" />
      No Plan
    </span>
  );
}

function Toast({
  message,
  type,
  onDone,
}: {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold w-[calc(100%-2rem)] max-w-sm
      ${type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
    >
      <i
        className={
          type === "success"
            ? "ri-checkbox-circle-fill text-lg flex-shrink-0"
            : "ri-close-circle-fill text-lg flex-shrink-0"
        }
      />
      <span className="truncate">{message}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "overview" | "overlays" | "billing"
  >("overview");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showAllTx, setShowAllTx] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") =>
    setToast({ message, type });

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
        setEditName(pData.name);
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
        setTransactions(txData);
      } catch (err) {
        console.error("Failed to load profile data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
        showToast("Profile updated successfully");
      } else {
        showToast(res.message || "Failed to update profile", "error");
      }
    } catch (err) {
      showToast("Network error while saving profile", "error");
    }
    setSavingProfile(false);
  };

  const handleLogout = async () => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1/auth/logout`,
      { method: "POST", credentials: "include" },
    ).catch(() => {});
    localStorage.removeItem("userUUID");
    localStorage.removeItem("userName");
    localStorage.removeItem("hasSubscription");
    document.cookie = "sessionActive=; path=/; Max-Age=0";
    window.location.href = "/";
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-xl animate-pulse">
            <i className="ri-user-line text-white text-3xl" />
          </div>
          <p className="font-semibold text-gray-500">Loading your profile…</p>
        </div>
      </div>
    );

  const displayedTx = showAllTx ? transactions : transactions.slice(0, 3);
  const subProgress =
    subscription && subscription.status === "active"
      ? Math.max(
          0,
          Math.min(
            100,
            (((subscription.cycle === "monthly" ? 30 : 180) -
              subscription.daysRemaining) /
              (subscription.cycle === "monthly" ? 30 : 180)) *
              100,
          ),
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 font-semibold transition-colors flex-shrink-0"
            >
              <i className="ri-arrow-left-line" />
              <span className="hidden xs:inline">Dashboard</span>
            </Link>
            <span className="text-gray-200 hidden sm:block">|</span>
            <div className="hidden sm:flex items-center gap-2">
              <Image
                src="/images/iconLogo.png"
                alt="Cricshub"
                width={26}
                height={26}
                className="rounded-md"
              />
              <span className="font-black text-gray-900 text-sm">
                My Profile
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {subscription && <SubBadge status={subscription.status} />}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <i className="ri-logout-circle-line text-lg sm:text-xl" />
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-5xl space-y-5 sm:space-y-8">
        {/* ── PROFILE HERO ── */}
        <div className="relative bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-blue-200">
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="relative z-10 px-5 sm:px-8 py-6 sm:py-8">
            <div className="flex items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-lg">
                  {profile ? initials(profile.name) : "U"}
                </div>
                {subscription?.status === "active" && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-md">
                    <i className="ri-vip-crown-fill text-white text-[10px] sm:text-xs" />
                  </div>
                )}
              </div>

              {/* Details + Edit button stacked */}
              <div className="flex-1 min-w-0">
                {editMode ? (
                  <div className="space-y-2 max-w-sm">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 rounded-xl bg-white/20 border border-white/40 text-white placeholder:text-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    <input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="w-full px-3 py-2 rounded-xl bg-white/20 border border-white/40 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex items-center gap-1.5 bg-white text-[#1E88E5] font-black text-xs px-4 py-2 rounded-xl hover:bg-white/90 transition-all disabled:opacity-60"
                      >
                        {savingProfile ? (
                          <>
                            <i className="ri-loader-4-line animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <i className="ri-check-line" />
                            Save
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setEditName(profile?.name ?? "");
                          setEditEmail(profile?.email ?? "");
                        }}
                        className="flex items-center gap-1 bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-white/30 transition-all"
                      >
                        <i className="ri-close-line" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-xl sm:text-2xl font-black text-white mb-0.5 truncate">
                        {profile?.name}
                      </h1>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-white/70 text-sm">
                        <span className="flex items-center gap-1">
                          <i className="ri-phone-line flex-shrink-0" />
                          {profile?.phone}
                        </span>
                        {profile?.email && (
                          <span className="flex items-center gap-1 min-w-0">
                            <i className="ri-mail-line flex-shrink-0" />
                            <span className="truncate">{profile.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl transition-all"
                    >
                      <i className="ri-edit-line" />
                      <span className="hidden sm:inline">Edit Profile</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS — full-width grid, no scroll ── */}
        <div className="bg-white border border-gray-100 shadow-sm p-1.5 rounded-2xl grid grid-cols-3 gap-1.5">
          {[
            {
              key: "overview",
              icon: "ri-home-4-line",
              label: "Sub",
              fullLabel: "Subscription",
            },
            {
              key: "overlays",
              icon: "ri-layout-top-2-line",
              label: "Overlays",
              fullLabel: "My Overlays",
            },
            {
              key: "billing",
              icon: "ri-receipt-line",
              label: "Billing",
              fullLabel: "Billing History",
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 min-w-0
                                ${activeTab === tab.key ? "bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white shadow-md" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
            >
              <i className={`${tab.icon} text-sm flex-shrink-0`} />
              <span className="min-[480px]:inline hidden truncate">
                {tab.fullLabel}
              </span>
              <span className="min-[480px]:hidden truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: SUBSCRIPTION OVERVIEW */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-5 sm:space-y-6">
            {/* Free tier callout */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <i className="ri-broadcast-line text-emerald-600 text-base sm:text-lg" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm">
                  Streaming is free
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Dashboard access, OBS URL generation, real-time score sync,
                  and the live score overlay are available on every match at no
                  cost.
                </p>
              </div>
            </div>

            {subscription && subscription.status === "active" ? (
              <>
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 sm:px-7 pt-6 sm:pt-7 pb-5 sm:pb-6 relative overflow-hidden bg-gradient-to-br from-[#0f2744] to-[#1a3a6e]">
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
                    <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <SubBadge status={subscription.status} />
                          </div>
                          <h3 className="text-white font-black text-xl sm:text-2xl">
                            {subscription.planName}
                          </h3>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                            Expires
                          </p>
                          <p className="text-white font-black text-base sm:text-lg">
                            {fmtDate(subscription.expiryDate)}
                          </p>
                          <p className="text-white/60 text-xs mt-0.5">
                            {subscription.daysRemaining} days remaining
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 sm:mt-5">
                        <div className="flex justify-between text-white/50 text-[10px] font-semibold mb-1.5">
                          <span>{fmtDate(subscription.startDate)}</span>
                          <span>{fmtDate(subscription.expiryDate)}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#34B8FF] to-emerald-400 rounded-full transition-all duration-1000"
                            style={{ width: `${subProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-gray-50">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
                    >
                      <i className="ri-arrow-up-circle-line" />
                      Extend Plan
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                  <SectionHeader
                    icon="ri-gift-line"
                    title="Subscription Benefit"
                    sub="What your plan gives you on top of the free tier"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {[
                      {
                        icon: "ri-layout-grid-line",
                        text: "IPL Bundle auto-unlocked for every match",
                      },
                      {
                        icon: "ri-price-tag-3-line",
                        text: "No ₹99/match fee — overlays activate instantly",
                      },
                      {
                        icon: "ri-layout-top-2-line",
                        text: "Main Match Banner & Live Score Overlay",
                      },
                      {
                        icon: "ri-file-list-3-line",
                        text: "Match Summary with top batters & bowlers",
                      },
                      {
                        icon: "ri-team-line",
                        text: "Playing XI — combined, batting & bowling (×4)",
                      },
                      {
                        icon: "ri-stack-line",
                        text: "All 8 IPL Bundle overlays per match",
                      },
                    ].map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 sm:px-4 py-2.5"
                      >
                        <i
                          className={`${f.icon} text-[#34B8FF] text-base flex-shrink-0`}
                        />
                        <p className="text-sm text-gray-700 font-medium">
                          {f.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-10 text-center">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 sm:mb-5">
                  <i className="ri-gift-line text-[#1E88E5] text-2xl sm:text-3xl" />
                </div>
                <h3 className="font-black text-gray-900 text-lg sm:text-xl mb-2">
                  No Active Subscription
                </h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed mb-5 sm:mb-6">
                  You can stream for free with the live score overlay. Subscribe
                  to auto-unlock the IPL Bundle (8 professional overlays) for
                  every match you run — no ₹99/match fee.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-bold px-6 sm:px-7 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
                >
                  <i className="ri-gift-line" />
                  View Plans
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: MY OVERLAYS */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "overlays" && (
          <div className="space-y-5 sm:space-y-6">
            {/* Free overlay */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <SectionHeader
                icon="ri-broadcast-line"
                title="Free Overlay"
                sub="Available on every match, no payment needed"
              />
              <div className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all max-w-xs">
                <div
                  className="h-14 sm:h-16"
                  style={{
                    background: "linear-gradient(135deg,#11998e,#38ef7d)",
                  }}
                />
                <div className="p-3 flex items-start gap-3">
                  <i className="ri-bar-chart-fill text-emerald-500 text-sm mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm">
                      Live Score Overlay
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Real-time bottom scoreboard for OBS — always on, always
                      free
                    </p>
                  </div>
                  <span className="ml-auto flex-shrink-0 text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    FREE
                  </span>
                </div>
              </div>
            </div>

            {/* IPL Bundle */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <SectionHeader
                icon="ri-layout-grid-line"
                title="IPL Bundle"
                sub="8 overlays per match — buy once for ₹99 or auto-unlock every match with a subscription"
                action={
                  subscription?.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-3 py-1 rounded-full whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Auto-unlocked
                    </span>
                  ) : (
                    <Link
                      href="/pricing"
                      className="text-xs font-bold text-[#1E88E5] hover:underline whitespace-nowrap"
                    >
                      Subscribe to auto-unlock →
                    </Link>
                  )
                }
              />
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {[
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
                ].map((b) => (
                  <div
                    key={b.name}
                    className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                  >
                    <div
                      className="h-10 sm:h-14"
                      style={{ background: b.bg }}
                    />
                    <div className="p-2.5 sm:p-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                        <i
                          className={`${b.icon} text-[#34B8FF] text-sm flex-shrink-0`}
                        />
                        <p className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">
                          {b.name}
                        </p>
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-400 leading-snug">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {subscription?.status !== "active" && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-3 sm:p-4 flex items-start gap-3">
                  <i className="ri-information-line text-[#1E88E5] text-lg sm:text-xl flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Buy the IPL Bundle for ₹99/match from the stream
                    dashboard, or{" "}
                    <Link href="/pricing" className="font-bold underline">
                      subscribe
                    </Link>{" "}
                    to auto-unlock it for every match.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB: BILLING HISTORY */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "billing" && (
          <div className="space-y-4 sm:space-y-5">
            {/* Summary Stats — 1-col on mobile, 3-col on sm+ */}
            {transactions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  {
                    icon: "ri-money-rupee-circle-line",
                    label: "Total Spent",
                    value: `₹${transactions
                      .filter((t) => t.status === "SUCCESS")
                      .reduce((s, t) => s + t.amount, 0)
                      .toLocaleString("en-IN")}`,
                    light: "bg-blue-50 text-[#1E88E5]",
                  },
                  {
                    icon: "ri-checkbox-circle-line",
                    label: "Successful",
                    value: transactions
                      .filter((t) => t.status === "SUCCESS")
                      .length.toString(),
                    light: "bg-emerald-50 text-emerald-600",
                  },
                  {
                    icon: "ri-file-list-3-line",
                    label: "Total Transactions",
                    value: transactions.length.toString(),
                    light: "bg-violet-50 text-violet-600",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4"
                  >
                    <div
                      className={`w-10 sm:w-11 h-10 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.light}`}
                    >
                      <i className={`${s.icon} text-lg sm:text-xl`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">
                        {s.label}
                      </p>
                      <p className="text-xl font-black text-gray-900 leading-tight">
                        {s.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Transactions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
                    <i className="ri-receipt-line text-white text-base" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 text-lg leading-none">
                      Billing History
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      All payments and invoices
                    </p>
                  </div>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12 sm:py-16 px-6">
                  <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                    <i className="ri-receipt-line text-gray-300 text-2xl" />
                  </div>
                  <p className="font-black text-gray-400 text-base mb-1">
                    No transactions yet
                  </p>
                  <p className="text-sm text-gray-300 mb-5">
                    Your payment history will appear here
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all"
                  >
                    <i className="ri-vip-crown-line" />
                    View Plans
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {displayedTx.map((tx) => {
                    const desc = tx.description?.toLowerCase() ?? "";
                    const isBundle = desc.includes("bundle");
                    const isAddon =
                      !isBundle &&
                      (desc.includes("overlay") || desc.includes("addon"));
                    const isSub =
                      !isBundle &&
                      !isAddon &&
                      (desc.includes("plan") || desc.includes("subscription"));
                    const txLabel = isBundle
                      ? "Bundle"
                      : isAddon
                        ? "Add-on"
                        : isSub
                          ? "Subscription"
                          : "Payment";
                    const txStyle = isBundle
                      ? "bg-violet-50 text-violet-700 border-violet-100"
                      : isAddon
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-blue-50 text-blue-600 border-blue-100";
                    const iconStyle = isBundle
                      ? "bg-violet-50 ri-layout-grid-line text-violet-500"
                      : isAddon
                        ? "bg-amber-50 ri-vip-crown-line text-amber-500"
                        : isSub
                          ? "bg-blue-50 ri-broadcast-line text-[#1E88E5]"
                          : "bg-gray-50 ri-money-rupee-circle-line text-gray-400";

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 hover:bg-gray-50/60 transition-colors"
                      >
                        {/* Icon */}
                        <div
                          className={`w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isBundle ? "bg-violet-50" : isAddon ? "bg-amber-50" : isSub ? "bg-blue-50" : "bg-gray-50"}`}
                        >
                          <i className={`text-base sm:text-lg ${iconStyle}`} />
                        </div>

                        {/* Description + date */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-400">
                              {fmtDate(tx.date)}
                            </span>
                            <span className="text-gray-200 hidden sm:inline">
                              ·
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-flex ${txStyle}`}
                            >
                              {txLabel}
                            </span>
                          </div>
                        </div>

                        {/* Ref ID — desktop only */}
                        <div className="hidden md:block flex-shrink-0">
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                            {tx.invoiceId}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="flex-shrink-0 text-right">
                          <p className="font-black text-gray-900 text-sm">
                            ₹{tx.amount.toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Status pill */}
                        <div className="flex-shrink-0">
                          {tx.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
                              <i className="ri-checkbox-circle-fill text-xs" />
                              <span className="hidden sm:inline">Paid</span>
                            </span>
                          ) : tx.status === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-black px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
                              <i className="ri-close-circle-fill text-xs" />
                              <span className="hidden sm:inline">Failed</span>
                            </span>
                          ) : tx.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-black px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
                              <i className="ri-time-fill text-xs" />
                              <span className="hidden sm:inline">Pending</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-black px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap">
                              <i className="ri-arrow-go-back-line text-xs" />
                              <span className="hidden sm:inline">Reversed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {transactions.length > 3 && (
                    <div className="px-4 sm:px-6 py-4 text-center bg-gray-50/50">
                      <button
                        onClick={() => setShowAllTx((v) => !v)}
                        className="text-sm font-bold text-[#34B8FF] hover:text-[#1E88E5] flex items-center gap-1.5 mx-auto transition-colors"
                      >
                        {showAllTx ? (
                          <>
                            <i className="ri-arrow-up-s-line" />
                            Show less
                          </>
                        ) : (
                          <>
                            <i className="ri-arrow-down-s-line" />
                            Show all {transactions.length} transactions
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </div>
  );
}
