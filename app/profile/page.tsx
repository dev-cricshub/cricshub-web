'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface UserProfile {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    createdAt: string;
    avatarInitials?: string;
}

type SubscriptionStatus = 'active' | 'expired' | 'none';
type BillingCycle = 'monthly' | 'sixmonth';

interface Subscription {
    id: string;
    planName: string;
    cycle: BillingCycle;
    status: SubscriptionStatus;
    startDate: string;
    expiryDate: string;
    autoRenew: boolean;
    price: number;
    daysRemaining: number;
}

interface OwnedTemplate {
    id: string;
    name: string;
    tier: 'pro' | 'elite';
    previewGradient: string;
    purchasedAt: string;
    expiryDate: string | null; // null = lifetime
    usedInMatches: number;
    isExpired: boolean;
}

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'success' | 'failed' | 'refunded';
    invoiceId: string;
}

// ═══════════════════════════════════════════════════════════
// PLACEHOLDER API CALLS
// ═══════════════════════════════════════════════════════════

async function fetchUserProfile(userId: string): Promise<UserProfile> {
    // TODO: GET /api/v1/users/{userId}
    await new Promise(r => setTimeout(r, 500));
    return {
        id: userId,
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        email: 'rahul.sharma@example.com',
        createdAt: '2024-11-15',
        avatarInitials: 'RS',
    };
}

async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<{ success: boolean }> {
    // TODO: PUT /api/v1/users/{userId}
    console.log('[PLACEHOLDER] updateUserProfile', { userId, data });
    await new Promise(r => setTimeout(r, 800));
    return { success: true };
}

async function fetchSubscription(userId: string): Promise<Subscription | null> {
    // TODO: GET /api/v1/subscriptions/user/{userId}
    await new Promise(r => setTimeout(r, 400));
    return null
}

async function fetchOwnedTemplates(userId: string): Promise<OwnedTemplate[]> {
    // TODO: GET /api/v1/users/{userId}/templates
    await new Promise(r => setTimeout(r, 400));
    return [
        {
            id: 'tpl-neon',
            name: 'Neon Arena',
            tier: 'pro',
            previewGradient: 'linear-gradient(135deg,#00F5A0,#00D9F5)',
            purchasedAt: '2025-12-10',
            expiryDate: null,
            usedInMatches: 7,
            isExpired: false,
        },
        {
            id: 'tpl-diamond',
            name: 'Diamond Premium',
            tier: 'elite',
            previewGradient: 'linear-gradient(135deg,#8E54E9,#4776E6)',
            purchasedAt: '2026-01-05',
            expiryDate: null,
            usedInMatches: 3,
            isExpired: false,
        },
        {
            id: 'tpl-amber',
            name: 'Amber League',
            tier: 'pro',
            previewGradient: 'linear-gradient(135deg,#F7971E,#FFD200)',
            purchasedAt: '2025-11-20',
            expiryDate: '2026-02-20',
            usedInMatches: 12,
            isExpired: true,
        },
    ];
}

async function fetchTransactions(userId: string): Promise<Transaction[]> {
    // TODO: GET /api/v1/payments/user/{userId}/history
    await new Promise(r => setTimeout(r, 400));
    return [
        {
            id: 'txn-001',
            date: '2025-11-01',
            description: '6-Month Bundle Subscription',
            amount: 2949,
            status: 'success',
            invoiceId: 'INV-2025-1101',
        },
        {
            id: 'txn-002',
            date: '2025-12-10',
            description: 'Neon Arena Overlay — Per Match',
            amount: 117,
            status: 'success',
            invoiceId: 'INV-2025-1210',
        },
        {
            id: 'txn-003',
            date: '2026-01-05',
            description: 'Diamond Premium Overlay — Per Match',
            amount: 235,
            status: 'success',
            invoiceId: 'INV-2026-0105',
        },
        {
            id: 'txn-004',
            date: '2026-01-18',
            description: 'Crimson Grand Overlay — Per Match',
            amount: 294,
            status: 'failed',
            invoiceId: 'INV-2026-0118',
        },
    ];
}

async function toggleAutoRenew(userId: string, value: boolean): Promise<{ success: boolean }> {
    // TODO: PATCH /api/v1/subscriptions/user/{userId}/auto-renew  body: { autoRenew: value }
    console.log('[PLACEHOLDER] toggleAutoRenew', { userId, value });
    await new Promise(r => setTimeout(r, 400));
    return { success: true };
}

