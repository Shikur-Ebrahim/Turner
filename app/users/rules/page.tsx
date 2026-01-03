"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ChevronLeft,
    BookOpen,
    ArrowRight,
    Trophy,
    Users,
    Wallet,
    Calendar,
    CheckCircle2,
    Zap
} from "lucide-react";
import { useRouter } from "next/navigation";

const CATEGORY_META: any = {
    recharge: { label: "Recharge Guide", icon: Wallet, color: "emerald", gradient: "from-emerald-500 to-emerald-700" },
    invitation: { label: "Referral Rewards", icon: Users, color: "blue", gradient: "from-blue-500 to-blue-700" },
    withdrawal: { label: "Withdrawal Rules", icon: Zap, color: "amber", gradient: "from-amber-500 to-orange-600" },
    salary: { label: "Monthly Salary", icon: Calendar, color: "purple", gradient: "from-purple-500 to-indigo-700" },
    tasks: { label: "Daily Tasks", icon: Trophy, color: "indigo", gradient: "from-indigo-500 to-blue-700" },
    general: { label: "General Info", icon: BookOpen, color: "rose", gradient: "from-rose-500 to-rose-700" },
};

const COLOR_MAP: any = {
    emerald: { tab: "bg-emerald-600 shadow-emerald-600/30", badge: "bg-emerald-50 text-emerald-600", icon: "text-emerald-600", iconBg: "bg-emerald-100", loading: "border-emerald-600" },
    blue: { tab: "bg-blue-600 shadow-blue-600/30", badge: "bg-blue-50 text-blue-600", icon: "text-blue-600", iconBg: "bg-blue-100", loading: "border-blue-600" },
    amber: { tab: "bg-amber-600 shadow-amber-600/30", badge: "bg-amber-50 text-amber-600", icon: "text-amber-600", iconBg: "bg-amber-100", loading: "border-amber-600" },
    purple: { tab: "bg-purple-600 shadow-purple-600/30", badge: "bg-purple-50 text-purple-600", icon: "text-purple-600", iconBg: "bg-purple-100", loading: "border-purple-600" },
    indigo: { tab: "bg-indigo-600 shadow-indigo-600/30", badge: "bg-indigo-50 text-indigo-600", icon: "text-indigo-600", iconBg: "bg-indigo-100", loading: "border-indigo-600" },
    rose: { tab: "bg-rose-600 shadow-rose-600/30", badge: "bg-rose-50 text-rose-600", icon: "text-rose-600", iconBg: "bg-rose-100", loading: "border-rose-600" },
};

export default function UserRulesPage() {
    const router = useRouter();
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("recharge");
    const [userData, setUserData] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    // Get current user and their data
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userRef = doc(db, "users", currentUser.uid);
                const unsubscribeData = onSnapshot(userRef, (doc) => {
                    if (doc.exists()) {
                        setUserData(doc.data());
                    }
                });
                return () => unsubscribeData();
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        const q = query(collection(db, "rules"), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rulesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRules(rulesData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Mark as read when activeCategory changes
    useEffect(() => {
        if (!user || loading) return;

        const updateViewTime = async () => {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                lastRulesViewedAt: serverTimestamp(),
                [`lastViewedRules.${activeCategory}`]: serverTimestamp()
            });
        };

        updateViewTime();
    }, [activeCategory, user, loading]);

    const filteredRules = rules.filter(r => r.category === activeCategory);
    const ActiveIcon = CATEGORY_META[activeCategory]?.icon || BookOpen;
    const activeMeta = CATEGORY_META[activeCategory];
    const activeColor = activeMeta?.color || "emerald";
    const scheme = COLOR_MAP[activeColor];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pb-32">
            {/* Premium Dynamic Header */}
            <div className={`bg-gradient-to-br ${activeMeta?.gradient || "from-emerald-500 to-emerald-700"} px-6 pt-12 pb-20 relative overflow-hidden transition-all duration-700`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-8 border border-white/20 active:scale-95 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="relative z-10 flex items-center gap-4 animate-in slide-in-from-left-4 duration-500">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                        <ActiveIcon size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Platform Rules</h1>
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
                            {activeMeta?.label} Guidelines
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="-mt-10 px-4 relative z-20">
                <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-2 flex overflow-x-auto no-scrollbar gap-2 shadow-xl shadow-black/5 border border-white">
                    {Object.keys(CATEGORY_META).map((catId) => {
                        const meta = CATEGORY_META[catId];
                        const Icon = meta.icon;
                        const isActive = activeCategory === catId;

                        // Check if this category has updates
                        const categoryUpdatedAt = rules
                            .filter(r => r.category === catId)
                            .reduce((latest, r) => {
                                const rUpdate = r.updatedAt?.toMillis() || 0;
                                return rUpdate > latest ? rUpdate : latest;
                            }, 0);

                        const lastViewed = userData?.lastViewedRules?.[catId]?.toMillis() || 0;
                        const hasUpdate = categoryUpdatedAt > lastViewed;

                        return (
                            <button
                                key={catId}
                                onClick={() => setActiveCategory(catId)}
                                className={`flex items-center gap-2 px-6 py-4 rounded-[2.2rem] transition-all whitespace-nowrap relative ${isActive
                                    ? `${scheme.tab} text-white shadow-lg font-black`
                                    : "text-gray-400 font-bold hover:bg-gray-100/50"
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="text-[10px] uppercase tracking-wider">{meta.label}</span>

                                {hasUpdate && (
                                    <div className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <main className="flex-1 px-4 mt-8 space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                        <div className={`w-8 h-8 border-4 ${scheme.loading} border-t-transparent rounded-full animate-spin`}></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Guidelines...</p>
                    </div>
                ) : filteredRules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-dashed border-gray-200">
                        <BookOpen size={48} className="text-gray-200 mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">No guidelines found here.</p>
                    </div>
                ) : (
                    filteredRules.map((rule, idx) => (
                        <div
                            key={rule.id}
                            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className={`px-3 py-1 ${scheme.badge} rounded-lg text-[9px] font-black uppercase tracking-widest w-fit inline-block mb-1`}>
                                        Step {idx + 1}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                        {rule.title}
                                    </h3>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                                    <ArrowRight size={20} />
                                </div>
                            </div>

                            {rule.imageUrl && (
                                <div className="rounded-[2rem] overflow-hidden aspect-video relative group ring-1 ring-black/5 shadow-lg">
                                    <img
                                        src={rule.imageUrl}
                                        alt={rule.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <p className="text-slate-600 font-medium text-[13px] leading-relaxed antialiased">
                                    {rule.description}
                                </p>

                                {rule.steps && rule.steps.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t border-slate-50">
                                        {rule.steps.map((step: string, sIdx: number) => (
                                            <div key={sIdx} className="flex gap-4">
                                                <div className={`w-5 h-5 rounded-full ${scheme.iconBg} flex items-center justify-center shrink-0`}>
                                                    <CheckCircle2 size={12} className={scheme.icon} />
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-600 leading-tight tracking-tight mt-0.5">
                                                    {step}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
