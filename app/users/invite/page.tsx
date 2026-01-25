"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronLeft, Copy, CheckCircle2, Share2, Sparkles, Gift, Users, Wallet, Coins } from "lucide-react";
import { toast } from "sonner";

export default function InvitePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [referralLink, setReferralLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState({ earned: 0, invited: 0 });

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    useEffect(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    }, []);

    const translations = {
        english: {
            rewardsProgram: "Rewards Program",
            inviteFriends: "Invite Friends",
            getRewards: "Get Rewards",
            inviteDesc: "Share your link and earn real cash for every friend who joins and recharges.",
            vipReward: "VIP Reward",
            invited: "Invited",
            earned: "Earned",
            uniqueLink: "Your Unique Link",
            copied: "Copied!",
            copyLink: "COPY LINK",
            copy: "COPY",
            copiedToast: "Referral link copied to clipboard!",
            shareTitle: "Join Turner & Earn!",
            shareText: "Join me on Turner and get verified rewards!",
            terms: "Terms and conditions apply to all rewards."
        },
        amharic: {
            rewardsProgram: "የሽልማት ፕሮግራም",
            inviteFriends: "ጓደኞችን ይጋብዙ",
            getRewards: "ሽልማቶችን ያግኙ",
            inviteDesc: "ሊንክዎን ያጋሩ እና ለእያንዳንዱ የተቀላቀለ እና ቦርሳውን ለሞላ ጓደኛ እውነተኛ ገንዘብ ያግኙ።",
            vipReward: "ቪ.አይ.ፒ ሽልማት",
            invited: "ተጋብዘዋል",
            earned: "ያገኙት",
            uniqueLink: "የእርስዎ ልዩ ሊንክ",
            copied: "ተቀድቷል!",
            copyLink: "ሊንኩን ይቅዱ",
            copy: "ቅዳ",
            copiedToast: "ሪፈራል ሊንኩ ወደ ቅንጥብ ሰሌዳ ተቀድቷል!",
            shareTitle: "ተርነርን ይቀላቀሉ እና ያግኙ!",
            shareText: "ተርነርን ይቀላቀሉ እና የተረጋገጡ ሽልማቶችን ያግኙ!",
            terms: "ውሎች እና ሁኔታዎች ለሁሉም ሽልማቶች ተፈጻሚ ይሆናሉ።"
        }
    };

    const t = (key: keyof typeof translations.english) => {
        return translations[language][key] || translations.english[key];
    };


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/");
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const baseUrl = window.location.origin;
                    setReferralLink(`${baseUrl}?ref=${user.uid}`);

                    // Mock stats for visual appeal if not present
                    setStats({
                        earned: data.teamIncome || 0,
                        invited: data.teamSize || 0
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast.success(t("copiedToast"));
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t("shareTitle"),
                    text: t("shareText"),
                    url: referralLink,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            handleCopy();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative overflow-hidden font-sans selection:bg-blue-100">
            {/* Ambient Background Lighting */}
            <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none z-0"></div>
            <div className="fixed -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>
            <div className="fixed top-20 -left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>

            {/* Header */}
            <header className="w-full px-6 py-5 flex items-center justify-between relative z-20">
                <button
                    onClick={() => router.back()}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/80 border border-white/50 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.1)] backdrop-blur-md active:scale-90 transition-all text-slate-600 hover:text-blue-600"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50/50 border border-blue-100 rounded-full backdrop-blur-sm">
                    <Gift size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">{t("rewardsProgram")}</span>
                </div>
                <div className="w-11"></div> {/* Spacer for balance */}
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-lg mx-auto px-6 flex flex-col items-center relative z-10 pt-2 pb-44">

                {/* Hero Section */}
                <div className="flex flex-col items-center text-center space-y-2 mb-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-[1.1]">
                        {t("inviteFriends")}<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t("getRewards")}</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 max-w-[250px]">
                        {t("inviteDesc")}
                    </p>
                </div>

                {/* Central Premium Animation */}
                <div className="relative w-[22rem] h-[22rem] flex items-center justify-center mb-8">
                    {/* Glowing Backdrop */}
                    <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[80px] animate-pulse"></div>

                    {/* Rotating Premium Rings */}
                    <div className="absolute inset-0 border-[2px] border-dashed border-blue-200/40 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    <div className="absolute inset-8 border border-indigo-100/50 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-16 border-[0.5px] border-blue-500/10 rounded-full"></div>

                    {/* Floating Particles */}
                    <div className="absolute top-10 left-10 w-3 h-3 bg-blue-400 rounded-full blur-[1px] opacity-20 animate-bounce"></div>
                    <div className="absolute bottom-10 right-10 w-2 h-2 bg-indigo-400 rounded-full blur-[1px] opacity-20 animate-pulse"></div>

                    {/* Central Image Container - Modern 3D Style */}
                    <div className="relative w-64 h-64 group flex items-center justify-center">
                        <div className="absolute inset-0 bg-white rounded-full shadow-[0_30px_70px_-15px_rgba(37,99,235,0.25)] flex items-center justify-center border border-white/60 animate-[float_6s_ease-in-out_infinite]">
                            <img
                                src="/invite_icon_premium.png"
                                alt="Premium Invitation"
                                className="w-[120%] h-[120%] object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.2)] transition-all duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_35px_50px_rgba(0,0,0,0.3)]"
                            />
                        </div>

                        {/* Interactive Floating Badge */}
                        <div className="absolute top-4 -right-2 px-5 py-2.5 bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] rounded-[1.2rem] shadow-xl shadow-amber-500/40 flex items-center gap-2 border border-white/40 animate-[float_4s_ease-in-out_infinite_reverse]">
                            <Sparkles size={16} className="text-white fill-white/20" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">{t("vipReward")}</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid - Premium Cards */}
                <div className="grid grid-cols-2 gap-4 w-full mb-8 relative z-10">
                    {/* Invited Card */}
                    <div
                        onClick={() => router.push("/users/team")}
                        className="bg-white rounded-3xl p-4 shadow-[0_10px_40px_-10px_rgba(37,99,235,0.15)] border border-blue-50 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="relative flex flex-col items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center mb-3 text-white">
                                <Users size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("invited")}</span>
                            <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.invited}</span>
                        </div>
                    </div>

                    {/* Earned Card */}
                    <div
                        onClick={() => router.push("/users/team")}
                        className="bg-white rounded-3xl p-4 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.15)] border border-emerald-50 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="relative flex flex-col items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center mb-3 text-white">
                                <Wallet size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t("earned")}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-slate-800 tracking-tight">{stats.earned}</span>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-yellow-400 blur-md opacity-40 animate-pulse"></div>
                                    <Coins
                                        size={24}
                                        className="text-yellow-500 fill-yellow-300 drop-shadow-[0_4px_4px_rgba(234,179,8,0.5)] animate-[bounce_3s_infinite]"
                                        strokeWidth={2.5}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Card */}
                <div className="w-full bg-white rounded-[2rem] p-5 shadow-[0_20px_60px_-15px_rgba(100,116,139,0.1)] border border-slate-100 relative mt-auto">
                    <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 mb-5 relative group cursor-pointer" onClick={handleCopy}>
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-50 shrink-0">
                            <Copy size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t("uniqueLink")}</p>
                            <p className="text-xs font-bold text-slate-800 truncate select-all">{referralLink}</p>
                        </div>
                        {copied && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-in fade-in slide-in-from-right-2">
                                {t("copied")}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons - Side by Side */}
                    <div className="flex items-center gap-3 w-full">
                        {/* Copy Button - Takes more space */}
                        <button
                            onClick={handleCopy}
                            className={`flex-1 h-14 rounded-2xl text-white font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]
                                ${copied
                                    ? "bg-emerald-500 shadow-emerald-500/25 hover:shadow-emerald-500/40"
                                    : "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-600/25 hover:shadow-blue-600/40 hover:scale-[1.02]"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    <span className="hidden sm:inline">{t("copied").toUpperCase()}</span>
                                    <span className="sm:hidden">{t("copied").toUpperCase()}</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={18} />
                                    <span className="hidden sm:inline">{t("copyLink")}</span>
                                    <span className="sm:hidden">{t("copy")}</span>
                                </>
                            )}
                        </button>

                        {/* Share Button - Icon Only with Black/Dark Style */}
                        <button
                            onClick={handleShare}
                            className="w-14 h-14 rounded-2xl bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-900/30 hover:shadow-slate-900/50 transition-all flex items-center justify-center active:scale-[0.98] hover:scale-[1.05] group"
                            aria-label="Share link"
                        >
                            <Share2 size={22} className="group-hover:rotate-12 transition-transform duration-300" strokeWidth={2.5} />
                        </button>
                    </div>

                    <p className="text-center mt-4 text-[10px] font-medium text-slate-400">
                        {t("terms")}
                    </p>
                </div>
            </main>
        </div>
    );
}

// Add custom keyframes for float animation in index.css if not present, or assume standard bounce-slow works.
// For now, I'll rely on tailwind arbitrary values or the provided 'animate-[...]' syntax which works in recent tailwind with JIT.