async function cancelSubscription(userId: string): Promise<{ success: boolean }> {
    // TODO: POST /api/v1/subscriptions/user/{userId}/cancel
    console.log('[PLACEHOLDER] cancelSubscription', { userId });
    await new Promise(r => setTimeout(r, 600));
    return { success: true };
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

function daysRemaining(dateStr: string): number {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ═══════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════

function SectionHeader({ icon, title, sub, action }: { icon: string; title: string; sub?: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-md shadow-blue-200">
                    <i className={`${icon} text-white text-base`} />
                </div>
                <div>
                    <h2 className="font-black text-gray-900 text-lg leading-none">{title}</h2>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
            </div>
            {action}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTION STATUS BADGE
// ═══════════════════════════════════════════════════════════

function SubBadge({ status }: { status: SubscriptionStatus }) {
    if (status === 'active') return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />Active
        </span>
    );
    if (status === 'expired') return (
        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-black px-3 py-1 rounded-full">
            <i className="ri-close-circle-line" />Expired
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">
            <i className="ri-minus-circle-line" />No Plan
        </span>
    );
}

// ═══════════════════════════════════════════════════════════
// CONFIRM MODAL
// ═══════════════════════════════════════════════════════════

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }: {
    title: string; message: string; confirmLabel: string; danger?: boolean;
    onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 pointer-events-auto" onClick={e => e.stopPropagation()}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
                        <i className={`${danger ? 'ri-alert-line text-red-500' : 'ri-information-line text-[#34B8FF]'} text-2xl`} />
                    </div>
                    <h3 className="font-black text-gray-900 text-lg text-center mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">{message}</p>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                        <button onClick={onConfirm} disabled={loading}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2
                ${danger ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-200' : 'bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] hover:shadow-lg hover:shadow-blue-200'}`}>
                            {loading ? <><i className="ri-loader-4-line animate-spin" />Processing…</> : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════

function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold
      ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            <i className={type === 'success' ? 'ri-checkbox-circle-fill text-lg' : 'ri-close-circle-fill text-lg'} />
            {message}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function ProfilePage() {
    // Placeholder: replace with real auth context
    const currentUserId = (typeof window !== 'undefined' ? localStorage.getItem('userUUID') : null) ?? 'mock-uuid';

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [templates, setTemplates] = useState<OwnedTemplate[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit profile state
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Subscription actions
    const [autoRenewBusy, setAutoRenewBusy] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelBusy, setCancelBusy] = useState(false);

    // UI
    const [activeTab, setActiveTab] = useState<'overview' | 'overlays' | 'billing'>('overview');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showAllTx, setShowAllTx] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

    useEffect(() => {
        Promise.all([
            fetchUserProfile(currentUserId),
            fetchSubscription(currentUserId),
            fetchOwnedTemplates(currentUserId),
            fetchTransactions(currentUserId),
        ]).then(([p, s, t, tx]) => {
            setProfile(p); setSubscription(s); setTemplates(t); setTransactions(tx);
            setEditName(p.name); setEditEmail(p.email ?? '');
            setLoading(false);
        });
    }, []);

    const handleSaveProfile = async () => {
        if (!profile) return;
        setSavingProfile(true);
        const res = await updateUserProfile(currentUserId, { name: editName, email: editEmail || null });
        if (res.success) {
            setProfile(p => p ? { ...p, name: editName, email: editEmail || null } : p);
            setEditMode(false);
            showToast('Profile updated successfully');
        } else {
            showToast('Failed to update profile', 'error');
        }
        setSavingProfile(false);
    };

    const handleToggleAutoRenew = async () => {
        if (!subscription) return;
        setAutoRenewBusy(true);
        const next = !subscription.autoRenew;
        const res = await toggleAutoRenew(currentUserId, next);
        if (res.success) {
            setSubscription(s => s ? { ...s, autoRenew: next } : s);
            showToast(next ? 'Auto-renew enabled' : 'Auto-renew disabled');
        }
        setAutoRenewBusy(false);
    };

    const handleCancelSubscription = async () => {
        setCancelBusy(true);
        const res = await cancelSubscription(currentUserId);
        if (res.success) {
            setSubscription(s => s ? { ...s, autoRenew: false, status: 'expired' } : s);
            setShowCancelConfirm(false);
            showToast('Subscription cancelled. Access continues until expiry.');
        } else {
            showToast('Cancellation failed. Please try again.', 'error');
        }
        setCancelBusy(false);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-xl animate-pulse">
                    <i className="ri-user-line text-white text-3xl" />
                </div>
                <p className="font-semibold text-gray-500">Loading your profile…</p>
            </div>
        </div>
    );

    const activeTemplates = templates.filter(t => !t.isExpired);
    const expiredTemplates = templates.filter(t => t.isExpired);
    const displayedTx = showAllTx ? transactions : transactions.slice(0, 3);

    const subProgress = subscription
        ? Math.max(0, Math.min(100, (subscription.daysRemaining / (subscription.cycle === 'monthly' ? 30 : 180)) * 100))
        : 0;

    return (
        <div className="min-h-screen bg-[#F8F9FA]">

            {/* Modals / overlays */}
            {showCancelConfirm && (
                <ConfirmModal
                    title="Cancel Subscription?"
                    message="Your access will continue until the expiry date. You won't be billed again. This action cannot be undone."
                    confirmLabel="Yes, Cancel"
                    danger
                    loading={cancelBusy}
                    onConfirm={handleCancelSubscription}
                    onCancel={() => setShowCancelConfirm(false)}
                />
            )}
            {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 font-semibold transition-colors">
                            <i className="ri-arrow-left-line" />Dashboard
                        </Link>
                        <span className="text-gray-200 hidden sm:block">|</span>
                        <div className="hidden sm:flex items-center gap-2">
                            <Image src="/images/iconLogo.png" alt="Cricshub" width={26} height={26} className="rounded-md" />
                            <span className="font-black text-gray-900 text-sm">My Profile</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {subscription && <SubBadge status={subscription.status} />}
                        <button
                            onClick={() => console.log('[PLACEHOLDER] Logout')}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Logout"
                        >
                            <i className="ri-logout-circle-line text-xl" />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">

                {/* ── PROFILE HERO ── */}
                <div className="relative bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] rounded-3xl overflow-hidden shadow-xl shadow-blue-200">
                    {/* Decorative blobs */}
                    <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
                    <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10" />
                    <div className="relative z-10 px-8 py-8 flex items-center gap-6 flex-wrap">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                                {profile ? initials(profile.name) : '??'}
                            </div>
                            {subscription?.status === 'active' && (
                                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-md">
                                    <i className="ri-vip-crown-fill text-white text-xs" />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            {editMode ? (
                                <div className="space-y-2 max-w-sm">
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        placeholder="Full name"
                                        className="w-full px-3 py-2 rounded-xl bg-white/20 border border-white/40 text-white placeholder:text-white/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                    <input
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                        placeholder="Email (optional)"
                                        className="w-full px-3 py-2 rounded-xl bg-white/20 border border-white/40 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={savingProfile}
                                            className="flex items-center gap-1.5 bg-white text-[#1E88E5] font-black text-xs px-4 py-2 rounded-xl hover:bg-white/90 transition-all disabled:opacity-60"
                                        >
                                            {savingProfile ? <><i className="ri-loader-4-line animate-spin" />Saving…</> : <><i className="ri-check-line" />Save</>}
                                        </button>
                                        <button
                                            onClick={() => { setEditMode(false); setEditName(profile?.name ?? ''); setEditEmail(profile?.email ?? ''); }}
                                            className="flex items-center gap-1 bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-white/30 transition-all"
                                        >
                                            <i className="ri-close-line" />Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-black text-white mb-0.5">{profile?.name}</h1>
                                    <div className="flex items-center gap-3 text-white/70 text-sm flex-wrap">
                                        <span className="flex items-center gap-1"><i className="ri-phone-line" />{profile?.phone}</span>
                                        {profile?.email && <span className="flex items-center gap-1"><i className="ri-mail-line" />{profile.email}</span>}
                                        <span className="flex items-center gap-1"><i className="ri-calendar-line" />Member since {fmtDate(profile?.createdAt ?? '')}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Edit button */}
                        {!editMode && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex-shrink-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all"
                            >
                                <i className="ri-edit-line" />Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* ── QUICK STATS ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: 'ri-vip-crown-line', label: 'Plan', value: subscription?.planName ?? 'None', gradient: 'from-amber-400 to-amber-500' },
                        { icon: 'ri-calendar-check-line', label: 'Days Left', value: subscription?.status === 'active' ? `${subscription.daysRemaining}d` : '—', gradient: 'from-[#34B8FF] to-[#1E88E5]' },
                        { icon: 'ri-layout-top-2-line', label: 'Overlays Owned', value: activeTemplates.length, gradient: 'from-purple-400 to-purple-600' },
                        { icon: 'ri-receipt-line', label: 'Transactions', value: transactions.length, gradient: 'from-emerald-400 to-emerald-600' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                <i className={`${s.icon} text-white text-lg`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-black text-gray-900 truncate">{s.value}</p>
                                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── TABS ── */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-100 shadow-sm p-1.5 rounded-2xl w-fit">
                    {[
                        { key: 'overview', icon: 'ri-home-4-line', label: 'Subscription' },
                        { key: 'overlays', icon: 'ri-layout-top-2-line', label: 'My Overlays' },
                        { key: 'billing', icon: 'ri-receipt-line', label: 'Billing History' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                ${activeTab === tab.key ? 'bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            <i className={`${tab.icon} text-base`} />{tab.label}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════════ */}
                {/* TAB: SUBSCRIPTION OVERVIEW */}
                {/* ══════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">

                        {subscription && subscription.status !== 'none' ? (
                            <>
                                {/* Main subscription card */}
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Coloured header */}
                                    <div className={`px-7 pt-7 pb-6 relative overflow-hidden ${subscription.status === 'active' ? 'bg-gradient-to-br from-[#0f2744] to-[#1a3a6e]' : 'bg-gradient-to-br from-gray-700 to-gray-900'}`}>
                                        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
                                        <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <SubBadge status={subscription.status} />
                                                        {subscription.autoRenew && subscription.status === 'active' && (
                                                            <span className="text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-full">
                                                                Auto-renew ON
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-white font-black text-2xl">{subscription.planName}</h3>
                                                    <p className="text-white/60 text-sm mt-1">
                                                        {subscription.cycle === 'monthly' ? '₹499/month' : '₹2,499 for 6 months'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Expires</p>
                                                    <p className="text-white font-black text-lg">{fmtDate(subscription.expiryDate)}</p>
                                                    <p className="text-white/60 text-xs mt-0.5">{subscription.daysRemaining} days remaining</p>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-5">
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
                                                <p className="text-white/40 text-[10px] mt-1 text-right">{Math.round(100 - subProgress)}% elapsed</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions row */}
                                    <div className="px-7 py-5 flex items-center justify-between gap-4 flex-wrap border-b border-gray-50">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <Link href="/pricing"
                                                className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all">
                                                <i className="ri-arrow-up-circle-line" />
                                                {subscription.cycle === 'monthly' ? 'Upgrade to 6-Month' : 'Renew Plan'}
                                            </Link>
                                            <Link href="/pricing"
                                                className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-all">
                                                <i className="ri-exchange-line" />Change Plan
                                            </Link>
                                        </div>
                                        {subscription.status === 'active' && (
                                            <button
                                                onClick={() => setShowCancelConfirm(true)}
                                                className="text-sm text-gray-400 hover:text-red-500 font-semibold transition-colors flex items-center gap-1.5"
                                            >
                                                <i className="ri-close-circle-line" />Cancel subscription
                                            </button>
                                        )}
                                    </div>

                                    {/* Auto-renew toggle */}
                                    <div className="px-7 py-5 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">Auto-Renew</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {subscription.autoRenew
                                                    ? `Your plan renews automatically on ${fmtDate(subscription.expiryDate)}`
                                                    : 'Your plan will not renew automatically. You will need to subscribe again after expiry.'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleToggleAutoRenew}
                                            disabled={autoRenewBusy || subscription.status !== 'active'}
                                            className={`relative w-14 h-7 rounded-full transition-all duration-300 disabled:opacity-50 flex-shrink-0
                        ${subscription.autoRenew ? 'bg-gradient-to-r from-[#34B8FF] to-[#1E88E5]' : 'bg-gray-200'}`}
                                        >
                                            <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300
                        ${subscription.autoRenew ? 'left-7.5 translate-x-0.5' : 'left-0.5'}`}
                                                style={{ left: subscription.autoRenew ? '28px' : '2px' }}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* What's included */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <SectionHeader icon="ri-gift-line" title="What's Included in Your Plan" />
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {[
                                            { icon: 'ri-broadcast-line', text: 'Web streaming dashboard access' },
                                            { icon: 'ri-code-s-slash-line', text: 'OBS browser source URL generation' },
                                            { icon: 'ri-lock-unlock-line', text: 'Stream lock & operator handover' },
                                            { icon: 'ri-refresh-line', text: 'Real-time score sync (auto)' },
                                            { icon: 'ri-layout-top-2-line', text: 'Live score overlay (always-on)' },
                                            { icon: 'ri-flag-line', text: 'Main match banner & Playing XI banners' },
                                            ...(subscription.cycle === 'sixmonth' ? [
                                                { icon: 'ri-customer-service-2-line', text: 'Priority support' },
                                                { icon: 'ri-star-line', text: 'Early access to new templates' },
                                            ] : []),
                                        ].map((f, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                                                <i className={`${f.icon} text-[#34B8FF] text-base flex-shrink-0`} />
                                                <p className="text-sm text-gray-700 font-medium">{f.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* No subscription */
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5">
                                    <i className="ri-vip-crown-line text-amber-500 text-3xl" />
                                </div>
                                <h3 className="font-black text-gray-900 text-xl mb-2">No Active Subscription</h3>
                                <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed mb-6">
                                    Subscribe to unlock the web streaming dashboard, OBS overlays, and all banner controls for your matches.
                                </p>
                                <Link href="/pricing"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white font-bold px-7 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all">
                                    <i className="ri-vip-crown-line" />View Plans
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════ */}
                {/* TAB: MY OVERLAYS */}
                {/* ══════════════════════════════════════════════════ */}
                {activeTab === 'overlays' && (
                    <div className="space-y-6">

                        {/* Subscription-included banners */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <SectionHeader
                                icon="ri-gift-line"
                                title="Included with Subscription"
                                sub="Available on every match while your plan is active"
                            />
                            {subscription?.status === 'active' ? (
                                <div className="grid md:grid-cols-3 gap-3">
                                    {[
                                        { icon: 'ri-layout-top-2-line', name: 'Main Match Banner', desc: 'Tournament, teams, venue, toss result', bg: 'linear-gradient(135deg,#34B8FF,#1E88E5)' },
                                        { icon: 'ri-group-line', name: 'Batting XI Banner', desc: 'Full batting lineup with stats', bg: 'linear-gradient(135deg,#00b4d8,#0077b6)' },
                                        { icon: 'ri-group-2-line', name: 'Bowling XI Banner', desc: 'Bowling lineup with economy rates', bg: 'linear-gradient(135deg,#8E54E9,#4776E6)' },
                                        { icon: 'ri-bar-chart-fill', name: 'Live Score Overlay', desc: 'Real-time bottom scoreboard for OBS', bg: 'linear-gradient(135deg,#11998e,#38ef7d)' },
                                    ].map((b, i) => (
                                        <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                                            <div className="h-16" style={{ background: b.bg }} />
                                            <div className="p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <i className={`${b.icon} text-[#34B8FF] text-sm`} />
                                                    <p className="font-bold text-gray-900 text-sm">{b.name}</p>
                                                </div>
                                                <p className="text-xs text-gray-400">{b.desc}</p>
                                                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                    <i className="ri-checkbox-circle-fill" />Included
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                                    <i className="ri-information-line text-amber-500 text-xl flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-amber-800 text-sm">Subscription required</p>
                                        <p className="text-xs text-amber-700 mt-0.5">These banners are locked. <Link href="/pricing" className="font-bold underline">Subscribe to unlock →</Link></p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Purchased add-on templates */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <SectionHeader
                                icon="ri-vip-crown-line"
                                title="Purchased Add-on Templates"
                                sub="Per-match premium overlay designs"
                                action={
                                    <Link href="/pricing"
                                        className="flex items-center gap-1.5 text-xs font-bold text-[#34B8FF] bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                                        <i className="ri-add-line" />Buy More
                                    </Link>
                                }
                            />

                            {templates.length === 0 ? (
                                <div className="text-center py-10">
                                    <i className="ri-layout-top-2-line text-gray-200 text-4xl block mb-3" />
                                    <p className="font-bold text-gray-400 text-sm">No add-on templates yet</p>
                                    <p className="text-xs text-gray-300 mt-1 mb-4">Enhance your productions with premium overlay designs</p>
                                    <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-bold text-[#34B8FF] hover:underline">
                                        Browse templates <i className="ri-arrow-right-line" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* Active templates */}
                                    {activeTemplates.length > 0 && (
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Active</p>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {activeTemplates.map(tpl => (
                                                    <div key={tpl.id} className="rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-md transition-all">
                                                        <div className="h-20 relative" style={{ background: tpl.previewGradient }}>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="bg-black/25 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">OBS Overlay</span>
                                                            </div>
                                                            <div className="absolute top-2 right-2">
                                                                <span className={`text-[9px] font-black border px-2 py-0.5 rounded-full ${tpl.tier === 'elite' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                                    {tpl.tier.toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-white">
                                                            <p className="font-bold text-gray-900 text-sm">{tpl.name}</p>
                                                            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                                                                <span className="flex items-center gap-1"><i className="ri-calendar-line" />Purchased {fmtDate(tpl.purchasedAt)}</span>
                                                                <span className="flex items-center gap-1 text-[#34B8FF] font-semibold">
                                                                    <i className="ri-broadcast-line" />{tpl.usedInMatches} matches
                                                                </span>
                                                            </div>
                                                            <div className="mt-2">
                                                                {tpl.expiryDate ? (
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${daysRemaining(tpl.expiryDate) < 7 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                                                        Expires {fmtDate(tpl.expiryDate)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                                        ✓ Lifetime access
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Expired templates */}
                                    {expiredTemplates.length > 0 && (
                                        <div>
                                            <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-3">Expired</p>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                                                {expiredTemplates.map(tpl => (
                                                    <div key={tpl.id} className="rounded-2xl border border-gray-100 overflow-hidden">
                                                        <div className="h-16 relative grayscale" style={{ background: tpl.previewGradient }} />
                                                        <div className="p-3 bg-white">
                                                            <div className="flex items-center justify-between">
                                                                <p className="font-bold text-gray-500 text-sm">{tpl.name}</p>
                                                                <span className="text-[9px] font-bold bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">Expired</span>
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-1">Used in {tpl.usedInMatches} matches</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════ */}
                {/* TAB: BILLING HISTORY */}
                {/* ══════════════════════════════════════════════════ */}
                {activeTab === 'billing' && (
                    <div className="space-y-5">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <SectionHeader
                                icon="ri-receipt-line"
                                title="Billing History"
                                sub="All payments and invoices"
                            />

                            {transactions.length === 0 ? (
                                <div className="text-center py-12 px-6">
                                    <i className="ri-receipt-line text-gray-200 text-4xl block mb-3" />
                                    <p className="font-bold text-gray-400 text-sm">No transactions yet</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto -mx-6 px-6">
                                        <table className="w-full min-w-[560px]">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Date</th>
                                                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Description</th>
                                                    <th className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Invoice</th>
                                                    <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Amount</th>
                                                    <th className="text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pb-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {displayedTx.map(tx => (
                                                    <tr key={tx.id} className="group hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-4 pr-4 text-sm text-gray-500 whitespace-nowrap">{fmtDate(tx.date)}</td>
                                                        <td className="py-4 pr-4 text-sm text-gray-900 font-medium">{tx.description}</td>
                                                        <td className="py-4 pr-4">
                                                            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{tx.invoiceId}</span>
                                                        </td>
                                                        <td className="py-4 pl-4 text-right text-sm font-black text-gray-900 whitespace-nowrap">{fmt(tx.amount)}</td>
                                                        <td className="py-4 pl-4 text-right">
                                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : tx.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-200'
                                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                }`}>
                                                                {tx.status === 'success' ? '✓ Paid' : tx.status === 'failed' ? '✗ Failed' : '↩ Refunded'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Total paid */}
                                    <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/50">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <i className="ri-information-line text-gray-400" />
                                            All amounts include 18% GST
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Total paid</p>
                                            <p className="font-black text-gray-900">
                                                {fmt(transactions.filter(t => t.status === 'success').reduce((s, t) => s + t.amount, 0))}
                                            </p>
                                        </div>
                                    </div>

                                    {transactions.length > 3 && (
                                        <div className="px-6 pb-4 pt-1 text-center">
                                            <button
                                                onClick={() => setShowAllTx(v => !v)}
                                                className="text-sm font-bold text-[#34B8FF] hover:underline flex items-center gap-1.5 mx-auto"
                                            >
                                                {showAllTx ? <><i className="ri-arrow-up-s-line" />Show less</> : <><i className="ri-arrow-down-s-line" />Show all {transactions.length} transactions</>}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Need help */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                    <i className="ri-customer-service-2-line text-[#34B8FF] text-lg" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Payment issue or refund request?</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Contact Cricshub support with your invoice ID for quick resolution.</p>
                                </div>
                            </div>
                            <a href="mailto:support@cricshub.com"
                                className="flex-shrink-0 flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                                <i className="ri-mail-line" />Contact Support
                            </a>
                        </div>
                    </div>
                )}

            </div>

            <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
        </div>
    );
}
