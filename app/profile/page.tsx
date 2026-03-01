'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchCurrentUserProfile, updateUserProfile, fetchMySubscription, fetchTransactionHistory } from '@/lib/api';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface UserProfile {
    id: string;
    name: string;
    phone: string;
    email: string | null;
}

type SubscriptionStatus = 'active' | 'expired' | 'none';

interface Subscription {
    id: string;
    planName: string;
    cycle: 'monthly' | 'sixmonth';
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
    status: 'SUCCESS' | 'FAILED' | 'REVERSED' | 'PENDING';
    invoiceId: string;
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtDate = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const initials = (n: string) => n ? n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

function calcDaysRemaining(dateStr: string): number {
    if (!dateStr) return 0;
    const remaining = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    return remaining > 0 ? remaining : 0;
}

// ═══════════════════════════════════════════════════════════
// COMPONENTS
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
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    const [activeTab, setActiveTab] = useState<'overview' | 'overlays' | 'billing'>('overview');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showAllTx, setShowAllTx] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

    useEffect(() => {
        const loadData = async () => {
            const currentUserId = localStorage.getItem('userUUID');
            if (!currentUserId) {
                window.location.href = '/';
                return;
            }

            try {
                // 1. Fetch Profile
                const userDto = await fetchCurrentUserProfile();
                const pData: UserProfile = {
                    id: userDto.id,
                    name: userDto.name,
                    phone: userDto.phone,
                    email: userDto.email !== 'default' ? userDto.email : null,
                };
                setProfile(pData);
                setEditName(pData.name);
                setEditEmail(pData.email ?? '');

                // 2. Fetch Subscription Status
                const subData = await fetchMySubscription(currentUserId);
                if (subData?.hasActiveSubscription) {
                    setSubscription({
                        id: 'sub',
                        planName: subData.plan === 'MONTHLY' ? 'Monthly Plan' : '6-Month Bundle',
                        cycle: subData.plan === 'MONTHLY' ? 'monthly' : 'sixmonth',
                        status: 'active',
                        startDate: subData.history[0]?.startDate || new Date().toISOString(),
                        expiryDate: subData.expiresAt,
                        daysRemaining: calcDaysRemaining(subData.expiresAt)
                    });
                } else {
                    setSubscription({ id: '', planName: 'None', cycle: 'monthly', status: 'none', startDate: '', expiryDate: '', daysRemaining: 0 });
                }

                // 3. Fetch Transactions
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
            const res = await updateUserProfile({ name: editName, email: editEmail || null });
            if (res.success) {
                setProfile(p => p ? { ...p, name: editName, email: editEmail || null } : p);
                localStorage.setItem('userName', editName); // Sync localstorage
                setEditMode(false);
                showToast('Profile updated successfully');
            } else {
                showToast(res.message || 'Failed to update profile', 'error');
            }
        } catch (err) {
            showToast('Network error while saving profile', 'error');
        }
        setSavingProfile(false);
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
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

    const displayedTx = showAllTx ? transactions : transactions.slice(0, 3);
    const subProgress = subscription && subscription.status === 'active'
        ? Math.max(0, Math.min(100, ((subscription.cycle === 'monthly' ? 30 : 180) - subscription.daysRemaining) / (subscription.cycle === 'monthly' ? 30 : 180) * 100))
        : 0;

    return (
        <div className="min-h-screen bg-[#F8F9FA]">

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
                            onClick={handleLogout}
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
                    <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
                    <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10" />
                    <div className="relative z-10 px-8 py-8 flex items-center gap-6 flex-wrap">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                                {profile ? initials(profile.name) : 'U'}
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
                                    </div>
                                </>
                            )}
                        </div>

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

                        {subscription && subscription.status === 'active' ? (
                            <>
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-7 pt-7 pb-6 relative overflow-hidden bg-gradient-to-br from-[#0f2744] to-[#1a3a6e]">
                                        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
                                        <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <SubBadge status={subscription.status} />
                                                    </div>
                                                    <h3 className="text-white font-black text-2xl">{subscription.planName}</h3>
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
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="px-7 py-5 flex items-center justify-between gap-4 flex-wrap border-b border-gray-50">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <Link href="/pricing"
                                                className="flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all">
                                                <i className="ri-arrow-up-circle-line" />
                                                Extend Plan
                                            </Link>
                                        </div>

                                        {/* COMMENTED OUT: Razorpay auto-renew/cancel toggles (kept for future use) */}
                                        {/* <button
                                            onClick={() => setShowCancelConfirm(true)}
                                            className="text-sm text-gray-400 hover:text-red-500 font-semibold transition-colors flex items-center gap-1.5"
                                        >
                                            <i className="ri-close-circle-line" />Cancel subscription
                                        </button> 
                                        */}
                                    </div>
                                </div>

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

                        {/* COMMENTED OUT: Per-Match Add-ons 
                        Since these are purchased per-match, they don't logically belong in a global "owned templates" tab.
                        Their purchase history is tracked in the Billing Tab.
                        */}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════ */}
                {/* TAB: BILLING HISTORY */}
                {/* ══════════════════════════════════════════════════ */}
                {activeTab === 'billing' && (
                    <div className="space-y-5">

                        {/* Summary Stats */}
                        {transactions.length > 0 && (
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    {
                                        icon: 'ri-money-rupee-circle-line',
                                        label: 'Total Spent',
                                        value: `₹${transactions.filter(t => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}`,
                                        color: 'from-[#34B8FF] to-[#1E88E5]',
                                        light: 'bg-blue-50 text-[#1E88E5]'
                                    },
                                    {
                                        icon: 'ri-checkbox-circle-line',
                                        label: 'Successful',
                                        value: transactions.filter(t => t.status === 'SUCCESS').length.toString(),
                                        color: 'from-emerald-400 to-emerald-600',
                                        light: 'bg-emerald-50 text-emerald-600'
                                    },
                                    {
                                        icon: 'ri-file-list-3-line',
                                        label: 'Total Transactions',
                                        value: transactions.length.toString(),
                                        color: 'from-violet-400 to-violet-600',
                                        light: 'bg-violet-50 text-violet-600'
                                    },
                                ].map((s, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.light}`}>
                                            <i className={`${s.icon} text-xl`} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
                                            <p className="text-xl font-black text-gray-900 leading-tight">{s.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Transactions */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 pt-6 pb-4 border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#34B8FF] to-[#1E88E5] flex items-center justify-center shadow-md shadow-blue-200">
                                        <i className="ri-receipt-line text-white text-base" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-gray-900 text-lg leading-none">Billing History</h2>
                                        <p className="text-xs text-gray-400 mt-0.5">All payments and invoices</p>
                                    </div>
                                </div>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="text-center py-16 px-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <i className="ri-receipt-line text-gray-300 text-2xl" />
                                    </div>
                                    <p className="font-black text-gray-400 text-base mb-1">No transactions yet</p>
                                    <p className="text-sm text-gray-300 mb-5">Your payment history will appear here</p>
                                    <Link href="/pricing"
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#34B8FF] to-[#1E88E5] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all">
                                        <i className="ri-vip-crown-line" />View Plans
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {displayedTx.map((tx, i) => {
                                        const isAddon = tx.description?.toLowerCase().includes('overlay') || tx.description?.toLowerCase().includes('addon');
                                        const isSub = tx.description?.toLowerCase().includes('plan') || tx.description?.toLowerCase().includes('subscription');
                                        return (
                                            <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">

                                                {/* Icon */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isAddon ? 'bg-amber-50' : isSub ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                                    <i className={`text-lg ${isAddon ? 'ri-vip-crown-line text-amber-500' : isSub ? 'ri-broadcast-line text-[#1E88E5]' : 'ri-money-rupee-circle-line text-gray-400'}`} />
                                                </div>

                                                {/* Description + date */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 text-sm truncate">{tx.description}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-gray-400">{fmtDate(tx.date)}</span>
                                                        <span className="text-gray-200">·</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAddon ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                            {isAddon ? 'Add-on' : 'Subscription'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Ref ID */}
                                                <div className="hidden sm:block flex-shrink-0">
                                                    <span className="text-[10px] font-mono text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                                                        {tx.invoiceId}
                                                    </span>
                                                </div>

                                                {/* Amount */}
                                                <div className="flex-shrink-0 text-right">
                                                    <p className="font-black text-gray-900 text-sm">₹{tx.amount.toLocaleString('en-IN')}</p>
                                                </div>

                                                {/* Status pill */}
                                                <div className="flex-shrink-0">
                                                    {tx.status === 'SUCCESS' ? (
                                                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-full">
                                                            <i className="ri-checkbox-circle-fill text-xs" />Paid
                                                        </span>
                                                    ) : tx.status === 'FAILED' ? (
                                                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 text-[10px] font-black px-2.5 py-1 rounded-full">
                                                            <i className="ri-close-circle-fill text-xs" />Failed
                                                        </span>
                                                    ) : tx.status === 'PENDING' ? (
                                                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-black px-2.5 py-1 rounded-full">
                                                            <i className="ri-time-fill text-xs" />Pending
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-black px-2.5 py-1 rounded-full">
                                                            <i className="ri-arrow-go-back-line text-xs" />Reversed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {transactions.length > 3 && (
                                        <div className="px-6 py-4 text-center bg-gray-50/50">
                                            <button
                                                onClick={() => setShowAllTx(v => !v)}
                                                className="text-sm font-bold text-[#34B8FF] hover:text-[#1E88E5] flex items-center gap-1.5 mx-auto transition-colors"
                                            >
                                                {showAllTx
                                                    ? <><i className="ri-arrow-up-s-line" />Show less</>
                                                    : <><i className="ri-arrow-down-s-line" />Show all {transactions.length} transactions</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
        </div>
    );
}