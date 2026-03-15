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

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    useEffect(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    }, []);

    const translations = {
        english: {
            vipTiers: "VIP Tiers",
            exclusiveRewards: "Exclusive Rewards",
            vipRewardMatrix: "VIP Reward Matrix",
            maximizeEarnings: "Maximize your earnings by climbing our elite leadership tiers",
            availableTiers: "Available Tiers",
            liveUpdates: "Live Updates",
            syncingRules: "Syncing Rules...",
            active: "Active",
            leadershipTier: "Leadership Tier",
            investedTeam: "Invested Team",
            members: "Members",
            totalAssets: "Total Assets",
            etb: "ETB",
            monthlySalary: "Monthly Salary",
            fiveYearLoyalty: "5-Year Loyalty",
            viewEligibility: "View Eligibility",
            underMaintenance: "Tier system under maintenance",
            privileges: [
                "Early access to new products",
                "Advanced customer support"
            ]
        },
        amharic: {
            vipTiers: "ቪ.አይ.ፒ ደረጃዎች",
            exclusiveRewards: "ልዩ ሽልማቶች",
            vipRewardMatrix: "የቪ.አይ.ፒ ሽልማት ማትሪክስ",
            maximizeEarnings: "በተመረጡ የአመራር ደረጃዎቻችን በመውጣት ገቢዎን ያሳድጉ",
            availableTiers: "የሚገኙ ደረጃዎች",
            liveUpdates: "የቀጥታ ዝመናዎች",
            syncingRules: "ደንቦችን በማመሳሰል ላይ...",
            active: "ንቁ",
            leadershipTier: "የአመራር ደረጃ",
            investedTeam: "ኢንቨስት ያደረገ ቡድን",
            members: "አባላት",
            totalAssets: "ጠቅላላ ንብረቶች",
            etb: "ብር",
            monthlySalary: "ወርሃዊ ደሞዝ",
            fiveYearLoyalty: "የ5 ዓመት ታማኝነት",
            viewEligibility: "ብቁነትን ይመልከቱ",
            underMaintenance: "የደረጃ ስርዓት በጥገና ላይ",
            privileges: [
                "ትኩስ ምርቶችን አዲስ አገኛለሁ",
                "ልምድ ደንበኛ መጠበቂያ መርሃግብር"
            ]
        }
    };

    const t = (key: keyof typeof translations.english) => {
        return translations[language][key] || translations.english[key];
    };

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
                    <h2 className="text-sm font-black text-slate-900 tracking-widest leading-none">{t("vipTiers")}</h2>
                    <p className="text-[10px] font-bold text-emerald-600 tracking-tighter mt-1">{t("exclusiveRewards")}</p>
                </div>
                <div className="w-10"></div> {/* Spacer for symmetry */}
            </header>

            <main className="px-6 py-8 space-y-10 relative z-10">
                {/* Rules Grid */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 tracking-widest">{t("syncingRules")}</p>
                            </div>
                        ) : vipRules.length > 0 ? (
                            vipRules.map((rule, idx) => (
                                <div
                                    key={rule.id}
                                    className="group bg-white rounded-[2.5rem] p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-white hover:shadow-emerald-900/10 hover:scale-[1.02] transition-all duration-500 relative overflow-hidden active:scale-95"
                                >
                                    {/* Indicator Tag */}
                                    <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-bl-[1.5rem] text-[8px] font-black text-white tracking-widest shadow-xl shadow-emerald-500/20">
                                        {t("active")}
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
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-50/50 rounded-[1.5rem] p-4 border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Users size={12} className="text-slate-400" />
                                                <p className="text-[8px] font-black text-slate-400 tracking-widest">{t("investedTeam")}</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-800">{rule.investedTeamSize} <span className="text-[9px] text-slate-400">{t("members")}</span></p>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-[1.5rem] p-4 border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-colors">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CircleDollarSign size={12} className="text-slate-400" />
                                                <p className="text-[8px] font-black text-slate-400 tracking-widest">{t("totalAssets")}</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-800">{Number(rule.totalTeamAssets).toLocaleString()} <span className="text-[9px] text-slate-400">{t("etb")}</span></p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 p-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                    <TrendingUp size={12} className="text-emerald-600" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-500 tracking-widest">{t("monthlySalary")}</span>
                                            </div>
                                            <span className="text-md font-black text-emerald-600">{Number(rule.monthlySalary).toLocaleString()} {t("etb")}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                    <Calendar size={12} className="text-indigo-600" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-500 tracking-widest">{t("fiveYearLoyalty")}</span>
                                            </div>
                                            <span className="text-md font-black text-indigo-600 font-mono tracking-tighter">{Number(rule.yearlySalary5Year).toLocaleString()} {t("etb")}</span>
                                        </div>
                                    </div>

                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300 gap-4">
                                <Crown size={48} className="opacity-10" />
                                <p className="text-xs font-bold tracking-widest">{t("underMaintenance")}</p>
                            </div>
                        )}
                    </div>
                </div>

            </main>

            {/* Bottom Safe Area */}
            <div className="h-10"></div>
        </div>
    );
}
