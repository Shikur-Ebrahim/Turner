"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import {
    ChevronLeft,
    Crown,
    Users,
    CircleDollarSign,
    TrendingUp,
    Calendar,
    ArrowRight,
    Sparkles
} from "lucide-react";

export default function UserVipRulesPage() {
    const router = useRouter();
    const [vipRules, setVipRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "VipRules"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort smaller to larger level number
            rules.sort((a: any, b: any) => {
                const numA = parseInt(a.level?.replace(/\D/g, '') || "0");
                const numB = parseInt(b.level?.replace(/\D/g, '') || "0");
                return numA - numB;
            });

            setVipRules(rules);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans">
            {/* Animated Background Mesh */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/30 blur-[100px] rounded-full"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-amber-100/30 blur-[100px] rounded-full"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-white/50 px-6 py-5 flex items-center justify-between z-50">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 active:scale-90 transition-transform"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">VIP Tiers</h2>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter mt-1">Exclusive Rewards</p>
                </div>
                <div className="w-10"></div> {/* Spacer for symmetry */}
            </header>

            <main className="px-6 py-8 space-y-10 relative z-10">
                {/* Hero Section */}
                <div className="relative p-8 rounded-[3rem] bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 overflow-hidden shadow-2xl shadow-emerald-900/40 border border-slate-800">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-12 -mt-12 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -ml-8 -mb-8"></div>

                    <div className="relative z-10 flex flex-col items-center text-center gap-6">
                        <div className="w-24 h-24 relative">
                            <img src="/vip_rule_3d.png" alt="VIP Icon" className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-white tracking-tight">VIP Reward Matrix</h1>
                            <p className="text-emerald-100/60 text-xs font-medium uppercase tracking-widest px-4">Maximize your earnings by climbing our elite leadership tiers</p>
                        </div>
                    </div>
                </div>

                {/* Rules Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <Sparkles className="text-amber-500" size={18} />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Available Tiers</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</span>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Rules...</p>
                            </div>
                        ) : vipRules.length > 0 ? (
                            vipRules.map((rule, idx) => (
                                <div
                                    key={rule.id}
                                    className="group bg-white rounded-[2.5rem] p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-white hover:shadow-emerald-900/10 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden active:scale-95"
                                >
                                    {/* Indicator Tag */}
                                    <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-bl-[1.5rem] text-[8px] font-black text-white uppercase tracking-widest shadow-xl shadow-emerald-500/20">
                                        Active
                                    </div>

                                    <div className="flex items-start gap-5 mb-6">
                                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shadow-inner group-hover:rotate-6 transition-transform">
                                            <img src={rule.imageUrl} alt={rule.level} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 pt-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight">{rule.level}</h4>
                                                <Crown size={14} className="text-amber-500" />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leadership Tier</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-50/50 rounded-[1.5rem] p-4 border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users size={12} className="text-slate-400" />
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Invested Team</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-800">{rule.investedTeamSize} <span className="text-[9px] text-slate-400">Members</span></p>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-[1.5rem] p-4 border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CircleDollarSign size={12} className="text-slate-400" />
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Assets</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-800">{Number(rule.totalTeamAssets).toLocaleString()} <span className="text-[9px] text-slate-400">ETB</span></p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 p-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                    <TrendingUp size={12} className="text-emerald-600" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Monthly Salary</span>
                                            </div>
                                            <span className="text-md font-black text-emerald-600">{Number(rule.monthlySalary).toLocaleString()} ETB</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                    <Calendar size={12} className="text-indigo-600" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">5-Year Loyalty</span>
                                            </div>
                                            <span className="text-md font-black text-indigo-600 font-mono tracking-tighter">{Number(rule.yearlySalary5Year).toLocaleString()} ETB</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-center gap-2 py-4 bg-slate-50 group-hover:bg-emerald-50 rounded-2xl transition-colors">
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-widest">View Eligibility</span>
                                        <ArrowRight size={12} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300 gap-4">
                                <Crown size={48} className="opacity-10" />
                                <p className="text-xs font-bold uppercase tracking-widest">Tier system under maintenance</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed text-center">
                        * All VIP rewards are subject to platform terms and conditions. Monthly salaries are distributed automatically to eligible ambassadors.
                    </p>
                </div>
            </main>

            {/* Bottom Safe Area */}
            <div className="h-10"></div>
        </div>
    );
}
