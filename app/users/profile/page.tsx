"use client";

// Optimized build fix for service grid types

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    orderBy,
    limit
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    ChevronLeft,
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    Users,
    Wallet,
    Loader2,
    Shield,
    Home,
    Ship,
    Award,
    DownloadCloud,
    FileText,
    Key,
    History,
    ChevronRight as ChevronRightIcon,
    LogOut,
    Lock,
    Zap,
    Coins,
    ArrowUp,
    TrendingDown,
    Activity,
    CreditCard,
    X,
    Send
} from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hasRuleUpdates, setHasRuleUpdates] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [telegramLinks, setTelegramLinks] = useState({ channel: "", team: "" });

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    useEffect(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    }, []);

    const toggleLanguage = (lang: "english" | "amharic") => {
        setLanguage(lang);
        localStorage.setItem("appLanguage", lang);
    };

    const translations = {
        english: {
            securityHub: "Security",
            member: "Client",
            etb: "ETB",
            vip: "VIP",
            digitalAssets: "Assets",
            availableBalance: "Balance",
            secureNode: "Node: Active",
            dataIntelligence: "Data",
            performanceAnalysis: "Performance",
            active: "Active",
            verified: "Verified",
            totalRecharge: "Total Deposit",
            teamIncome: "Team Income",
            totalIncome: "Total Income",
            totalWithdrawal: "Total Withdrawal",
            teamSize: "Team Size",
            todayIncome: "Today's Income",
            fund: "Fund",
            download: "Download",
            bank: "Bank",
            service: "Support",
            systemManagement: "System",
            fundingDetails: "Funding",
            transactionLogs: "Logs",
            withdrawalRecord: "Withdrawal Record",
            paymentStatus: "Status",
            loginPassword: "Login Password",
            securityProtocols: "Security",
            withdrawalPassword: "Withdraw Password",
            assetProtection: "Protection",
            rechargeRecord: "Deposit Record",
            creditAnalysis: "Record",
            endSession: "End Session",
            officialChannel: "Official Channel",
            teamSupport: "Team Support",
            joinChannel: "Join Channel",
            contactTeam: "Contact Team",
            supportHub: "Support Center",
            supportDesc: "Connect with our official channels for assistance"
        },
        amharic: {
            securityHub: "የደህንነት ማዕከል",
            member: "አባል",
            etb: "ብር",
            vip: "ቪ.አይ.ፒ",
            digitalAssets: "ዲጂታል ንብረቶች",
            availableBalance: "ያለዎት ሂሳብ",
            secureNode: "ደህንነቱ የተጠበቀ",
            dataIntelligence: "የመረጃ ትንተና",
            performanceAnalysis: "የአፈጻጸም ትንተና",
            active: "ንቁ",
            verified: "የተረጋገጠ",
            totalRecharge: "ጠቅላላ የተሞላ",
            teamIncome: "የቡድን ገቢ",
            totalIncome: "ጠቅላላ ገቢ",
            totalWithdrawal: "ጠቅላላ ወጪ",
            teamSize: "የቡድን ብዛት",
            todayIncome: "የዛሬ ገቢ",
            fund: "ፈንድ",
            download: "አውርድ",
            bank: "ባንክ",
            service: "ድጋፍ",
            systemManagement: "የስርዓት አስተዳደር",
            fundingDetails: "የገንዘብ ዝርዝሮች",
            transactionLogs: "የግብይት መዝገቦች",
            withdrawalRecord: "የወጪ መዝገብ",
            paymentStatus: "የክፍያ ሁኔታ",
            loginPassword: "የመግቢያ የይለፍ ቃል",
            securityProtocols: "የደህንነት ፕሮቶኮሎች",
            withdrawalPassword: "የወጪ የይለፍ ቃል",
            assetProtection: "የንብረት ጥበቃ",
            rechargeRecord: "የሞሉት መዝገብ",
            creditAnalysis: "የሂሳብ ትንተና",
            endSession: "ዛግተው ይውጡ",
            officialChannel: "ይፋዊ ቻናል",
            teamSupport: "የቡድን ድጋፍ",
            joinChannel: "ቻናል ይቀላቀሉ",
            contactTeam: "ቡድንን ያነጋግሩ",
            supportHub: "የድጋፍ ማዕከል",
            supportDesc: "ለእርዳታ ከይፋዊ ቻናሎቻችን ጋር ይገናኙ"
        }
    };

    const t = (key: keyof typeof translations.english) => {
        return translations[language][key] || translations.english[key];
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            // Real-time subscription to user data
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeData = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setUserData(doc.data());
                }
                setLoading(false);
            });

            return () => unsubscribeData();
        });

        return () => unsubscribeAuth();
    }, [router]);

    useEffect(() => {
        if (!userData) return;

        const q = query(collection(db, "rules"), orderBy("updatedAt", "desc"), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const latestRule = snapshot.docs[0].data();
                const lastUpdate = latestRule.updatedAt?.toMillis() || 0;

                // Track per-category updates if needed, but for profile badge, any update counts
                const lastViewedAt = userData.lastRulesViewedAt?.toMillis() || 0;

                if (lastUpdate > lastViewedAt) {
                    setHasRuleUpdates(true);
                } else {
                    setHasRuleUpdates(false);
                }
            }
        }, (error) => {
            console.error("Error listening to rules updates:", error);
        });

        return () => unsubscribe();
    }, [userData]);
 
    useEffect(() => {
        const fetchTelegramLinks = async () => {
            try {
                const docRef = doc(db, "telegram_links", "active");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setTelegramLinks({
                        channel: docSnap.data().channelLink || "",
                        team: docSnap.data().teamLink || ""
                    });
                }
            } catch (error) {
                console.error("Error fetching telegram links:", error);
            }
        };
        fetchTelegramLinks();
    }, []);


    // Format phone number: 251***44444
    const formatPhone = (phone: string) => {
        if (!phone) return "N/A";
        if (phone.length < 7) return phone;
        return `${phone.substring(0, 3)}***${phone.substring(phone.length - 5)}`;
    };

    const stats = [
        { label: t("totalRecharge"), value: userData?.totalRecharge || "0.00", icon: CreditCard, image: "/assets/recharge.png", color: "blue", trend: "+2.4%", category: "wallet" },
        { label: t("teamIncome"), value: userData?.teamIncome || "0.00", icon: Users, image: "/assets/invite.png", color: "purple", trend: "+15.8%", filter: "hue-rotate(240deg) saturate(1.5)", category: "team" },
        { label: t("totalIncome"), value: userData?.totalIncome || "0.00", icon: TrendingUp, image: "/assets/buy_product.png", color: "emerald", trend: "+8.2%", category: "earnings" },
        { label: t("totalWithdrawal"), value: userData?.totalWithdrawal || "0.00", icon: ArrowUpRight, image: "/assets/withdrawal.png", color: "orange", trend: "0.0%", category: "wallet" },
        { label: t("teamSize"), value: userData?.teamSize || "0", icon: Users, color: "indigo", trend: "+1", category: "team" },
        { label: t("todayIncome"), value: userData?.dailyIncome || "0.00", icon: Zap, image: "/assets/recharge.png", color: "amber", filter: "hue-rotate(300deg) saturate(2)", trend: "+24.3%", category: "earnings" },
    ];

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            {/* Premium Mobile Header - Immersive Style */}
            <header className="fixed top-0 left-0 right-0 z-[60] px-6 pt-12 pb-6 bg-gradient-to-b from-blue-700 via-blue-600/90 to-transparent backdrop-blur-[2px]">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-transform"
                    >
                        <ChevronLeft className="text-white" size={24} />
                    </button>
                    <h1 className="text-lg font-black text-white tracking-[0.2em]">{t("securityHub")}</h1>
                    <div className="w-10"></div> {/* Spacer for balance */}
                </div>
            </header>

            <main className="relative z-10 pt-32 bg-white rounded-t-[3.5rem] min-h-screen p-6 pb-48 overflow-hidden shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                {/* Decorative background pulse */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-100 to-transparent"></div>
                {/* Advanced Profile Header & Identity Card */}
                <div className="relative mb-8 group">
                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>

                    <div className="relative flex items-center gap-5 p-2">
                        {/* Premium Avatar with Double-Ring Glow */}
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full blur-md opacity-20"></div>
                            <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-br from-blue-500 via-indigo-400 to-blue-600 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                <div className="w-full h-full rounded-full bg-white p-1">
                                    <div className="w-full h-full rounded-full overflow-hidden relative border border-gray-100">
                                        <img
                                            src="/avator profile.jpg"
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Online Pulse Indicator */}
                                        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-emerald-500 border-[3px] border-white rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Identity Details */}
                        <div className="flex-1 space-y-1.5 overflow-hidden">
                            <div className="space-y-0">
                                <h2 className="text-2xl font-black text-gray-900 leading-tight tracking-tight truncate">{t("member")}</h2>
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                                <p className="text-lg font-black text-gray-900 tracking-tighter">
                                    {formatPhone(userData?.phoneNumber || "25100000000")}
                                </p>
                            </div>
                        </div>

                        {/* Status Badges - Glassmorphic Style */}
                        <div className="flex flex-col items-end gap-2.5">
                            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-gray-100/50">
                                <img src="/Ethiopia.png" alt="Ethiopia" className="w-5 h-3.5 object-cover rounded-sm" />
                                <span className="text-[9px] font-black text-gray-800 tracking-widest leading-none">ETH</span>
                            </div>
                            <div className="flex items-center gap-2 bg-gradient-to-br from-amber-500 to-orange-600 px-3 py-1.5 rounded-2xl shadow-lg shadow-orange-500/20 border border-orange-400/30">
                                <Shield size={10} className="text-white fill-current" />
                                <span className="text-[10px] font-black text-white tracking-tighter leading-none">{t("vip")} {userData?.vip || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Elite Balance Card - Advanced Visual Centerpiece */}
                <div className="relative mb-12 group">
                    {/* Animated Accent Light */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>

                    <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-950/20 overflow-hidden">
                        {/* Advanced Textures */}
                        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: `radial-gradient(#ffffff 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-white/40 tracking-widest pl-1">{t("availableBalance")}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <Coins size={20} className="text-blue-300" />
                                </div>
                            </div>

                            <div className="flex items-baseline gap-3 px-1">
                                <span className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
                                    {userData?.balance?.toLocaleString() || "0.00"}
                                </span>
                                <span className="text-base font-black text-blue-400 tracking-widest">ETB</span>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Data Analytics Hub - Premium Highlighted Section */}
                <div className="relative mb-14">
                    {/* Atmospheric Glow Orbs */}
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s' }}></div>

                    <div className="relative bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/50 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.1)] overflow-hidden">
                        {/* Mesh Grid Overlay */}
                        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `radial-gradient(#2563eb 0.5px, transparent 0.5px)`, backgroundSize: '16px 16px' }}></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10 px-1">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]"></div>
                                        <h3 className="text-sm font-black text-gray-900 tracking-[0.2em] leading-none">{t("dataIntelligence")}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-y-12 gap-x-5">
                                {stats.map((stat, i) => (
                                    <div key={i} className="flex flex-col gap-4 group active:scale-95 transition-all">
                                        <div className="flex flex-col gap-2.5 items-center text-center">
                                            <div className="w-14 h-14 relative group-hover:scale-110 transition-all duration-300">
                                                {stat.image && stat.label !== "Team Size" ? (
                                                    <img
                                                        src={stat.image}
                                                        alt={stat.label}
                                                        className="w-full h-full object-contain drop-shadow-[0_5px_10px_rgba(0,0,0,0.12)]"
                                                        style={stat.filter ? { filter: stat.filter } : undefined}
                                                    />
                                                ) : (
                                                    /* Enhanced 3D Silhouette for Team Size */
                                                    <div className="w-full h-full relative flex items-center justify-center">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl shadow-lg shadow-indigo-500/20 overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 skew-y-12 -translate-y-4"></div>
                                                            <div className="absolute top-1 left-2 w-2 h-2 rounded-full bg-white/40 blur-[1px]"></div>
                                                        </div>
                                                        <Users size={24} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-black text-gray-400 tracking-tighter leading-none">{stat.label}</span>
                                        </div>
                                        <div className="space-y-1.5 text-center px-1">
                                            <p className="text-xl font-black text-gray-900 tracking-tighter leading-none break-all drop-shadow-sm">
                                                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                                            </p>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"></div>
                                                <span className="text-[8px] font-black text-blue-500/60 tracking-widest">{t("verified")}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Core Services - Interaction Grid */}
                <div className="grid grid-cols-4 gap-4 mb-12">
                    {[
                        { label: t("fund"), icon: Wallet, color: "blue", iconColor: "text-blue-600", path: "/users/funding-details", dark: false, image: null },
                        { label: t("download"), image: "/app logo.png", color: "indigo", iconColor: "text-white", path: "/users/download", dark: false, icon: null },
                        { label: t("bank"), image: "/bank_icon.png", color: "emerald", iconColor: "text-emerald-600", path: "/users/bank", dark: false, icon: null },
                        { label: t("service"), image: "/service_icon.png", color: "purple", iconColor: "text-purple-600", onClick: () => setShowSupportModal(true), dark: false, icon: null },
                    ].map((item: any, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (item.onClick) {
                                    item.onClick();
                                } else if (item.path) {
                                    router.push(item.path);
                                }
                            }}
                            className="flex flex-col items-center gap-2.5 group"
                        >
                            <div className={`w-16 h-16 rounded-[1.5rem] bg-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center justify-center relative overflow-hidden group-hover:scale-110 group-active:scale-95 transition-all duration-300`}>
                                {/* Inner Gradient Accent */}
                                <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                <div className={`w-full h-full flex items-center justify-center relative z-10 ${item.image ? "" : `w-11 h-11 rounded-2xl ${item.dark ? `bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30` : `bg-${item.color}-50`}`}`}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.label} className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500" />
                                    ) : item.icon ? (
                                        <item.icon size={22} className={item.dark ? "text-white" : item.iconColor} />
                                    ) : null}

                                    {/* Red Notification Dot Removed */}
                                </div>
                            </div>
                            <span className="text-[9px] font-black text-gray-500 tracking-widest text-center leading-none">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Advanced System Actions - Navigtion Tiles */}
                <div className="space-y-4 pb-12">
                    <div className="flex items-center gap-3 mb-6 px-1">
                        <div className="w-1.5 h-4 bg-gray-900 rounded-full"></div>
                        <h3 className="text-[10px] font-black text-gray-900 tracking-[0.3em]">{t("systemManagement")}</h3>
                    </div>

                    {[
                        { title: t("withdrawalRecord"), sub: t("paymentStatus"), icon: ArrowUpRight, color: "emerald", path: "/users/withdrawal-record" },
                        { title: t("loginPassword"), sub: t("securityProtocols"), icon: Key, color: "purple", path: "/users/change-password" },
                        { title: t("withdrawalPassword"), sub: t("assetProtection"), icon: Lock, color: "indigo", path: "/users/change-withdrawal-password" },
                        { title: t("rechargeRecord"), sub: t("creditAnalysis"), icon: History, color: "orange", path: "/users/recharge-records" },
                    ].map((item, i) => (
                        <button
                            key={i}
                            onClick={() => item.path && router.push(item.path)}
                            className="w-full relative group active:scale-[0.98] transition-all"
                        >
                            <div className="absolute -inset-2 bg-gradient-to-r from-gray-100 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative flex items-center justify-between p-5 bg-white rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-gray-200/40 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 flex items-center justify-center text-${item.color}-600 relative overflow-hidden`}>
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-white opacity-40 blur-sm rounded-full -mr-1 -mt-1"></div>
                                        <item.icon size={22} className="relative z-10" />
                                    </div>
                                    <div className="text-left space-y-0.5">
                                        <h3 className="text-sm font-black text-gray-900 tracking-tight">{item.title}</h3>
                                        <p className="text-[9px] font-bold text-blue-500/60 tracking-widest">{item.sub}</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                    <ChevronRightIcon size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </button>
                    ))}

                    {/* Language Toggle */}
                    <div className="flex justify-center pt-4">
                        <div className="flex bg-gray-100 rounded-full p-1 border border-red-100 shadow-sm">
                            <button
                                onClick={() => toggleLanguage('english')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${language === 'english' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                <img src="/Flag_of_the_United_States.png" alt="EN" className="w-4 h-3 object-contain" />
                                EN
                            </button>
                            <button
                                onClick={() => toggleLanguage('amharic')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${language === 'amharic' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                <img src="/Ethiopia.png" alt="AM" className="w-4 h-3 object-contain" />
                                AM
                            </button>
                        </div>
                    </div>

                    {/* Premium Security Exit Button */}
                    <div className="pt-6">
                        <button
                            onClick={async () => {
                                await auth.signOut();
                                router.push("/");
                            }}
                            className="w-full relative group overflow-hidden rounded-[2.5rem] p-6 active:scale-95 transition-all shadow-[0_20px_40px_-15px_rgba(239,68,68,0.2)]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 group-hover:scale-105 transition-transform"></div>
                            <div className="relative z-10 flex items-center justify-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <LogOut size={20} className="text-white" />
                                </div>
                                <span className="text-lg font-black text-white tracking-[0.2em]">{t("endSession")}</span>
                            </div>
                            {/* Decorative highlights */}
                            <div className="absolute top-0 right-0 w-32 h-full bg-white/10 skew-x-[45deg] translate-x-32 group-hover:translate-x-[-150%] transition-transform duration-1000"></div>
                        </button>
                    </div>
                </div>
            </main>

            {/* Premium Support Modal */}
            {showSupportModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowSupportModal(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto invisible-scrollbar">
                        <button
                            onClick={() => setShowSupportModal(false)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center space-y-6 mb-8">
                            <div className="w-20 h-20 bg-indigo-600 rounded-[2.2rem] mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/30 transform rotate-3">
                                <Send size={32} className="text-white" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t("supportHub")}</h3>
                                <p className="text-xs text-gray-400 font-bold leading-relaxed px-4">
                                    {t("supportDesc")}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => telegramLinks.channel && window.open(telegramLinks.channel.startsWith("http") ? telegramLinks.channel : `https://t.me/${telegramLinks.channel.replace("@", "")}`, "_blank")}
                                className="group w-full p-5 bg-blue-50 hover:bg-blue-100 rounded-[2rem] border border-blue-100 transition-all flex items-center gap-5 active:scale-95"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <Send size={20} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-sm font-black text-gray-900">{t("officialChannel")}</h4>
                                    <p className="text-[10px] text-blue-600 font-bold">{t("joinChannel")}</p>
                                </div>
                            </button>

                            <button
                                onClick={() => telegramLinks.team && window.open(telegramLinks.team.startsWith("http") ? telegramLinks.team : `https://t.me/${telegramLinks.team.replace("@", "")}`, "_blank")}
                                className="group w-full p-5 bg-indigo-50 hover:bg-indigo-100 rounded-[2rem] border border-indigo-100 transition-all flex items-center gap-5 active:scale-95"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                    <Users size={20} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-sm font-black text-gray-900">{t("teamSupport")}</h4>
                                    <p className="text-[10px] text-indigo-600 font-bold">{t("contactTeam")}</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
