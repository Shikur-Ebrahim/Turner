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

export default function DownloadAppPage() {
    const router = useRouter();
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("idle"); // idle, starting, downloading, completed

    const handleDownload = () => {
        if (downloading) return;

        setDownloading(true);
        setStatus("starting");
        setProgress(0);

        setTimeout(() => {
            setStatus("downloading");
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setStatus("completed");
                        setDownloading(false);
                        // Redirect to hardware warning page after a short delay for visual confirmation
                        setTimeout(() => {
                            router.push("/users/download/warning");
                        }, 1000);
                        return 100;
                    }
                    const increment = Math.random() * 12;
                    return Math.min(prev + increment, 100);
                });
            }, 600);
        }, 1200);
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans">
            {/* Play Store Global Header */}
            <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-gray-100/50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-90">
                        <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 leading-none mb-0.5">Google Play</span>
                        <img src="/app logo.png" alt="Icon" className="w-5 h-5 object-contain" />
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2.5 hover:bg-gray-100 rounded-full transition-all text-gray-600">
                        <Share2 size={20} />
                    </button>
                    <button className="p-2.5 hover:bg-gray-100 rounded-full transition-all text-gray-600">
                        <MoreVertical size={20} />
                    </button>
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
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-none mb-1.5">Turner App</h1>
                        <p className="text-sm font-bold text-emerald-600 mb-2">Turner Official Digital</p>
                        <p className="text-[11px] font-medium text-gray-400 tracking-wide">Contains ads • In-app purchases</p>
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
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">12K reviews</span>
                        </div>
                        <div className="w-[1px] h-6 bg-gray-200"></div>
                        <div className="flex flex-col items-center gap-1 min-w-[70px]">
                            <Download size={14} className="text-gray-900" />
                            <span className="text-sm font-black">32 MB</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Size</span>
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
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Downloads</span>
                        </div>
                    </div>
                </section>

                {/* Primary Action Section */}
                <section className="px-6 py-8">
                    {status === "completed" ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 mb-6 flex items-center gap-5 animate-in zoom-in-95 duration-500 shadow-sm">
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md shadow-emerald-200/50">
                                <CheckCircle2 className="text-emerald-500" size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Installation Ready</h3>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Verified Package</p>
                            </div>
                            <button
                                onClick={() => setStatus("idle")}
                                className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl shadow-lg shadow-emerald-200"
                            >
                                OPEN
                            </button>
                        </div>
                    ) : downloading ? (
                        <div className="mb-8 space-y-4 px-2">
                            <div className="flex justify-between items-end">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black text-emerald-600 px-2 py-1 bg-emerald-50 rounded-lg inline-block uppercase tracking-[0.2em] mb-2">Installing...</p>
                                    <p className="text-lg font-black text-gray-900 tracking-tighter">{Math.floor(progress)}% <span className="text-gray-300 font-medium">/ 32.4 MB</span></p>
                                </div>
                                <Loader2 className="animate-spin text-emerald-600 mr-2" size={24} />
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                                <div
                                    className="h-full bg-emerald-600 transition-all duration-300 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)] relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute top-0 right-0 h-full w-20 bg-white/20 blur-md"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleDownload}
                            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-emerald-200/60"
                        >
                            <Download size={22} className="text-white" />
                            <span className="text-lg font-black text-white tracking-widest uppercase">Install</span>
                        </button>
                    )}

                    <div className="flex items-center gap-3 mt-6 px-3 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Verified by Google Play Protect</span>
                    </div>
                </section>


                {/* Visual Preview / Screenshots section */}
                <section className="mt-8 mb-10">
                    <div className="px-6 flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">App Screenshots</h2>
                        <p className="text-xs font-bold text-emerald-600 tracking-widest uppercase">View All</p>
                    </div>
                    <div className="flex gap-5 overflow-x-auto px-6 no-scrollbar pb-6">
                        {[
                            { id: 1, src: "/assets/preview_1.png", label: "Dashboard" },
                            { id: 2, src: "/assets/preview_2.png", label: "Elite Concept" },
                            { id: 3, src: "/assets/preview_3.png", label: "Premium Branding" }
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
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">About this app</h2>
                        <ChevronLeft size={20} className="text-gray-400 rotate-180" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                            Turner App is the premier destination for high-performance digital asset management and secure node operations. Designed for elite users who demand military-grade security and peak efficiency.
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                            {[
                                { label: "Category", val: "Finance" },
                                { label: "Published", val: "2025" },
                                { label: "Support", val: "24/7 Global" },
                                { label: "Encryption", val: "AES-256" }
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
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-6">App info</h2>
                    <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Version</p>
                            <p className="text-sm font-bold text-gray-800">2.4.1_stable</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Updated on</p>
                            <p className="text-sm font-bold text-gray-800">Dec 28, 2025</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Downloads</p>
                            <p className="text-sm font-bold text-gray-800">542,890+</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Required OS</p>
                            <p className="text-sm font-bold text-gray-800">Android 9.0+</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Offered by</p>
                            <p className="text-sm font-bold text-gray-800">Turner Official</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Released on</p>
                            <p className="text-sm font-bold text-gray-800">May 12, 2024</p>
                        </div>
                    </div>
                </section>

                {/* Safety & Permissions Warning */}
                <section className="mx-6 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4 mt-10 shadow-sm shadow-amber-900/5">
                    <ShieldAlert size={28} className="text-amber-600 shrink-0" />
                    <div>
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1">Security Node Verification</h4>
                        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                            This application performs real-time encrypted data processing. Please ensure you have sufficient network stability for continuous node operations.
                        </p>
                    </div>
                </section>
            </main>

        </div>
    );
}
