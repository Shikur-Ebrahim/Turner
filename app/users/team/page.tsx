"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronLeft, Users, Trophy, Wallet, UserCircle, Search, Layers } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
    uid: string;
    phoneNumber: string;
    totalRecharge: number;
    rewardEarned: number;
    joinedAt: string;
}

interface TeamData {
    A: TeamMember[];
    B: TeamMember[];
    C: TeamMember[];
    D: TeamMember[];
}

export default function TeamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D'>('A');
    const [teamData, setTeamData] = useState<TeamData>({ A: [], B: [], C: [], D: [] });
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalCommission: 0,
        totalTeamRecharge: 0,
        todayJoined: 0
    });
    const [rates, setRates] = useState({ levelA: 12, levelB: 7, levelC: 4, levelD: 2 });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/");
                return;
            }

            try {
                // 1. Fetch Dynamic Settings
                const settingsSnap = await getDoc(doc(db, "settings", "referral"));
                const fetchedRates = settingsSnap.exists() ? settingsSnap.data() : { levelA: 12, levelB: 7, levelC: 4, levelD: 2 };
                setRates(fetchedRates as any);

                // 2. Fetch all 4 levels in parallel using fetched rates
                const levels = [
                    { key: 'inviterA', pct: (fetchedRates.levelA || 12) / 100, label: 'A' },
                    { key: 'inviterB', pct: (fetchedRates.levelB || 7) / 100, label: 'B' },
                    { key: 'inviterC', pct: (fetchedRates.levelC || 4) / 100, label: 'C' },
                    { key: 'inviterD', pct: (fetchedRates.levelD || 2) / 100, label: 'D' }
                ];

                const promises = levels.map(async (level) => {
                    const q = query(collection(db, "users"), where(level.key, "==", user.uid));
                    const snapshot = await getDocs(q);
                    return {
                        label: level.label,
                        members: snapshot.docs.map(doc => {
                            const data = doc.data();
                            const totalRecharge = data.totalRecharge || 0;
                            return {
                                uid: doc.id,
                                phoneNumber: data.phoneNumber || "Unknown",
                                totalRecharge: totalRecharge,
                                rewardEarned: totalRecharge * level.pct,
                                joinedAt: data.createdAt
                            };
                        })
                    };
                });

                const results = await Promise.all(promises);

                const newTeamData: any = {};
                let count = 0;
                let commission = 0;
                let teamRecharge = 0;
                let todayCount = 0;

                // Get today's date string (naive check, works for basic ISO strings)
                const todayStr = new Date().toISOString().split('T')[0];

                results.forEach(res => {
                    newTeamData[res.label] = res.members;
                    count += res.members.length;

                    res.members.forEach(m => {
                        commission += m.rewardEarned;
                        teamRecharge += m.totalRecharge;

                        // Check if joined today
                        if (m.joinedAt) {
                            // Handle both Timestamp and string cases if necessary, currently assuming string/ISO or compatible
                            // If joinedAt is a Firestore Timestamp, we'd need .toDate().toISOString()
                            // For safety, let's treat it as string check or just simple presence for now
                            // If you store as ISO string:
                            if (typeof m.joinedAt === 'string' && m.joinedAt.includes(todayStr)) {
                                todayCount++;
                            }
                        }
                    });
                });

                setTeamData(newTeamData);
                setStats({
                    totalMembers: count,
                    totalCommission: commission,
                    totalTeamRecharge: teamRecharge,
                    todayJoined: todayCount
                });

            } catch (error) {
                console.error("Error fetching team:", error);
                toast.error("Failed to load team data");
                setLoading(false);
            } finally {
                setLoading(false);
            }
        });

        // Safety timeout to prevent permanent loading state
        const loadingTimeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        return () => {
            unsubscribe();
            clearTimeout(loadingTimeout);
        };
    }, [router, mounted]);

    const tabs = [
        { id: 'A', label: 'Level 1', pct: `${rates.levelA}%` },
        { id: 'B', label: 'Level 2', pct: `${rates.levelB}%` },
        { id: 'C', label: 'Level 3', pct: `${rates.levelC}%` },
        { id: 'D', label: 'Level 4', pct: `${rates.levelD}%` },
    ];

    const formatPhone = (phone: string) => {
        if (phone.length < 6) return phone;
        return phone.substring(0, 4) + "****" + phone.substring(phone.length - 2);
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const currentMembers = teamData[activeTab];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">My Team</h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="max-w-md mx-auto p-4 pb-44">
                {/* Overview Cards */}
                {/* Advanced Dashboard Card */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 mb-8 relative overflow-hidden">
                    <div className="flex items-center gap-8 relative z-10">
                        {/* Circular Gauge */}
                        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                            {/* SVG Gauge with Continuous Rotation */}
                            <style>
                                {`
                                    @keyframes rotate-gauge {
                                        0% { transform: rotate(-90deg); }
                                        100% { transform: rotate(270deg); }
                                    }
                                    @keyframes stroke-draw {
                                        from { stroke-dashoffset: 276.46; }
                                        to { stroke-dashoffset: 60; }
                                    }
                                    .animate-gauge-rotate {
                                        animation: rotate-gauge 10s linear infinite;
                                        transform-origin: center;
                                    }
                                    .animate-gauge-draw {
                                        animation: stroke-draw 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                                    }
                                `}
                            </style>
                            <svg className="w-full h-full animate-gauge-rotate" viewBox="0 0 100 100">
                                {/* Background Circle - More visible */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="44"
                                    fill="transparent"
                                    stroke="#F1F5F9"
                                    strokeWidth="8"
                                />
                                {/* Progress Circle with Animation */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="44"
                                    fill="transparent"
                                    stroke="url(#gradient-advanced)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray="276.46"
                                    className="animate-gauge-draw"
                                />
                                <defs>
                                    <linearGradient id="gradient-advanced" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#A78BFA" />
                                        <stop offset="50%" stopColor="#818CF8" />
                                        <stop offset="100%" stopColor="#6366F1" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Center Content - Absolutely Positioned Fixed (not rotating) */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                                <Trophy size={20} className="text-[#FBBF24] mb-0.5 fill-[#FBBF24]" />
                                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.15em] leading-tight">Team Assets</span>
                                <span className={`font-black text-[#1E293B] tabular-nums leading-none tracking-tight transition-all duration-300 ${stats.totalTeamRecharge.toLocaleString().length > 12 ? 'text-[8px]' :
                                    stats.totalTeamRecharge.toLocaleString().length > 9 ? 'text-[10px]' :
                                        stats.totalTeamRecharge.toLocaleString().length > 7 ? 'text-sm' :
                                            'text-xl'
                                    }`}>
                                    {stats.totalTeamRecharge.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* List Stats */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.1em] mb-1">Total Income</p>
                                <p className="text-2xl font-black text-[#0F172A] tabular-nums leading-none">
                                    {stats.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[#64748B] font-medium">Members Today</span>
                                    <span className="font-bold text-white bg-[#EEF2FF] text-[#4F46E5] px-3 py-1 rounded-full text-xs shadow-sm flex items-center gap-1">
                                        <span className="opacity-70">+</span>{stats.todayJoined}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#64748B] font-medium">Total Size</span>
                                    <span className="font-black text-[#1E293B]">
                                        {stats.totalMembers}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level Tabs */}
                <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 flex items-center justify-between mb-6 overflow-x-auto gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[80px] ${activeTab === tab.id
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <span className={`text-xs font-bold ${activeTab === tab.id ? 'text-white' : 'text-slate-700'}`}>
                                {tab.label}
                            </span>
                            <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-white/70' : 'text-slate-400'}`}>
                                {tab.pct}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Members List - Advanced Timeline Style */}
                <div className="relative pl-4 space-y-6">
                    {/* Timeline Line */}
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-transparent"></div>

                    {currentMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 pl-4">
                            <div className="w-16 h-16 bg-slate-100/50 rounded-full flex items-center justify-center mb-4 transition-all hover:scale-110">
                                <Users size={24} className="opacity-50" />
                            </div>
                            <p className="text-sm font-medium">No members in this level yet</p>
                        </div>
                    ) : (
                        currentMembers.map((member, idx) => (
                            <div key={member.uid} className="relative pl-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards" style={{ animationDelay: `${idx * 100}ms` }}>
                                {/* Timeline Dot */}
                                <div className="absolute left-[-5px] top-6 w-3 h-3 rounded-full bg-white border-2 border-indigo-400 z-10 shadow-[0_0_0_4px_rgba(129,140,248,0.2)]"></div>

                                <div className="bg-white rounded-2xl p-[1px] shadow-sm hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-indigo-50 to-purple-50 group">
                                    <div className="bg-white rounded-[15px] p-4 flex items-center gap-4 h-full">
                                        <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-indigo-300 to-purple-300 shrink-0 shadow-lg shadow-indigo-200/50">
                                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                                                <img
                                                    src={encodeURI(`/level ${activeTab === 'A' ? 1 : activeTab === 'B' ? 2 : activeTab === 'C' ? 3 : 4}.jpg`)}
                                                    alt="Member"
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                                                {formatPhone(member.phoneNumber)}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                                                    Recharge: <span className="text-slate-900">{member.totalRecharge}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right pl-2 border-l border-slate-50">
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Reward</span>
                                            <div className="text-sm font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                                +{member.rewardEarned.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
