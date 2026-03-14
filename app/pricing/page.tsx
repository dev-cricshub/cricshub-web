"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import UpiCheckoutModal from "@/app/components/UpiCheckoutModal";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type BillingCycle = "monthly" | "sixmonth";
type PageStep = "plans" | "checkout" | "success";

interface SubscriptionPlan {
  id: string;
  cycle: BillingCycle;
  name: string;
  price: number;
  originalPrice?: number;
  perMonth?: number;
  badge?: string;
  highlight: boolean;
  streamingFeatures: string[];
  bundleFeatures: string[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  itemType: "subscription";
  meta?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "sub-monthly",
    cycle: "monthly",
    name: "Monthly",
    price: 499,
    perMonth: 499,
    badge: "Most Flexible",
    highlight: false,
    streamingFeatures: [
      "OBS browser source URL generation",
      "Stream lock & operator handover",
      "Real-time score sync (auto)",
      "Priority support access",
    ],
    bundleFeatures: [
      "Basic Bundle auto-unlocked for ALL your matches",
      "No ₹99/match fee — overlays activate instantly",
      "Main Banner, Score, Playing XI & Summary included",
      "Unlimited matches covered",
    ],
  },
  {
    id: "sub-6month",
    cycle: "sixmonth",
    name: "6-Month Plan",
    price: 2499,
    originalPrice: 2994,
    perMonth: 416,
    badge: "Best Value",
    highlight: true,
    streamingFeatures: [
      "Everything in Monthly",
      "Priority support",
      "Early access to new overlay templates",
      "Usage analytics dashboard",
    ],
    bundleFeatures: [
      "All Monthly benefits included",
      "Saves ₹495 vs monthly billing",
      "Extended match history",
      "Multi-match management view",
    ],
  },
];

// Real bundle catalogue — mirrors what the stream dashboard fetches from backend
const BUNDLE_CATALOGUE = [
  {
    id: "bundle-basic",
    name: "Basic Bundle",
    price: 99,
    gradient: "linear-gradient(135deg,#34B8FF,#1E88E5)",
    accentColor: "#1E88E5",
    desc: "8 clean professional overlays — the essential streaming kit for every match.",
    overlayCount: 8,
    overlays: [
      "Main Match Banner",
      "Live Score Overlay",
      "Match Summary",
      "Playing XI — Both Teams",
      "Batting XI (Team 1 & Team 2)",
      "Bowling XI (Team 1 & Team 2)",
    ],
  },
  {
    id: "bundle-glass",
    name: "Glass Bundle",
    price: 99,
    gradient: "linear-gradient(135deg,#00D4AA,#22D3EE)",
    accentColor: "#00D4AA",
    desc: "Frosted-glass aesthetic with teal glow accents — premium broadcast look.",
    overlayCount: 8,
    overlays: [
      "Glass Main Match Banner",
      "Glass Score Overlay",
      "Glass Match Summary",
      "Glass Playing XI — Both Teams",
      "Glass Batting XI (Team 1 & Team 2)",
      "Glass Bowling XI (Team 1 & Team 2)",
    ],
  },
  {
    id: "bundle-material",
    name: "Material Bundle",
    price: 99,
    gradient: "linear-gradient(135deg,#009688,#00BCD4)",
    accentColor: "#009688",
    desc: "Clean, flat-design overlays with crisp solid colors and stark broadcast typography.",
    overlayCount: 8,
    overlays: [
      "Material Main Match Banner",
      "Material Score Overlay",
      "Material Match Summary",
      "Material Playing XI — Both Teams",
      "Material Batting XI (Team 1 & Team 2)",
      "Material Bowling XI (Team 1 & Team 2)",
    ],
  },
  {
    id: "bundle-aero",
    name: "Aero Light Bundle",
    price: 99,
    gradient: "linear-gradient(135deg,#E0F2FE,#0D9488)",
    accentColor: "#0D9488",
    desc: "Premium modular floating islands — Apple-style light-mode design with pill badges.",
    overlayCount: 8,
    overlays: [
      "Aero Main Match Banner",
      "Aero Score Stack",
      "Aero Match Summary",
      "Aero Playing XI — Both Teams",
      "Aero Batting XI (Team 1 & Team 2)",
      "Aero Bowling XI (Team 1 & Team 2)",
    ],
  },
];

