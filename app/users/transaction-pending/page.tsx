"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import {
    ChevronLeft,
    ShieldCheck,
    Clock,
    Loader2,
    Home,
    HeadphonesIcon,
    Zap,
    Crown,
    ArrowRightLeft,
    ShieldAlert,
    Activity,
    Cpu,
    Database,
    Fingerprint
} from "lucide-react";

// --- Theme Definitions ---

const THEMES = {
    digital: {
        name: "Digital",
        bg: "bg-[#020408]",
        accent: "text-cyan-400",
        accentBg: "bg-cyan-500/10",
        border: "border-cyan-500/30",
        btn: "bg-cyan-600 hover:bg-cyan-500 text-black",
        icon: Zap,
        anim: "animate-[pulse_1.5s_ease-in-out_infinite]",
        scannerColor: "rgba(34,211,238,0.6)",
        gradient: "from-cyan-950 via-black to-black",
        font: "font-mono",
        protocol: "CYBER-SYNC PROT-7"
    },
    regular: {
        name: "Regular",
        bg: "bg-slate-50",
        accent: "text-purple-600",
        accentBg: "bg-purple-100",
        border: "border-purple-200",
        btn: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",
        icon: Clock,
        anim: "animate-bounce",
        scannerColor: "rgba(147,51,234,0.4)",
        gradient: "from-purple-100 via-white to-slate-50",
        font: "font-sans",
        protocol: "STD-CHECK V4.0"
    },
    premium: {
        name: "Premium",
        bg: "bg-[#080808]",
        accent: "text-amber-500",
        accentBg: "bg-amber-500/10",
        border: "border-amber-500/20",
        btn: "bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950",
        icon: Crown,
        anim: "animate-[pulse_3s_ease-in-out_infinite]",
        scannerColor: "rgba(245,158,11,0.5)",
        gradient: "from-amber-950/20 via-black to-black",
        font: "font-serif",
        protocol: "ELITE-ROYAL L9"
    },
    smart: {
        name: "Smart",
        bg: "bg-[#0b0e14]",
        accent: "text-purple-400",
        accentBg: "bg-purple-500/10",
        border: "border-purple-500/20",
        btn: "bg-white/10 backdrop-blur-3xl border border-white/20 text-white",
        icon: ArrowRightLeft,
        anim: "animate-[spin_4s_linear_infinite]",
        scannerColor: "rgba(192,132,252,0.5)",
        gradient: "from-purple-900/20 via-[#0b0e14] to-blue-900/20",
        font: "font-sans",
        protocol: "AI-DRIVEN SM-22"
    },
    express: {
        name: "Express",
        bg: "bg-white",
        accent: "text-emerald-600",
        accentBg: "bg-emerald-50",
        border: "border-emerald-100",
        btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
        icon: Zap,
        anim: "animate-pulse",
        scannerColor: "rgba(16,185,129,0.4)",
        gradient: "from-emerald-50 via-white to-white",
        font: "font-sans",
        protocol: "INSTANT-FLOW X"
    },
    secure: {
        name: "Secure",
        bg: "bg-[#0a0c12]",
        accent: "text-blue-500",
        accentBg: "bg-blue-500/10",
        border: "border-blue-500/20",
        btn: "bg-blue-600 hover:bg-blue-500 text-white",
        icon: ShieldCheck,
        anim: "animate-[bounce_2s_infinite]",
        scannerColor: "rgba(59,130,246,0.5)",
        gradient: "from-blue-950/30 via-slate-950 to-black",
        font: "font-sans",
        protocol: "AES-512 SEC-SHIELD"
    }
};

function PendingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const themeKey = searchParams.get("theme") || "regular";
    const theme = THEMES[themeKey as keyof typeof THEMES] || THEMES.regular;
    const [mounted, setMounted] = useState(false);
    const [currentLog, setCurrentLog] = useState(0);

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    useState(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    });

    const translations = {
        english: {
            synchronizing: "SYNCHRONIZING SECURE TUNNEL...",
            bootingProtocol: "BOOTING PROTOCOL...",
            analyzing: "Analyzing",
            protocolVersion: "Protocol v.4.8.2",
            statusPendingApproval: "Pending Approval",
            statusUnderReview: "Under Review",
            verification: "VERIFICATION",
            highPriority: "High-priority security sequence initiated.",
            estimatedWindow: "Verification estimated window:",
            fiveToTenMins: "5-10 MINS",
            liveProcessingPulse: "Live Processing Pulse",
            active: "ACTIVE",
            returnHome: "Return Home",
            logMessages: [
                "Establishing secure gateway connection...",
                "Fetching real-time account data...",
                "Authenticating transaction request...",
                "Validating transfer amount and currency...",
                "Processing FT / SMS verification code...",
                "Cross-referencing transaction records...",
                "Synchronizing with Turner secure nodes...",
                "Finalizing internal security audit...",
                "Awaiting final Turner Team approval..."
            ]
        },
        amharic: {
            synchronizing: "ደህንነቱ የተጠበቀ ዋሻ በማመሳሰል ላይ...",
            bootingProtocol: "ፕሮቶኮል በማስነሳት ላይ...",
            analyzing: "በመተንተን ላይ",
            protocolVersion: "ፕሮቶኮል ስሪት 4.8.2",
            statusPendingApproval: "ፈቃድ በመጠበቅ ላይ",
            statusUnderReview: "በግምገማ ላይ",
            verification: "ማረጋገጫ",
            highPriority: "ከፍተኛ ቅድሚያ የደህንነት ሂደት ተጀምሯል።",
            estimatedWindow: "የማረጋገጫ የተገመተ ጊዜ:",
            fiveToTenMins: "5-10 ደቂቃዎች",
            liveProcessingPulse: "የቀጥታ ሂደት ምት",
            active: "ንቁ",
            returnHome: "ወደ ቤት ተመለስ",
            logMessages: [
                "ደህንነቱ የተጠበቀ መግቢያ ግንኙነት በማቋቋም ላይ...",
                "የቀጥታ የመለያ መረጃ በማምጣት ላይ...",
                "የግብይት ጥያቄ በማረጋገጥ ላይ...",
                "የማስተላለፍ መጠን እና ምንዛሬ በማረጋገጥ ላይ...",
                "FT / SMS ማረጋገጫ ኮድ በማስኬድ ላይ...",
                "የግብይት መዝገቦችን በማጣመር ላይ...",
                "ከ Turner ደህንነቱ የተጠበቀ ኖዶች ጋር በማመሳሰል ላይ...",
                "የውስጥ የደህንነት ኦዲት በማጠናቀቅ ላይ...",
                "የ Turner ቡድን የመጨረሻ ፈቃድ በመጠበቅ ላይ..."
            ]
        }
    };

    const t = (key: keyof typeof translations.english) => {
        if (key === 'logMessages') {
            return translations[language][key];
        }
        return translations[language][key] || translations.english[key];
    };

    const LOG_MESSAGES = t('logMessages') as string[];

    useEffect(() => {
        setMounted(true);
    }, []);

    const isLight = themeKey === 'regular' || themeKey === 'express';

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (!mounted) return;
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribeAuth();
    }, [mounted]);

    useEffect(() => {
        if (!mounted || !user) return;

        const type = searchParams.get("type");
        const collectionName = type === "withdrawal" ? "Withdrawals" : "RechargeReview";

        // Listen for the user's latest transaction status
        const q = query(
            collection(db, collectionName),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // Client-side sort to avoid index requirements
                // For Withdrawals we might need 'createdAt', for Recharge 'timestamp'.
                // Withdrawals has 'createdAt' (serverTimestamp). Recharge has 'timestamp'.
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                docs.sort((a, b) => {
                    // Handle both field names safely
                    const timeA = (a.timestamp || a.createdAt)?.toMillis?.() || 0;
                    const timeB = (b.timestamp || b.createdAt)?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                const latestTx = docs[0];
                if (latestTx?.status === 'verified' || latestTx?.status === 'approved' || latestTx?.status === 'success') {
                    // Redirect based on type
                    if (type === "withdrawal") {
                        router.push("/users/profile"); // Go to profile to see updated balance/record
                    } else {
                        router.push("/users/welcome?tab=product");
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [user, router, searchParams, mounted]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentLog(prev => (prev < LOG_MESSAGES.length - 1 ? prev + 1 : prev));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = theme.icon;

    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
                <span className="text-blue-500 font-mono text-xs animate-pulse">{t("synchronizing")}</span>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.font} transition-colors duration-1000 relative overflow-hidden flex flex-col`}>
            {/* Elite Background Overlays */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[80%] ${theme.accentBg} rounded-full blur-[160px] opacity-40 animate-pulse`}></div>
                <div className={`absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] ${theme.accentBg} rounded-full blur-[160px] opacity-20`}></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-60`}></div>

                {/* Micro-grid overlay for dark themes */}
                {!isLight && (
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                )}
            </div>

            {/* Header */}
            <header className="px-6 py-6 flex justify-between items-center relative z-10">
                <button
                    onClick={() => router.push("/users/welcome")}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 backdrop-blur-3xl border shadow-lg ${!isLight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white/60 border-slate-200 text-slate-800 hover:bg-white'}`}
                >
                    <ChevronLeft size={22} />
                </button>
                <div className={`glass-pill px-5 py-2 rounded-2xl backdrop-blur-3xl border ${theme.border} text-[11px] font-black tracking-[0.2em] uppercase shadow-lg ${theme.accent}`}>
                    <span className="animate-pulse mr-2 inline-block w-1.5 h-1.5 rounded-full bg-current"></span>
                    {theme.protocol}
                </div>
                <div className="w-11"></div>
            </header>

            <main className="flex-1 px-6 flex flex-col items-center justify-center relative z-10 max-w-lg mx-auto w-full pb-40">

                {/* Advanced Multi-Layered Scanner */}
                <div className="relative mb-16 transform scale-110 sm:scale-125">
                    {/* Atmospheric Glow */}
                    <div className={`absolute -inset-10 ${theme.accentBg} blur-[60px] rounded-full opacity-40 animate-pulse`}></div>

                    {/* Ring Layers */}
                    <div className={`absolute inset-0 scale-[1.7] border-2 rounded-full animate-[ping_4s_linear_infinite] ${theme.border} opacity-10`}></div>
                    <div className={`absolute inset-0 scale-[1.3] border-4 border-dashed rounded-full animate-[spin_12s_linear_infinite] ${theme.border} opacity-5`}></div>

                    <div className="relative w-52 h-52 sm:w-64 sm:h-64 group">
                        {/* Elite Gradient Border */}
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-transparent to-current animate-spin opacity-30 ${theme.accent}`}></div>

                        {/* The High-End Glass Core */}
                        <div className={`absolute inset-[6px] rounded-full backdrop-blur-3xl shadow-2xl ${!isLight ? 'bg-[#000000]/60 border border-white/10' : 'bg-white/70 border border-slate-200'}`}>
                            {/* Inner Glow Rings */}
                            <div className={`absolute inset-10 rounded-full border-2 border-current opacity-10 blur-[1px] ${theme.accent}`}></div>
                        </div>

                        {/* Core Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="relative">
                                <div className={`absolute inset-0 blur-3xl opacity-40 animate-pulse ${theme.accentBg}`}></div>
                                <CurrentIcon size={72} className={`${theme.accent} relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] ${theme.anim}`} strokeWidth={1} />
                            </div>

                            <div className="mt-6 flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-2">
                                    <Loader2 size={18} className={`animate-spin ${theme.accent}`} />
                                    <span className={`text-[12px] font-black tracking-[0.3em] uppercase ${theme.accent} opacity-80`}>{t("analyzing")}</span>
                                </div>
                                <div className={`text-[9px] font-mono tracking-widest ${theme.accent} opacity-40 uppercase`}>{t("protocolVersion")}</div>
                            </div>
                        </div>

                        {/* Advanced Precision Scan Line */}
                        <div
                            className="absolute top-0 left-0 right-0 h-[2px] shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-[scan_5s_ease-in-out_infinite]"
                            style={{
                                backgroundColor: theme.scannerColor,
                                boxShadow: `0 0 25px ${theme.scannerColor}, 0 0 10px white`
                            }}
                        ></div>
                    </div>
                </div>

                {/* Status Section with Elite Transparency */}
                <div className="text-center w-full space-y-6">
                    <div className="flex flex-col items-center">
                        <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-2xl backdrop-blur-3xl border shadow-xl ${theme.accentBg} ${theme.border} mb-6`}>
                            <div className="flex gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full bg-current animate-bounce ${theme.accent}`}></span>
                                <span className={`w-1.5 h-1.5 rounded-full bg-current animate-bounce delay-100 ${theme.accent}`}></span>
                                <span className={`w-1.5 h-1.5 rounded-full bg-current animate-bounce delay-200 ${theme.accent}`}></span>
                            </div>
                            <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${theme.accent}`}>Status: {searchParams.get('type') === 'withdrawal' ? t("statusPendingApproval") : t("statusUnderReview")}</span>
                        </div>

                        <h1 className={`text-4xl sm:text-5xl font-black tracking-tighter leading-[0.9] mb-4 ${!isLight ? 'text-white' : 'text-slate-950'}`}>
                            {theme.name.toUpperCase()} <br />
                            <span className={`text-transparent bg-clip-text bg-gradient-to-r drop-shadow-sm ${themeKey === 'digital' ? 'from-cyan-400 via-blue-400 to-indigo-500' : themeKey === 'premium' ? 'from-amber-300 via-amber-500 to-yellow-600' : 'from-blue-400 via-indigo-400 to-purple-500'}`}>
                                {t("verification")}
                            </span>
                        </h1>
                    </div>

                    <p className={`text-[14px] sm:text-[16px] leading-relaxed max-w-[320px] mx-auto ${!isLight ? 'text-slate-400/80' : 'text-slate-500'}`}>
                        {t("highPriority")} <br />
                        {t("estimatedWindow")} <span className={`${!isLight ? 'text-white shadow-white' : 'text-slate-900'} font-black underline decoration-2 decoration-current underline-offset-4 ${theme.accent}`}>{t("fiveToTenMins")}</span>
                    </p>

                    {/* Elite Live Verification Log */}
                    <div className={`mt-8 w-full backdrop-blur-3xl rounded-3xl border p-5 text-left relative overflow-hidden shadow-2xl transition-all duration-500 ${!isLight ? 'bg-black/40 border-white/5' : 'bg-white/60 border-slate-200'}`}>
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Activity size={40} className={theme.accent} />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-xl ${theme.accentBg} ${theme.accent}`}>
                                <Cpu size={16} />
                            </div>
                            <h4 className={`text-[11px] font-black uppercase tracking-widest ${!isLight ? 'text-slate-400' : 'text-slate-600'}`}>{t("liveProcessingPulse")}</h4>
                        </div>

                        <div className="space-y-3 font-mono">
                            {LOG_MESSAGES.slice(0, currentLog + 1).map((msg, idx) => (
                                <div key={idx} className={`flex items-start gap-3 text-[10px] sm:text-[11px] transition-all duration-300 ${idx === currentLog ? 'translate-x-1' : 'opacity-40'}`}>
                                    <span className={theme.accent}>{`>`}</span>
                                    <span className={idx === currentLog ? (!isLight ? 'text-white' : 'text-slate-900') : (!isLight ? 'text-slate-500' : 'text-slate-400')}>
                                        {msg}
                                        {idx === currentLog && <span className="inline-block w-1.5 h-3 bg-current animate-pulse ml-1 opacity-60"></span>}
                                    </span>
                                    {idx === currentLog && <span className={`ml-auto text-[9px] uppercase font-bold ${theme.accent}`}>{t("active")}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Elite Glass Bottom Action */}
            <div className={`px-6 pb-8 pt-10 border-t ${!isLight ? 'bg-black border-white/5' : 'bg-white border-slate-200'}`}>
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={() => router.push("/users/welcome")}
                        className={`group relative w-full h-15 rounded-3xl font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl overflow-hidden ${!isLight ? 'bg-white text-black' : 'bg-slate-900 text-white'}`}
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 group-hover:via-blue-500"></div>
                        <Home size={20} />
                        <span>{t("returnHome")}</span>
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .h-15 { height: 3.75rem; }
                @keyframes scan {
                    0%, 100% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(208px); opacity: 0; }
                }
                @media (min-width: 640px) {
                    @keyframes scan {
                        0%, 100% { transform: translateY(0); opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { transform: translateY(256px); opacity: 0; }
                    }
                }
            `}</style>
        </div>
    );
}

export default function TransactionPendingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /><span className="text-blue-500 font-mono text-xs animate-pulse">BOOTING PROTOCOL...</span></div>}>
            <PendingContent />
        </Suspense>
    );
}
