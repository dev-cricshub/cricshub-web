'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type BillingCycle = 'monthly' | 'sixmonth';
type AddOnTier = 'pro' | 'elite';
type PageStep = 'plans' | 'processing' | 'success';

interface SubscriptionPlan {
  id: string;
  cycle: BillingCycle;
  name: string;
  price: number;
  originalPrice?: number;
  perMonth?: number;
  badge?: string;
  highlight: boolean;
  includedFeatures: string[];
  dashboardFeatures: string[];
  overlayFeatures: string[];
}

interface AddOnTemplate {
  id: string;
  name: string;
  tier: AddOnTier;
  price: number;                 // per match
  previewGradient: string;
  features: string[];
  popular?: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  itemType: 'subscription' | 'addon';
  meta?: string;
}

// ═══════════════════════════════════════════════════════════
// PLACEHOLDER API CALLS
// ═══════════════════════════════════════════════════════════

async function createRazorpayOrder(amountInr: number, items: CartItem[]) {
  // TODO: POST /api/v1/payments/subscription/order
  // body: { amount: amountInr, items }
  // returns: { orderId, amount, currency }
  console.log('[PLACEHOLDER] createRazorpayOrder', { amountInr, items });
  await new Promise(r => setTimeout(r, 800));
  return { orderId: `order_mock_${Date.now()}`, amount: amountInr, currency: 'INR' };
}

async function verifyPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  items: CartItem[];
}): Promise<{ success: boolean; transactionId: string }> {
  // TODO: POST /api/v1/payments/verify
  console.log('[PLACEHOLDER] verifyPayment', payload);
  await new Promise(r => setTimeout(r, 1000));
  return { success: true, transactionId: `txn_mock_${Date.now()}` };
}

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'sub-monthly',
    cycle: 'monthly',
    name: 'Monthly',
    price: 499,
    perMonth: 499,
    badge: 'Most Flexible',
    highlight: false,
    includedFeatures: [
      'Web streaming dashboard access',
      'OBS browser source URL generation',
      'Stream lock & operator handover',
      'Real-time score sync (auto)',
    ],
    dashboardFeatures: [
      'Live score overlay (always-on)',
      'Main match banner',
      'Batting XI banner',
      'Bowling XI banner',
    ],
    overlayFeatures: [
      'Extras & toss result display',
      'Ball-by-ball ticker',
      'Current batters & bowler panel',
    ],
  },
  {
    id: 'sub-6month',
    cycle: 'sixmonth',
    name: '6-Month Bundle',
    price: 2499,
    originalPrice: 2994,
    perMonth: 416,
    badge: 'Best Value',
    highlight: true,
    includedFeatures: [
      'Everything in Monthly',
      'Priority support',
      'Early access to new overlay templates',
      'Usage analytics dashboard',
    ],
    dashboardFeatures: [
      'All Monthly dashboard features',
      'Extended match history',
      'Multi-match management view',
    ],
    overlayFeatures: [
      'All Monthly overlays',
      'Watermark-free banners',
      'Custom colour accent (coming soon)',
    ],
  },
];