// Real premium add-on templates — mirrors ADDON_TEMPLATES in the stream dashboard
// These are fetched from backend in the dashboard; here they are shown as a static showcase
const ADDON_TEMPLATES = [
  {
    id: "tpl-pro-1",
    name: "Event Burst",
    tier: "pro" as const,
    price: 99,
    previewGradient: "linear-gradient(135deg,#00F5A0,#00D9F5)",
    popular: true,
    features: [
      "Full-screen burst animations on 4, 6, wicket, 50 & 100",
      "Two-tone broadcast scorebar with team panels",
      "Animated ball-by-ball over tracker",
      "Live batter stats with strike rate badge",
      "Bowler figures with wicket highlight",
      "Target & required run rate display",
    ],
  },
  {
    id: "tpl-pro-2",
    name: "Inline Burst",
    tier: "pro" as const,
    price: 99,
    previewGradient: "linear-gradient(135deg,#F7971E,#FFD200)",
    features: [
      "In-bar light beam animation on 4, 6, wicket, 50 & 100",
      "Broadcast-style scorebar",
      "No full-screen takeover",
      "Player name & stat reveal",
    ],
  },
  {
    id: "tpl-pro-3",
    name: "Win Predictor",
    tier: "pro" as const,
    price: 99,
    previewGradient: "linear-gradient(135deg,#2193b0,#6dd5ed)",
    features: [
      "Live win probability meter",
      "Updates every ball",
      "Pressure colour system",
      "CRR vs RRR analysis",
      "Wickets & balls remaining context",
    ],
  },
  {
    id: "tpl-pro-4",
    name: "Stream Branding",
    tier: "pro" as const,
    price: 99,
    previewGradient: "linear-gradient(135deg,#667eea,#764ba2)",
    popular: true,
    features: [
      "Custom logo upload",
      "LIVE badge & match title strip",
      "Social handle & sponsor slot",
      "Corner vignette & stream watermark",
    ],
  },
  {
    id: "tpl-pro-5",
    name: "Media Reel",
    tier: "pro" as const,
    price: 99,
    previewGradient: "linear-gradient(135deg,#f093fb,#f5576c)",
    features: [
      "Upload images & videos (up to 10 assets)",
      "Broadcast-style frame with custom sequence",
      "Loop playback & full-screen takeover",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const cartTotal = (cart: CartItem[]) => cart.reduce((s, i) => s + i.price, 0);

// ═══════════════════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function Check({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <li
      className={`flex items-start gap-2.5 text-sm ${muted ? "text-gray-400" : "text-gray-600"}`}
    >
      <i
        className={`ri-check-circle-fill flex-shrink-0 mt-0.5 ${muted ? "text-gray-300" : "text-[#34B8FF]"}`}
      />
      {text}
    </li>
  );
}

function SectionLabel({
  icon,
  label,
  sub,
}: {
  icon: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5 sm:mb-6">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
        <i className={`${icon} text-white text-base`} />
      </div>
      <div>
        <h2 className="font-black text-gray-900 text-lg sm:text-xl leading-none">
          {label}
        </h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN CARD
// ═══════════════════════════════════════════════════════════════════════════

function PlanCard({
  plan,
  inCart,
  onToggle,
}: {
  plan: SubscriptionPlan;
  inCart: boolean;
  onToggle: () => void;
}) {
  const savings = plan.originalPrice ? plan.originalPrice - plan.price : 0;
  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-2xl sm:rounded-3xl overflow-hidden border-2 transition-all duration-300 select-none
        ${inCart ? "border-[#34B8FF] shadow-2xl shadow-blue-100 scale-[1.01]" : plan.highlight ? "border-[#34B8FF]/40 shadow-xl hover:border-[#34B8FF] hover:shadow-2xl hover:shadow-blue-100" : "border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md"}`}
    >
      {plan.highlight && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#34B8FF] via-purple-400 to-[#34B8FF]" />
      )}
      <div
        className={`px-5 sm:px-7 pt-5 sm:pt-7 pb-4 sm:pb-6 relative overflow-hidden ${plan.highlight ? "bg-gradient-to-br from-[#0f2744] to-[#1a3a6e]" : "bg-gradient-to-br from-[#34B8FF] to-[#1E88E5]"}`}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10">
          {plan.badge && (
            <span className="inline-block bg-white/20 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-3 sm:mb-4">
              {plan.badge}
            </span>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-white font-black text-xl sm:text-2xl">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                <span className="text-white font-black text-3xl sm:text-4xl">
                  {fmt(plan.price)}
                </span>
                <span className="text-white/60 text-sm">
                  {plan.cycle === "monthly" ? "/month" : "for 6 months"}
                </span>
              </div>
              {plan.perMonth && plan.cycle === "sixmonth" && (
                <p className="text-white/50 text-xs mt-1">
                  Just {fmt(plan.perMonth)}/month
                </p>
              )}
              {savings > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                  <i className="ri-price-tag-3-line" />
                  Save {fmt(savings)}
                </div>
              )}
            </div>
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${inCart ? "bg-white border-white shadow-lg" : "bg-white/15 border-white/40"}`}
            >
              {inCart ? (
                <i className="ri-check-line text-[#1E88E5] font-black text-base sm:text-lg" />
              ) : (
                <i className="ri-add-line text-white text-base sm:text-lg" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white px-5 sm:px-7 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
            Streaming Dashboard
          </p>
          <ul className="space-y-2">
            {plan.streamingFeatures.map((f, i) => (
              <Check key={i} text={f} />
            ))}
          </ul>
        </div>
        <div className="border-t border-gray-50" />
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
            Included Overlays
          </p>
          <ul className="space-y-2">
            {plan.bundleFeatures.map((f, i) => (
              <Check key={i} text={f} />
            ))}
          </ul>
        </div>
        <div
          className={`w-full py-3 rounded-xl sm:rounded-2xl text-sm font-black text-center transition-all duration-200 ${inCart ? "bg-[#34B8FF]/10 text-[#1E88E5] border-2 border-[#34B8FF]/30" : plan.highlight ? "bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white shadow-md shadow-blue-200" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"}`}
        >
          {inCart
            ? "✓ Selected"
            : plan.highlight
              ? "⚡ Get Best Value"
              : "Select Plan"}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BUNDLE SHOWCASE CARD
// ═══════════════════════════════════════════════════════════════════════════

function BundleShowcaseCard({
  bundle,
}: {
  bundle: (typeof BUNDLE_CATALOGUE)[0];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
      <div
        className="h-24 sm:h-28 relative flex-shrink-0"
        style={{ background: bundle.gradient }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-black/25 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
            OBS Overlays
          </span>
        </div>
        <div className="absolute top-2.5 left-2.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-full">
          {bundle.overlayCount} overlays
        </div>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-black text-gray-900 text-base">{bundle.name}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
              {bundle.desc}
            </p>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            <p className="font-black text-gray-900 text-lg">
              {fmt(bundle.price)}
            </p>
            <p className="text-[10px] text-gray-400">per match</p>
          </div>
        </div>

        {/* Overlay list — collapsible */}
        <ul
          className={`space-y-1 mt-3 overflow-hidden transition-all duration-300 flex-1 ${expanded ? "max-h-96" : "max-h-20"}`}
        >
          {bundle.overlays.map((o, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-xs text-gray-500"
            >
              <i className="ri-check-line text-[#34B8FF] flex-shrink-0 mt-0.5" />
              {o}
            </li>
          ))}
        </ul>
        {bundle.overlays.length > 3 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs font-bold text-[#34B8FF] hover:text-[#1E88E5] flex items-center gap-1 transition-colors"
          >
            <i className={`ri-arrow-${expanded ? "up" : "down"}-s-line`} />
            {expanded
              ? "Show less"
              : `+${bundle.overlays.length - 3} more overlays`}
          </button>
        )}

        <div className="w-full mt-3 py-2.5 rounded-xl bg-gray-50 text-gray-500 text-xs font-bold text-center border border-gray-100 flex items-center justify-center gap-1.5">
          <i className="ri-broadcast-line" />
          Available in Stream Dashboard
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADD-ON SHOWCASE CARD (view-only — purchase from Stream Dashboard)
// ═══════════════════════════════════════════════════════════════════════════

function AddOnShowcaseCard({ tpl }: { tpl: (typeof ADDON_TEMPLATES)[0] }) {
  const tierStyle = "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
      <div
        className="h-24 sm:h-28 relative flex-shrink-0"
        style={{ background: tpl.previewGradient }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-black/25 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
            OBS Overlay
          </span>
        </div>
        {(tpl as any).popular && (
          <div className="absolute top-2.5 left-2.5 bg-amber-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
            🔥 Popular
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-black text-gray-900 text-base">{tpl.name}</p>
            <span
              className={`text-[9px] font-black border px-2 py-0.5 rounded-full inline-block mt-1 ${tierStyle}`}
            >
              {tpl.tier.toUpperCase()}
            </span>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            <p className="font-black text-gray-900 text-lg">₹{tpl.price}</p>
            <p className="text-[10px] text-gray-400">per match</p>
          </div>
        </div>
        <ul className="space-y-1 mb-4 flex-1">
          {tpl.features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-xs text-gray-500"
            >
              <i className="ri-check-line text-[#34B8FF] flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <div className="w-full py-2.5 rounded-xl bg-gray-50 text-gray-500 text-xs font-bold text-center border border-gray-100 flex items-center justify-center gap-1.5 mt-auto">
          <i className="ri-broadcast-line" />
          Available in Stream Dashboard
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS SCREEN
// ═══════════════════════════════════════════════════════════════════════════

function SuccessScreen({
  plan,
  onDone,
}: {
  plan: SubscriptionPlan;
  onDone: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto text-center py-10 sm:py-12 px-4">
      <div className="relative w-24 sm:w-28 h-24 sm:h-28 mx-auto mb-6 sm:mb-8">
        <div
          className="absolute inset-0 rounded-full bg-emerald-400"
          style={{ animation: "ping .8s ease 1" }}
        />
        <div className="relative w-24 sm:w-28 h-24 sm:h-28 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-green-200">
          <i className="ri-check-line text-4xl sm:text-5xl text-white" />
        </div>
      </div>
      <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
        All set! 🎉
      </h2>
      <p className="text-gray-500 mb-8 sm:mb-10 text-sm sm:text-base">
        Your <strong>{plan.name}</strong> plan is active once the owner confirms
        your payment. Head to the streaming dashboard to get started.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onDone}
          className="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Back to Plans
        </button>
        <Link
          href="/dashboard"
          className="flex-1 h-12 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
        >
          <i className="ri-live-line" />
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function PricingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<PageStep>("plans");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [showCheckout, setShowCheckout] = useState(false);

  const isInCart = (id: string) => cart.some((c) => c.id === id);
  const total = cartTotal(cart); // No GST

  const togglePlan = (plan: SubscriptionPlan) => {
    if (isInCart(plan.id)) {
      setCart([]);
      setSelectedPlan(null);
    } else {
      setCart([
        {
          id: plan.id,
          name: `${plan.name} Subscription`,
          price: plan.price,
          itemType: "subscription",
          meta: plan.cycle === "monthly" ? "₹499/month" : "6-month bundle",
        },
      ]);
      setSelectedPlan(plan);
    }
  };

  const handleCheckout = () => {
    const userId = localStorage.getItem("userUUID");
    if (!userId) {
      alert("You must be logged in to purchase a plan.");
      return;
    }
    if (!selectedPlan) return;
    setShowCheckout(true);
  };

  const handlePaymentConfirmed = () => {
    setShowCheckout(false);
    localStorage.setItem("hasSubscription", "true");
    setStep("success");
  };

  const userId =
    typeof window !== "undefined"
      ? (localStorage.getItem("userUUID") ?? "")
      : "";
  const planEnum = selectedPlan?.id === "sub-monthly" ? "MONTHLY" : "SIX_MONTH";

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* UPI Checkout Modal */}
      {showCheckout && selectedPlan && (
        <UpiCheckoutModal
          userId={userId}
          subscriptionPlan={planEnum as "MONTHLY" | "SIX_MONTH"}
          onClose={() => setShowCheckout(false)}
          onConfirmed={handlePaymentConfirmed}
        />
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 flex-shrink-0"
          >
            <Image
              src="/images/iconLogo.png"
              alt="Cricshub"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <Image
              src="/images/textLogo.png"
              alt="Cricshub"
              width={88}
              height={26}
              className="object-contain hidden sm:block"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            {cart.length > 0 && (
              <button
                onClick={handleCheckout}
                className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                <i className="ri-qr-code-line" />
                <span className="hidden min-[480px]:inline">Pay via UPI</span>
                <span className="min-[480px]:hidden">Pay</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl">
        {step === "success" && selectedPlan && (
          <SuccessScreen
            plan={selectedPlan}
            onDone={() => {
              setStep("plans");
              setCart([]);
              setSelectedPlan(null);
            }}
          />
        )}

        {step === "plans" && (
          <div className="space-y-12 sm:space-y-16">
            {/* Hero */}
            <div className="text-center px-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#1E88E5] text-xs font-black px-4 py-2 rounded-full mb-4 sm:mb-5 uppercase tracking-widest">
                <i className="ri-live-line text-red-500 animate-pulse" />
                Streaming Plans
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-3 sm:mb-4 leading-tight">
                Stream for free.
                <br />
                <span className="bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] bg-clip-text text-transparent">
                  Upgrade per match.
                </span>
              </h1>
              <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
                The streaming dashboard is free for all match admins. Buy a
                bundle (₹99/match) for polished overlays, or subscribe to
                auto-unlock them for every match you run.
              </p>
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold px-4 py-2 rounded-full mt-4 flex-wrap justify-center">
                <i className="ri-bank-line" />
                Pay via UPI · PhonePe · GPay · Paytm · BHIM
              </div>
            </div>

            {/* Free tier */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <i className="ri-bar-chart-2-line text-gray-400 text-lg" />
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900">Free — always</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Every match admin gets the streaming dashboard and a plain
                  score overlay (live score, batters, bowler) at no cost.
                </p>
              </div>
              <span className="text-xs font-black text-gray-400 bg-white border border-gray-200 px-3 py-1.5 rounded-full flex-shrink-0 self-start sm:self-auto">
                ₹0
              </span>
            </div>

            {/* Basic Bundle callout */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="ri-stack-line text-[#34B8FF] text-lg" />
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-900">
                  Overlay Bundles{" "}
                  <span className="text-xs font-bold text-[#1E88E5] bg-blue-100 px-2 py-0.5 rounded-full ml-1">
                    per match
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  4 bundle styles available — Basic, Glass, Material, and Aero
                  Light. Each bundle unlocks 8 overlays for one match. Buy
                  directly from your Stream Dashboard.
                </p>
              </div>
              <span className="text-xs font-black text-[#1E88E5] bg-blue-100 px-3 py-1.5 rounded-full flex-shrink-0 self-start sm:self-auto whitespace-nowrap">
                ₹99 / match
              </span>
            </div>

            {/* Subscription Plans */}
            <div>
              <SectionLabel
                icon="ri-vip-crown-line"
                label="Subscription Plans"
                sub="Auto-unlock the Basic Bundle for every match you run — no per-match fee."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    inCart={isInCart(plan.id)}
                    onToggle={() => togglePlan(plan)}
                  />
                ))}
              </div>
            </div>

            {/* Bundle Showcase */}
            <div>
              <SectionLabel
                icon="ri-layout-top-2-line"
                label="Overlay Bundles"
                sub="4 styles, 8 overlays each — ₹99/match. Buy from your Stream Dashboard."
              />

              {/* How it works — responsive steps */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 sm:px-6 py-4 mb-5 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#1E88E5] font-black shadow-sm flex-shrink-0 text-sm">
                      1
                    </div>
                    <p className="text-sm font-semibold text-blue-900">
                      Open your Match Dashboard.
                    </p>
                  </div>
                  <i className="ri-arrow-right-line text-blue-300 hidden sm:block flex-shrink-0" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#1E88E5] font-black shadow-sm flex-shrink-0 text-sm">
                      2
                    </div>
                    <p className="text-sm font-semibold text-blue-900">
                      Pick a bundle style & pay via UPI.
                    </p>
                  </div>
                  <i className="ri-arrow-right-line text-blue-300 hidden sm:block flex-shrink-0" />
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1E88E5] flex items-center justify-center text-white font-black shadow-sm flex-shrink-0 text-sm">
                      3
                    </div>
                    <p className="text-sm font-semibold text-blue-900">
                      Activate overlays on your stream.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {BUNDLE_CATALOGUE.map((bundle) => (
                  <BundleShowcaseCard key={bundle.id} bundle={bundle} />
                ))}
              </div>
            </div>

            {/* Premium Add-on Templates */}
            <div>
              <SectionLabel
                icon="ri-vip-crown-line"
                label="Premium Add-on Templates"
                sub="5 animated per-match templates, all ₹99. Buy from your Stream Dashboard."
              />
              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 sm:px-6 py-4 mb-5 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <i className="ri-information-line text-amber-600 text-xl flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  These animated templates are purchased per match directly from
                  your{" "}
                  <Link href="/dashboard" className="font-bold underline">
                    Stream Dashboard
                  </Link>
                  . No subscription required — each template unlocks for a
                  single match.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-black bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                  ⚡ Pro tier
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black bg-blue-50 text-[#1E88E5] border border-blue-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                  ₹99 / match
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                  5 templates
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADDON_TEMPLATES.map((tpl) => (
                  <AddOnShowcaseCard key={tpl.id} tpl={tpl} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom checkout bar */}
      {step === "plans" && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between max-w-6xl gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl border-2 border-white flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] shadow-md">
                <i className="ri-vip-crown-line text-white text-xs" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate max-w-[140px] sm:max-w-none">
                  {cart[0].name}
                </p>
                <p className="font-black text-gray-900 text-sm">{fmt(total)}</p>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-black px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl hover:shadow-xl hover:shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <i className="ri-qr-code-line text-lg" />
              <span>Pay via UPI</span>
            </button>
          </div>
        </div>
      )}
      {cart.length > 0 && step === "plans" && <div className="h-24" />}

      <link
        href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css"
        rel="stylesheet"
      />
    </div>
  );
}
