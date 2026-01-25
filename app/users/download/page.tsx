"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Download,
    ChevronLeft,
    Smartphone,
    ShieldCheck,
    Zap,
    Star,
    Info,
    CheckCircle2,
    Loader2,
    Shield,
    Users,
    FileText,
    Share2,
    MoreVertical,
    Calendar,
    ShieldAlert
} from "lucide-react";
import { useEffect } from "react";

export default function DownloadAppPage() {
    const router = useRouter();

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstruction, setShowInstruction] = useState(false);
    const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed'>('idle');
    const [progress, setProgress] = useState(0);

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    useState(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    });

    const translations = {
        english: {
            appStore: "App Store",
            turnerApp: "Turner App",
            turnerOfficial: "Turner Official Digital",
            containsAds: "Contains ads • In-app purchases",
            reviews: "reviews",
            size: "Size",
            downloads: "Downloads",
            downloadApp: "Download App",
            verifying: "Verifying...",
            installing: "Installing...",
            finalizing: "Finalizing...",
            openApp: "Open App",
            verifiedByGoogle: "Verified by Google Play Protect",
            appScreenshots: "App Screenshots",
            viewAll: "View All",
            dashboard: "Dashboard",
            eliteConcept: "Elite Concept",
            premiumBranding: "Premium Branding",
            aboutThisApp: "About this app",
            appDescription: "Turner App is the premier destination for high-performance digital asset management and secure node operations. Designed for elite users who demand military-grade security and peak efficiency.",
            category: "Category",
            finance: "Finance",
            published: "Published",
            support: "Support",
            globalSupport: "24/7 Global",
            encryption: "Encryption",
            appInfo: "App info",
            version: "Version",
            updatedOn: "Updated on",
            requiredOS: "Required OS",
            offeredBy: "Offered by",
            releasedOn: "Released on",
            securityVerification: "Security Node Verification",
            securityMessage: "This application performs real-time encrypted data processing. Please ensure you have sufficient network stability for continuous node operations.",
            howToInstall: "How to Install",
            installInstructions: "in your browser menu, then select",
            addToHomeScreen: "\"Add to Home Screen\"",
            share: "Share",
            gotIt: "Got it"
        },
        amharic: {
            appStore: "የመተግበሪያ ማከማቻ",
            turnerApp: "ተርነር መተግበሪያ",
            turnerOfficial: "ተርነር ይፋዊ ዲጂታል",
            containsAds: "ማስታወቂያዎችን ይዟል • በመተግበሪያ ውስጥ ግዢዎች",
            reviews: "ግምገማዎች",
            size: "መጠን",
            downloads: "ማውረዶች",
            downloadApp: "መተግበሪያ አውርድ",
            verifying: "በማረጋገጥ ላይ...",
            installing: "በመጫን ላይ...",
            finalizing: "በማጠናቀቅ ላይ...",
            openApp: "መተግበሪያ ክፈት",
            verifiedByGoogle: "በGoogle Play Protect የተረጋገጠ",
            appScreenshots: "የመተግበሪያ ቅጽበታዊ ገጽ እይታዎች",
            viewAll: "ሁሉንም ይመልከቱ",
            dashboard: "ዳሽቦርድ",
            eliteConcept: "ልዩ ጽንሰ-ሀሳብ",
            premiumBranding: "ፕሪሚየም ብራንዲንግ",
            aboutThisApp: "ስለዚህ መተግበሪያ",
            appDescription: "የተርነር መተግበሪያ ለከፍተኛ አፈጻጸም ዲጂታል ንብረት አስተዳደር እና ደህንነቱ የተጠበቀ የኖድ ስራዎች ዋና መድረሻ ነው። ወታደራዊ ደረጃ ደህንነት እና ከፍተኛ ቅልጥፍና ለሚፈልጉ ልሂቃን ተጠቃሚዎች የተነደፈ።",
            category: "ምድብ",
            finance: "ፋይናንስ",
            published: "የታተመ",
            support: "ድጋፍ",
            globalSupport: "24/7 ዓለም አቀፍ",
            encryption: "ምስጠራ",
            appInfo: "የመተግበሪያ መረጃ",
            version: "ስሪት",
            updatedOn: "የዘመነው በ",
            requiredOS: "የሚፈለግ OS",
            offeredBy: "የቀረበው በ",
            releasedOn: "የተለቀቀው በ",
            securityVerification: "የደህንነት ኖድ ማረጋገጫ",
            securityMessage: "ይህ መተግበሪያ በእውነተኛ ጊዜ የተመሰጠረ የውሂብ ማቀናበር ያከናውናል። ለቀጣይ የኖድ ስራዎች በቂ የአውታረ መረብ መረጋጋት እንዳለዎት እባክዎ ያረጋግጡ።",
            howToInstall: "እንዴት መጫን እንደሚቻል",
            installInstructions: "በአሳሽዎ ምናሌ ውስጥ፣ ከዚያ ይምረጡ",
            addToHomeScreen: "\"ወደ መነሻ ገጽ ማያ ይጨምሩ\"",
            share: "አጋራ",
            gotIt: "ገባኝ"
        }
    };

    const t = (key: keyof typeof translations.english) => {
        return translations[language][key] || translations.english[key];
    };

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleDownload = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setInstallStatus('installing');

                // Simulate download/install progress
                let currentProgress = 0;
                const interval = setInterval(() => {
                    currentProgress += Math.floor(Math.random() * 5) + 2; // Random increment
                    if (currentProgress > 100) {
                        currentProgress = 100;
                        clearInterval(interval);
                        setTimeout(() => setInstallStatus('installed'), 500);
                    }
                    setProgress(currentProgress);
                }, 150); // Updates every 150ms
            }
        } else {
            // Fallback for when PWA is already installed or not supported
            // simulate install anyway for better UX if they click it (or show instruction)
            // Check if already installed (standalone mode)
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            if (isStandalone) {
                setInstallStatus('installed');
            } else {
                setShowInstruction(true);
            }
        }
    };


    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
            {/* Minimal App Header */}
            <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-gray-100/50 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all active:scale-95">
                        <ChevronLeft size={22} className="text-gray-900" />
                    </button>
                    <span className="text-sm font-black tracking-widest uppercase text-gray-900">{t("appStore")}</span>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-24">
                {/* Hero App Branding Section */}
                <section className="px-6 py-8 flex gap-6">
                    <div className="w-24 h-24 shrink-0 rounded-[1.5rem] bg-white border border-gray-100 p-4 shadow-xl shadow-gray-200/50 overflow-hidden relative group">
                        <img src="/app logo.png" alt="Turner App" className="w-full h-full object-contain relative z-10" />
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="flex flex-col justify-end pb-1">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-none mb-1.5">{t("turnerApp")}</h1>
                        <p className="text-sm font-bold text-emerald-600 mb-2">{t("turnerOfficial")}</p>
                        <p className="text-[11px] font-medium text-gray-400 tracking-wide">{t("containsAds")}</p>
                    </div>
                </section>

                {/* Play Store Statistical Metrics */}
                <section className="px-2">
                    <div className="flex items-center justify-around py-4 border-t border-b border-gray-50 bg-gray-50/30 rounded-3xl mx-4">
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                            <div className="flex items-center gap-0.5">
                                <span className="text-sm font-black">4.9</span>
                                <Star size={10} className="fill-gray-900 text-gray-900" />
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">12K {t("reviews")}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-gray-200"></div>
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                            <Download size={14} className="text-gray-900" />
                            <span className="text-sm font-black">32 MB</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{t("size")}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-gray-200"></div>
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                            <div className="w-4 h-4 rounded-sm border-[1.5px] border-gray-900 flex items-center justify-center">
                                <span className="text-[8px] font-black">3+</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">PEGI 3</span>
                        </div>
                        <div className="w-[1px] h-6 bg-gray-200"></div>
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                            <span className="text-sm font-black">500K+</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{t("downloads")}</span>
                        </div>
                    </div>
                </section>

                {/* Primary Action Section */}
                <section className="px-6 py-8">
                    {installStatus === 'idle' && (
                        <button
                            onClick={handleDownload}
                            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-emerald-200/60"
                        >
                            <Download size={22} className="text-white" />
                            <span className="text-lg font-black text-white tracking-widest uppercase">{t("downloadApp")}</span>
                        </button>
                    )}

                    {installStatus === 'installing' && (
                        <div className="w-full py-5 bg-gray-50 rounded-[1.5rem] border border-gray-200 relative overflow-hidden flex items-center justify-center shadow-inner">
                            <div
                                className="absolute inset-y-0 left-0 bg-emerald-100/50 transition-all duration-300 ease-linear"
                                style={{ width: `${progress}%` }}
                            ></div>
                            <div className="relative flex items-center gap-3 z-10">
                                <Loader2 size={22} className="text-emerald-600 animate-spin" />
                                <span className="text-lg font-black text-emerald-700 tracking-widest uppercase">
                                    {progress < 40 ? t("verifying") : progress < 80 ? t("installing") : t("finalizing")}
                                </span>
                                <span className="text-sm font-bold text-emerald-600/80 w-10 text-right">{progress}%</span>
                            </div>
                        </div>
                    )}

                    {installStatus === 'installed' && (
                        <button
                            onClick={() => router.push('/users/welcome')}
                            className="w-full py-5 bg-white border-2 border-emerald-600 hover:bg-emerald-50 active:scale-[0.97] transition-all rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-emerald-100/50"
                        >
                            <span className="text-lg font-black text-emerald-700 tracking-widest uppercase">{t("openApp")}</span>
                        </button>
                    )}

                    <div className="flex items-center gap-3 mt-6 px-3 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">{t("verifiedByGoogle")}</span>
                    </div>
                </section>


                {/* Visual Preview / Screenshots section */}
                <section className="mt-8 mb-10">
                    <div className="px-6 flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">{t("appScreenshots")}</h2>
                        <p className="text-xs font-bold text-emerald-600 tracking-widest uppercase">{t("viewAll")}</p>
                    </div>
                    <div className="flex gap-5 overflow-x-auto px-6 no-scrollbar pb-6">
                        {[
                            { id: 1, src: "/assets/preview_1.png", label: t("dashboard") },
                            { id: 2, src: "/assets/preview_2.png", label: t("eliteConcept") },
                            { id: 3, src: "/assets/preview_3.png", label: t("premiumBranding") }
                        ].map((item) => (
                            <div key={item.id} className="relative min-w-[220px] h-[380px] rounded-[2.5rem] bg-white border border-gray-200/60 shadow-2xl shadow-gray-200/50 overflow-hidden group active:scale-95 transition-transform duration-500">
                                <img
                                    src={item.src}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                    alt={item.label}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                        <span className="text-[9px] font-black text-white uppercase tracking-widest">{item.label}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* About the Application */}
                <section className="px-6 py-8 border-t border-gray-50 bg-gray-50/20">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">{t("aboutThisApp")}</h2>
                        <ChevronLeft size={20} className="text-gray-400 rotate-180" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                            {t("appDescription")}
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                            {[
                                { label: t("category"), val: t("finance") },
                                { label: t("published"), val: "2025" },
                                { label: t("support"), val: t("globalSupport") },
                                { label: t("encryption"), val: "AES-256" }
                            ].map((item, i) => (
                                <div key={i} className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                                    <p className="text-xs font-bold text-gray-800">{item.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* Additional App Information Section */}
                <section className="px-6 py-8 border-t border-gray-50 bg-gray-50/30">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-6">{t("appInfo")}</h2>
                    <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("version")}</p>
                            <p className="text-sm font-bold text-gray-800">2.4.1_stable</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("updatedOn")}</p>
                            <p className="text-sm font-bold text-gray-800">Dec 28, 2025</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("downloads")}</p>
                            <p className="text-sm font-bold text-gray-800">542,890+</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("requiredOS")}</p>
                            <p className="text-sm font-bold text-gray-800">Android 9.0+</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("offeredBy")}</p>
                            <p className="text-sm font-bold text-gray-800">Turner Official</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("releasedOn")}</p>
                            <p className="text-sm font-bold text-gray-800">May 12, 2024</p>
                        </div>
                    </div>
                </section>

                {/* Safety & Permissions Warning */}
                <section className="mx-6 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4 mt-10 shadow-sm shadow-amber-900/5">
                    <ShieldAlert size={28} className="text-amber-600 shrink-0" />
                    <div>
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">{t("securityVerification")}</h4>
                        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                            {t("securityMessage")}
                        </p>
                    </div>
                </section>
                {/* Install Instruction Modal */}
                {showInstruction && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowInstruction(false)}></div>
                        <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom border border-gray-100">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                                    <Download size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t("howToInstall")}</h3>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        Tap <Share2 size={14} className="inline mx-1" /> <strong>{t("share")}</strong> {t("installInstructions")} <br />
                                        <strong>{t("addToHomeScreen")}</strong>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowInstruction(false)}
                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest mt-4"
                                >
                                    {t("gotIt")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

        </div>
    );
}