const ADDON_TEMPLATES: AddOnTemplate[] = [
  {
    id: 'addon-pro-neon',
    name: 'Neon Arena',
    tier: 'pro',
    price: 99,
    previewGradient: 'linear-gradient(135deg,#00F5A0,#00D9F5)',
    popular: true,
    features: ['Animated score transitions', 'Sponsor banner slot', 'Neon glow effects', 'Full stats panel'],
  },
  {
    id: 'addon-pro-amber',
    name: 'Amber League',
    tier: 'pro',
    price: 129,
    previewGradient: 'linear-gradient(135deg,#F7971E,#FFD200)',
    features: ['Gold gradient design', 'Animated wicket flash', 'Watermark-free', 'Sponsor slot'],
  },
  {
    id: 'addon-pro-ocean',
    name: 'Ocean Pro',
    tier: 'pro',
    price: 119,
    previewGradient: 'linear-gradient(135deg,#2193b0,#6dd5ed)',
    features: ['Cool blue palette', 'Custom team colours', 'Live stats panel', 'Watermark-free'],
  },
  {
    id: 'addon-elite-diamond',
    name: 'Diamond Premium',
    tier: 'elite',
    price: 199,
    previewGradient: 'linear-gradient(135deg,#8E54E9,#4776E6)',
    popular: true,
    features: ['Full stats dashboard', 'Wagon wheel display', 'Custom branding', 'Priority OBS render', 'Dedicated support'],
  },
  {
    id: 'addon-elite-crimson',
    name: 'Crimson Grand',
    tier: 'elite',
    price: 249,
    previewGradient: 'linear-gradient(135deg,#FF416C,#FF4B2B)',
    features: ['Cinematic red theme', 'MOTM highlight card', 'Custom branding', 'Wagon wheel', 'Dedicated support'],
  },
  {
    id: 'addon-elite-cosmic',
    name: 'Cosmic Elite',
    tier: 'elite',
    price: 229,
    previewGradient: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
    features: ['Dark cinematic overlay', 'Star particle effects', 'Custom branding', 'Full stats', 'Priority render'],
  },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const GST = 0.18;
const addGst = (n: number) => n + Math.round(n * GST);
const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const cartTotal = (cart: CartItem[]) => cart.reduce((s, i) => s + i.price, 0);

// ═══════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════

function Check({ text, muted }: { text: string; muted?: boolean }) {
  return (
    <li className={`flex items-start gap-2.5 text-sm ${muted ? 'text-gray-400' : 'text-gray-600'}`}>
      <i className={`ri-check-circle-fill flex-shrink-0 mt-0.5 ${muted ? 'text-gray-300' : 'text-[#34B8FF]'}`} />
      {text}
    </li>
  );
}

function SectionLabel({ icon, label, sub }: { icon: string; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-md shadow-blue-200">
        <i className={`${icon} text-white text-base`} />
      </div>
      <div>
        <h2 className="font-black text-gray-900 text-xl leading-none">{label}</h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CART DRAWER
// ═══════════════════════════════════════════════════════════

function CartDrawer({ cart, onRemove, onClose, onCheckout, paying }: {
  cart: CartItem[]; onRemove: (id: string) => void;
  onClose: () => void; onCheckout: () => void; paying: boolean;
}) {
  const sub = cartTotal(cart);
  const gstAmt = Math.round(sub * GST);
  const total = sub + gstAmt;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl" style={{ animation: 'slideInRight .32s cubic-bezier(.16,1,.3,1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-md">
              <i className="ri-shopping-cart-2-line text-white text-lg" />
            </div>
            <div>
              <p className="font-black text-gray-900">Your Cart</p>
              <p className="text-xs text-gray-400">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <i className="ri-shopping-cart-2-line text-gray-200 text-3xl" />
              </div>
              <p className="font-bold text-gray-400">Cart is empty</p>
              <p className="text-xs text-gray-300 mt-1">Add a subscription or overlay to continue</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3 group">
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${item.itemType === 'subscription' ? 'bg-gradient-to-br from-[#34B8FF] to-[#1E88E5]' : 'bg-gradient-to-br from-purple-500 to-purple-700'}`}>
                <i className={`${item.itemType === 'subscription' ? 'ri-vip-crown-line' : 'ri-layout-top-2-line'} text-white text-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                {item.meta && <p className="text-xs text-gray-400">{item.meta}</p>}
              </div>
              <span className="font-black text-gray-900 text-sm">{fmt(item.price)}</span>
              <button onClick={() => onRemove(item.id)}
                className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100">
                <i className="ri-delete-bin-line text-red-400 text-xs" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4">
            {/* Subscription note */}
            {cart.some(i => i.itemType === 'addon') && !cart.some(i => i.itemType === 'subscription') && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <i className="ri-information-line flex-shrink-0 mt-0.5" />
                Add-on templates require an active subscription to use in the streaming dashboard.
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800">{fmt(sub)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>GST (18%)</span>
                <span className="font-semibold text-gray-800">{fmt(gstAmt)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-black text-gray-900">Total</span>
                <span className="font-black text-gray-900 text-lg">{fmt(total)}</span>
              </div>
            </div>

            <button onClick={onCheckout} disabled={paying}
              className="w-full h-14 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-black text-base rounded-2xl hover:shadow-xl hover:shadow-blue-200 disabled:opacity-60 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]">
              {paying
                ? <><i className="ri-loader-4-line animate-spin text-xl" />Processing…</>
                : <><i className="ri-secure-payment-line text-xl" />Pay {fmt(total)} via Razorpay</>}
            </button>
            <p className="text-center text-[11px] text-gray-300">
              <i className="ri-lock-line mr-1" />Secured by Razorpay · 256-bit SSL
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTION PLAN CARD
// ═══════════════════════════════════════════════════════════

function PlanCard({ plan, inCart, onToggle }: {
  plan: SubscriptionPlan; inCart: boolean; onToggle: () => void;
}) {
  const savings = plan.originalPrice ? plan.originalPrice - plan.price : 0;

  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-3xl overflow-hidden border-2 transition-all duration-300 select-none
        ${inCart
          ? 'border-[#34B8FF] shadow-2xl shadow-blue-100 scale-[1.01]'
          : plan.highlight
            ? 'border-[#34B8FF]/40 shadow-xl hover:border-[#34B8FF] hover:shadow-2xl hover:shadow-blue-100'
            : 'border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md'
        }`}
    >
      {plan.highlight && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#34B8FF] via-purple-400 to-[#34B8FF]" />
      )}

      {/* Header gradient */}
      <div className={`px-7 pt-7 pb-6 relative overflow-hidden ${plan.highlight ? 'bg-gradient-to-br from-[#0f2744] to-[#1a3a6e]' : 'bg-gradient-to-br from-[#34B8FF] to-[#1E88E5]'}`}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative z-10">
          {plan.badge && (
            <span className="inline-block bg-white/20 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-4">
              {plan.badge}
            </span>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-white font-black text-2xl">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-white font-black text-4xl">{fmt(plan.price)}</span>
                <span className="text-white/60 text-sm">
                  {plan.cycle === 'monthly' ? '/month' : 'for 6 months'}
                </span>
              </div>
              {plan.perMonth && plan.cycle === 'sixmonth' && (
                <p className="text-white/50 text-xs mt-1">Just {fmt(plan.perMonth)}/month</p>
              )}
              {savings > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                  <i className="ri-price-tag-3-line" />Save {fmt(savings)}
                </div>
              )}
            </div>

            {/* Checkbox */}
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
              ${inCart ? 'bg-white border-white shadow-lg' : 'bg-white/15 border-white/40'}`}>
              {inCart
                ? <i className="ri-check-line text-[#1E88E5] font-black text-lg" />
                : <i className="ri-add-line text-white text-lg" />}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white px-7 py-6 space-y-5">
        {/* Dashboard access */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Streaming Dashboard</p>
          <ul className="space-y-2">
            {plan.includedFeatures.map((f, i) => <Check key={i} text={f} />)}
          </ul>
        </div>

        <div className="border-t border-gray-50" />

        {/* Included overlays */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Included Banners & Overlays</p>
          <ul className="space-y-2">
            {plan.dashboardFeatures.map((f, i) => <Check key={i} text={f} />)}
          </ul>
        </div>

        <div className="border-t border-gray-50" />

        {/* Overlay details */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Overlay Details</p>
          <ul className="space-y-2">
            {plan.overlayFeatures.map((f, i) => <Check key={i} text={f} />)}
          </ul>
        </div>

        <div className={`w-full py-3 rounded-2xl text-sm font-black text-center transition-all duration-200
          ${inCart
            ? 'bg-[#34B8FF]/10 text-[#1E88E5] border-2 border-[#34B8FF]/30'
            : plan.highlight
              ? 'bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white shadow-md shadow-blue-200'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100'
          }`}>
          {inCart ? '✓ Added to cart' : plan.highlight ? '⚡ Get Best Value' : 'Add to Cart'}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADD-ON TEMPLATE CARD
// ═══════════════════════════════════════════════════════════

function AddOnCard({ tpl, inCart, onToggle }: {
  tpl: AddOnTemplate; inCart: boolean; onToggle: () => void;
}) {
  const tierStyle = tpl.tier === 'elite'
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <div
      onClick={onToggle}
      className={`relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-300 select-none
        ${inCart
          ? 'border-[#34B8FF] shadow-xl shadow-blue-100 scale-[1.02]'
          : 'border-gray-100 hover:border-blue-200 hover:shadow-lg hover:scale-[1.01]'
        }`}
    >
      {/* Preview strip */}
      <div className="h-28 relative" style={{ background: tpl.previewGradient }}>
        {/* OBS label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-black/25 backdrop-blur-sm text-white text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
            OBS Overlay
          </span>
        </div>
        {tpl.popular && (
          <div className="absolute top-2.5 left-2.5 bg-amber-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
            🔥 Popular
          </div>
        )}
        {/* Checkbox */}
        <div className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200
          ${inCart ? 'bg-white border-white shadow-lg' : 'bg-black/20 border-white/60 backdrop-blur-sm'}`}>
          {inCart
            ? <i className="ri-check-line text-[#34B8FF] font-black text-sm" />
            : <i className="ri-add-line text-white text-sm" />}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-black text-gray-900 text-sm">{tpl.name}</p>
            <span className={`text-[9px] font-black border px-2 py-0.5 rounded-full inline-block mt-1 ${tierStyle}`}>
              {tpl.tier.toUpperCase()}
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-black text-gray-900 text-base">{fmt(tpl.price)}</p>
            <p className="text-[10px] text-gray-400">per match</p>
          </div>
        </div>

        <ul className="space-y-1 mb-3">
          {tpl.features.slice(0, 3).map((f, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <i className="ri-check-line text-[#34B8FF] flex-shrink-0" />{f}
            </li>
          ))}
          {tpl.features.length > 3 && (
            <li className="text-[11px] text-blue-400 font-semibold">+{tpl.features.length - 3} more</li>
          )}
        </ul>

        <div className={`w-full py-2 rounded-xl text-xs font-black text-center transition-all
          ${inCart
            ? 'bg-[#34B8FF]/10 text-[#1E88E5] border border-[#34B8FF]/30'
            : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-100'
          }`}>
          {inCart ? '✓ Added to cart' : '+ Add to cart'}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUCCESS SCREEN
// ═══════════════════════════════════════════════════════════

function SuccessScreen({ transactionId, items, totalPaid, onDone }: {
  transactionId: string; items: CartItem[]; totalPaid: number; onDone: () => void;
}) {
  const subtotal = cartTotal(items);
  return (
    <div className="max-w-lg mx-auto text-center py-12 px-4">
      <div className="relative w-28 h-28 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full bg-emerald-400" style={{ animation: 'ping .8s ease 1' }} />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-green-200">
          <i className="ri-check-line text-5xl text-white" />
        </div>
      </div>
      <h2 className="text-4xl font-black text-gray-900 mb-2">All set! 🎉</h2>
      <p className="text-gray-500 mb-10">Your plan is active. Head to the streaming dashboard to go live.</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl text-left overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] px-6 py-4 flex items-center justify-between">
          <p className="text-white font-black text-lg">Receipt</p>
          <i className="ri-receipt-line text-white/70 text-xl" />
        </div>
        <div className="px-6 py-4 divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="flex justify-between py-2.5 text-sm">
              <span className="text-gray-600">{item.name}</span>
              <span className="font-semibold text-gray-900">{fmt(item.price)}</span>
            </div>
          ))}
          <div className="flex justify-between py-2.5 text-sm">
            <span className="text-gray-500">GST (18%)</span>
            <span className="font-semibold text-gray-900">{fmt(Math.round(subtotal * GST))}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="font-black text-gray-900">Total Paid</span>
            <span className="font-black text-gray-900 text-base">{fmt(totalPaid)}</span>
          </div>
          <div className="flex justify-between py-2.5 text-xs">
            <span className="text-gray-400">Transaction ID</span>
            <span className="font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{transactionId}</span>
          </div>
          <div className="flex justify-between py-2.5 text-sm">
            <span className="text-gray-500">Status</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold"><i className="ri-checkbox-circle-fill" />Confirmed</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onDone} className="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
          Back to Plans
        </button>
        <Link href="/dashboard" className="flex-1 h-12 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2">
          <i className="ri-live-line" />Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function PricingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<PageStep>('plans');
  const [paying, setPaying] = useState(false);
  const [successData, setSuccessData] = useState<{ transactionId: string; items: CartItem[]; totalPaid: number } | null>(null);
  const [tierFilter, setTierFilter] = useState<'all' | 'pro' | 'elite'>('all');

  const isInCart = (id: string) => cart.some(c => c.id === id);
  const sub = cartTotal(cart);
  const total = addGst(sub);

  const togglePlan = (plan: SubscriptionPlan) => {
    // Only one subscription at a time
    if (isInCart(plan.id)) {
      setCart(prev => prev.filter(c => c.id !== plan.id));
    } else {
      setCart(prev => [
        ...prev.filter(c => c.itemType !== 'subscription'),
        { id: plan.id, name: `${plan.name} Subscription`, price: plan.price, itemType: 'subscription', meta: plan.cycle === 'monthly' ? '₹499/month' : '6-month bundle' },
      ]);
    }
  };

  const toggleAddon = (tpl: AddOnTemplate) => {
    setCart(prev => isInCart(tpl.id)
      ? prev.filter(c => c.id !== tpl.id)
      : [...prev, { id: tpl.id, name: tpl.name, price: tpl.price, itemType: 'addon', meta: `${tpl.tier.toUpperCase()} · Per match` }]
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setPaying(true);
    try {
      const order = await createRazorpayOrder(total, cart);
      const loaded = await loadRazorpay();
      if (!loaded) { alert('Could not load Razorpay. Please try again.'); setPaying(false); return; }

      new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER',
        amount: total * 100,
        currency: 'INR',
        name: 'Cricshub',
        description: `${cart.length} item${cart.length > 1 ? 's' : ''}`,
        order_id: order.orderId,
        image: '/images/iconLogo.png',
        theme: { color: '#34B8FF' },
        handler: async (response: any) => {
          setCartOpen(false);
          setStep('processing');
          const result = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            items: cart,
          });
          if (result.success) {
            setSuccessData({ transactionId: result.transactionId, items: [...cart], totalPaid: total });
            setCart([]);
            setStep('success');
          } else {
            alert('Payment verification failed. Please contact support.');
            setStep('plans');
          }
          setPaying(false);
        },
        modal: { ondismiss: () => setPaying(false) },
      }).open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  const filteredAddons = tierFilter === 'all' ? ADDON_TEMPLATES : ADDON_TEMPLATES.filter(t => t.tier === tierFilter);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer cart={cart} onRemove={id => setCart(prev => prev.filter(c => c.id !== id))}
          onClose={() => setCartOpen(false)} onCheckout={handleCheckout} paying={paying} />
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/iconLogo.png" alt="Cricshub" width={34} height={34} className="rounded-lg" />
            <Image src="/images/textLogo.png" alt="Cricshub" width={88} height={26} className="object-contain hidden sm:block" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors hidden sm:block">
              Dashboard
            </Link>
            {cart.length > 0 && (
              <button onClick={() => setCartOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-sm font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all">
                <i className="ri-shopping-cart-2-line" />
                Cart
                <span className="bg-white text-[#1E88E5] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">{cart.length}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-6xl">

        {/* Processing */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-40 gap-5">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-2xl shadow-blue-200 animate-pulse">
              <i className="ri-loader-4-line text-4xl text-white animate-spin" />
            </div>
            <p className="text-xl font-black text-gray-700">Verifying payment…</p>
            <p className="text-sm text-gray-400">Please don't close this tab</p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && successData && (
          <SuccessScreen {...successData} onDone={() => { setStep('plans'); setSuccessData(null); }} />
        )}

        {/* Plans */}
        {step === 'plans' && (
          <div className="space-y-16">

            {/* Hero */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#1E88E5] text-xs font-black px-4 py-2 rounded-full mb-5 uppercase tracking-widest">
                <i className="ri-live-line text-red-500 animate-pulse" />Streaming Plans
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                Professional cricket streaming.<br />
                <span className="bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] bg-clip-text text-transparent">Built for operators.</span>
              </h1>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Subscribe to unlock the web streaming dashboard with live OBS overlays. Add premium overlay templates per match for elite productions.
              </p>
            </div>

            {/* ── WHAT YOU GET WITHOUT A SUBSCRIPTION ── */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-7">
              <div className="flex items-start gap-5 flex-wrap md:flex-nowrap">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-smartphone-line text-gray-400 text-2xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-black text-gray-900 text-lg">Without Subscription</h3>
                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">Mobile App Only</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    You can already stream matches and update scores using the Cricshub mobile app — no subscription needed. The web streaming dashboard and OBS overlays are premium additions on top of what you already have.
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0 text-sm text-gray-400">
                  {['Score updates via mobile', 'Match management', 'Player stats tracking'].map((f, i) => (
                    <div key={i} className="flex items-center gap-2"><i className="ri-check-line text-gray-300" />{f}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SUBSCRIPTION PLANS ── */}
            <div>
              <SectionLabel
                icon="ri-vip-crown-line"
                label="Streaming Dashboard Subscription"
                sub="Unlocks the web dashboard, OBS browser source, and all basic banners & overlays"
              />
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
                {SUBSCRIPTION_PLANS.map(plan => (
                  <PlanCard key={plan.id} plan={plan} inCart={isInCart(plan.id)} onToggle={() => togglePlan(plan)} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 flex items-center gap-1.5">
                <i className="ri-information-line" />
                Only one subscription can be active at a time. Selecting a new plan replaces the current one in your cart.
              </p>
            </div>

            {/* ── ADDON TEMPLATES ── */}
            <div>
              <SectionLabel
                icon="ri-layout-top-2-line"
                label="Premium Overlay Add-ons"
                sub="Per-match upgrades — buy for a specific match, activate from the streaming dashboard"
              />

              {/* Note box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3 mb-6">
                <i className="ri-information-line text-amber-500 text-xl flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-bold mb-0.5">Add-ons require an active subscription</p>
                  <p className="text-amber-600">Premium templates are activated from the streaming dashboard on a per-match basis. A Monthly or 6-Month subscription must be active to use them.</p>
                </div>
              </div>

              {/* Tier filter */}
              <div className="flex items-center gap-2 mb-6">
                {([
                  { key: 'all', label: 'All Templates' },
                  { key: 'pro', label: '⚡ Pro' },
                  { key: 'elite', label: '💎 Elite' },
                ] as const).map(f => (
                  <button key={f.key} onClick={() => setTierFilter(f.key)}
                    className={`px-4 py-2 rounded-full text-xs font-black border transition-all ${tierFilter === f.key
                      ? 'bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white border-transparent shadow-md'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600'
                      }`}>
                    {f.label}
                  </button>
                ))}
                <span className="text-xs text-gray-400 ml-2">{filteredAddons.length} template{filteredAddons.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                {filteredAddons.map(tpl => (
                  <AddOnCard key={tpl.id} tpl={tpl} inCart={isInCart(tpl.id)} onToggle={() => toggleAddon(tpl)} />
                ))}
              </div>
            </div>

            {/* ── COMPARISON TABLE ── */}
            <div>
              <SectionLabel icon="ri-table-line" label="What's Included" sub="Feature breakdown across tiers" />
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="grid grid-cols-4 text-sm">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100 font-black text-gray-400 text-xs uppercase tracking-widest">Feature</div>
                  {[
                    { label: 'No Sub', sub: 'Mobile only', accent: false },
                    { label: 'Monthly', sub: '₹499/mo', accent: true },
                    { label: 'Add-ons', sub: 'Per match', accent: false },
                  ].map((col, i) => (
                    <div key={i} className={`px-4 py-4 border-b border-gray-100 text-center ${col.accent ? 'bg-blue-50' : ''}`}>
                      <p className={`font-black text-sm ${col.accent ? 'text-[#1E88E5]' : 'text-gray-700'}`}>{col.label}</p>
                      <p className="text-xs text-gray-400">{col.sub}</p>
                    </div>
                  ))}

                  {/* Rows */}
                  {[
                    { feature: 'Mobile score updates', vals: [true, true, true] },
                    { feature: 'Web streaming dashboard', vals: [false, true, true] },
                    { feature: 'OBS browser source URL', vals: [false, true, true] },
                    { feature: 'Stream lock & handover', vals: [false, true, true] },
                    { feature: 'Main match banner', vals: [false, true, true] },
                    { feature: 'Playing XI banner', vals: [false, true, true] },
                    { feature: 'Live score overlay', vals: [false, true, true] },
                    { feature: 'Premium overlay designs', vals: [false, false, true] },
                    { feature: 'Wagon wheel display', vals: [false, false, true] },
                    { feature: 'Custom branding', vals: [false, false, true] },
                    { feature: 'Watermark-free (Elite)', vals: [false, false, true] },
                  ].map((row, ri) => (
                    <>
                      <div key={`f${ri}`} className={`px-6 py-3.5 text-gray-600 text-sm border-b border-gray-50 ${ri % 2 === 0 ? 'bg-gray-50/30' : ''}`}>{row.feature}</div>
                      {row.vals.map((v, vi) => (
                        <div key={`v${ri}${vi}`} className={`px-4 py-3.5 text-center border-b border-gray-50 ${vi === 1 ? 'bg-blue-50' : ''} ${ri % 2 === 0 ? vi !== 1 ? 'bg-gray-50/30' : '' : ''}`}>
                          {v
                            ? <i className="ri-check-circle-fill text-[#34B8FF] text-lg" />
                            : <i className="ri-close-circle-line text-gray-200 text-lg" />
                          }
                        </div>
                      ))}
                    </>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Sticky bottom cart bar */}
      {step === 'plans' && cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl">
          <div className="container mx-auto px-6 py-3.5 flex items-center justify-between max-w-6xl gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex -space-x-2">
                {cart.slice(0, 3).map(item => (
                  <div key={item.id} className={`w-9 h-9 rounded-xl border-2 border-white flex-shrink-0 flex items-center justify-center ${item.itemType === 'subscription' ? 'bg-gradient-to-br from-[#34B8FF] to-[#1E88E5]' : 'bg-gradient-to-br from-purple-500 to-purple-700'}`}>
                    <i className={`${item.itemType === 'subscription' ? 'ri-vip-crown-line' : 'ri-layout-top-2-line'} text-white text-xs`} />
                  </div>
                ))}
                {cart.length > 3 && (
                  <div className="w-9 h-9 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500 flex-shrink-0">
                    +{cart.length - 3}
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-gray-400">{cart.length} item{cart.length > 1 ? 's' : ''}</p>
                <p className="font-black text-gray-900 text-sm">{fmt(total)} <span className="text-gray-400 font-normal text-xs">incl. GST</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="sm:hidden text-right">
                <p className="font-black text-gray-900 text-sm">{fmt(total)}</p>
                <p className="text-[10px] text-gray-400">incl. GST</p>
              </div>
              <button onClick={() => setCartOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-black px-7 py-3.5 rounded-xl hover:shadow-xl hover:shadow-blue-200 transition-all hover:scale-105 active:scale-95">
                <i className="ri-shopping-cart-2-line text-lg" />
                View Cart & Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && step === 'plans' && <div className="h-24" />}

      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes ping {
          0%   { transform: scale(1); opacity: .8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}