"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronLeft, Users, Trophy, Wallet, UserCircle, Search, Layers, Star, Coins } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
    uid: string;
    phoneNumber: string;
    totalRecharge: number;
    rewardEarned: number;
    joinedAt: string;
    level: string;
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
    const [activeTab, setActiveTab] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('A');
    const [teamData, setTeamData] = useState<TeamData>({ A: [], B: [], C: [], D: [] });
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalCommission: 0,
        totalTeamRecharge: 0,
        todayJoined: 0,
        levelCounts: { A: 0, B: 0, C: 0, D: 0 },
        levelAssets: { A: 0, B: 0, C: 0, D: 0 }
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
                                joinedAt: data.createdAt,
                                level: level.label
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

                const levelCounts = { A: 0, B: 0, C: 0, D: 0 };
                const levelAssets = { A: 0, B: 0, C: 0, D: 0 };

                // Get today's date string
                const todayStr = new Date().toISOString().split('T')[0];

                results.forEach(res => {
                    newTeamData[res.label] = res.members;
                    count += res.members.length;
                    levelCounts[res.label as keyof typeof levelCounts] = res.members.length;

                    res.members.forEach(m => {
                        commission += m.rewardEarned;
                        teamRecharge += m.totalRecharge;
                        levelAssets[res.label as keyof typeof levelAssets] += m.totalRecharge;

                        if (m.joinedAt && typeof m.joinedAt === 'string' && m.joinedAt.includes(todayStr)) {
                            todayCount++;
                        }
                    });
                });

                setTeamData(newTeamData);
                setStats({
                    totalMembers: count,
                    totalCommission: commission,
                    totalTeamRecharge: teamRecharge,
                    todayJoined: todayCount,
                    levelCounts,
                    levelAssets
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

    const currentMembers = activeTab === 'all'
        ? [...teamData.A, ...teamData.B, ...teamData.C, ...teamData.D]
        : teamData[activeTab];

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
                {/* Advanced Dashboard Card */}
                <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50 mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-10 relative z-10">
                        {/* 3D Circular Asset Gauge */}
                        <div className="relative w-40 h-40 shrink-0 flex items-center justify-center transform hover:scale-105 transition-transform duration-500 perspective-1000">
                            {/* Rotating Ring */}
                            <div className="absolute inset-0 rounded-full border-[6px] border-slate-50 border-t-indigo-500/30 border-l-indigo-500/30 animate-[spin_8s_linear_infinite]"></div>
                            <div className="absolute inset-2 rounded-full border-[2px] border-dashed border-slate-200 animate-[spin_12s_linear_infinite_reverse]"></div>

                            <svg className="w-full h-full -rotate-90 drop-shadow-xl transform preserve-3d" viewBox="0 0 100 100">
                                <defs>
                                    <linearGradient id="assetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Track */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="#ecf0f5"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                />
                                {/* Progress Indicator */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="transparent"
                                    stroke="url(#assetGradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray="251.2"
                                    strokeDashoffset="60"
                                    filter="url(#glow)"
                                    className="animate-[dash_1.5s_ease-out_forwards]"
                                />
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 animate-in fade-in zoom-in duration-700">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mb-1 shadow-inner animate-bounce-slow">
                                    <Trophy size={16} className="text-indigo-500 fill-indigo-500" />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight mb-0.5">Assets</span>
                                <span className="font-black text-slate-800 text-sm tabular-nums leading-none tracking-tight">
                                    {stats.totalTeamRecharge >= 1000000 ? (stats.totalTeamRecharge / 1000000).toFixed(1) + "M" : stats.totalTeamRecharge.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* List Stats */}
                        <div className="flex-1 w-full space-y-5">
                            <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/80">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    Total Income <div className="h-[1px] flex-1 bg-slate-200"></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-4xl sm:text-3xl font-black text-slate-800 tabular-nums leading-none tracking-tight">
                                        {stats.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 animate-pulse"></div>
                                        <Coins size={36} className="text-amber-500 fill-amber-300 drop-shadow-[0_4px_4px_rgba(245,158,11,0.5)] animate-[bounce_3s_infinite]" strokeWidth={2.5} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">New Today</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Users size={14} className="text-emerald-500" />
                                        <span className="font-black text-slate-800 text-sm">+{stats.todayJoined}</span>
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Team Size</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Layers size={14} className="text-blue-500" />
                                        <span className="font-black text-slate-800 text-sm">{stats.totalMembers}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Invite Banner */}
                <div
                    onClick={() => router.push("/users/invite")}
                    className="relative w-full h-32 rounded-[2.2rem] overflow-hidden mb-8 cursor-pointer group shadow-2xl shadow-indigo-500/10 active:scale-95 transition-all duration-500 border border-white/50"
                >
                    <img
                        src="/invite_banner.png"
                        alt="Invite Friends"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/60 to-transparent flex flex-col justify-center px-8">
                        <div className="flex flex-col">
                            <span className="text-white font-black text-xl tracking-tight leading-none drop-shadow-md">Invite Friends</span>
                            <span className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em] mt-1 drop-shadow-sm">Get Extra Rewards</span>
                        </div>
                    </div>
                    {/* Glossy overlay effect */}
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Level Tabs Navigation */}
                <div className="bg-white rounded-[1.8rem] p-1.5 shadow-sm border border-slate-100 flex gap-1 mb-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 px-2 rounded-2xl flex flex-col items-center transition-all duration-300 ${activeTab === tab.id
                                ? "bg-[#0F172A] text-white shadow-xl"
                                : "text-slate-400 hover:bg-slate-50"
                                }`}
                        >
                            <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">{tab.label}</span>
                            <span className={`text-[9px] font-bold mt-0.5 ${activeTab === tab.id ? "text-slate-400" : "text-slate-300"}`}>{tab.pct}</span>
                        </button>
                    ))}
                </div>


                {/* Members List - White Timeline Style */}
                <div className="relative pl-4 space-y-6">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-slate-100"></div>

                    {currentMembers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-300 pl-4">
                            <Users size={32} className="opacity-20 mb-3" />
                            <p className="text-xs font-bold uppercase tracking-widest">No members found</p>
                        </div>
                    ) : (
                        currentMembers.map((member, idx) => (
                            <div key={member.uid} className="relative pl-10 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                {/* Timeline Dot */}
                                <div className="absolute left-[-2px] top-8 w-4 h-4 rounded-full bg-white border-2 border-indigo-400 z-10 shadow-[0_0_0_4px_rgba(129,140,248,0.1)]"></div>

                                <div className="bg-white rounded-[2.2rem] p-5 shadow-[0_15px_35px_rgba(0,0,0,0.03)] border border-slate-50 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar with blue ring */}
                                        <div className="w-16 h-16 rounded-full p-1 bg-white border border-indigo-100 shrink-0 relative shadow-sm">
                                            <div className="w-full h-full rounded-full overflow-hidden border border-indigo-200">
                                                <img
                                                    src={encodeURI(`/level ${member.level === 'A' ? 1 : member.level === 'B' ? 2 : member.level === 'C' ? 3 : 4}.jpg`)}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="font-extrabold text-[#1E293B] text-base tracking-tight">
                                                {formatPhone(member.phoneNumber)}
                                            </h3>
                                            <div className="bg-slate-50/80 px-4 py-1.5 rounded-full w-fit border border-slate-100 shadow-sm">
                                                <span className="text-[10px] font-bold text-slate-400">Recharge: </span>
                                                <span className="text-[10px] font-black text-[#1E293B]">{member.totalRecharge.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right flex flex-col items-end">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">REWARD</span>
                                        <span className="text-[16px] font-black text-[#10B981] tracking-tight">
                                            +{member.rewardEarned.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </span>
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
