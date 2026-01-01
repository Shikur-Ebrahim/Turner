"use client";

import { useRouter } from "next/navigation";
import {
    ShieldAlert,
    Monitor,
    Smartphone,
    ChevronLeft,
    Zap,
    Cpu,
    Layers,
    Lock,
    Globe
} from "lucide-react";

export default function CompatibilityWarningPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-8 flex items-center justify-between bg-black/50 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">System Protocol: 8.4.1</span>
                </div>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 pt-28 pb-32 px-5 max-w-lg mx-auto w-full relative">
                {/* Background Glows */}
                <div className="absolute top-40 -left-10 w-48 h-48 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute bottom-40 -right-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                {/* Warning Badge */}
                <div className="flex justify-center mb-6">
                    <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2.5">
                        <ShieldAlert size={14} className="text-red-500" />
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Global Hardware Restriction</span>
                    </div>
                </div>

                <div className="text-center space-y-3 mb-10">
                    <h1 className="text-3xl font-black tracking-tighter leading-none">
                        ADVANCED <span className="text-blue-500">COMPATIBILITY</span>
                    </h1>
                    <p className="text-[12px] text-gray-400 font-medium leading-relaxed max-w-[280px] mx-auto opacity-80">
                        The Turner Security Node has detected hardware limitations on your current terminal.
                    </p>
                </div>

                {/* Hardware List Sections - Optimized for Mobile Flow */}
                <div className="space-y-6">
                    {/* Laptop Section */}
                    <div className="relative group overflow-hidden bg-white/5 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-all duration-300">
                        <div className="flex flex-col p-5 gap-4">
                            <div className="flex items-center gap-4">
                                {/* Image Container */}
                                <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                    <img
                                        src="/Luvaglio Laptop.jpg"
                                        alt="Luvaglio Laptop"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                </div>

                                <div className="space-y-0.5">
                                    <h3 className="text-base font-black tracking-tight uppercase">Master Node</h3>
                                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.2em] leading-none mb-1">Luvaglio High-End</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Full Support</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed italic opacity-70">
                                Recommended for complex cloud mining and high-speed data encryption.
                            </p>
                        </div>
                    </div>

                    {/* Mobile Section */}
                    <div className="relative group overflow-hidden bg-white/5 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all duration-300">
                        <div className="flex flex-col p-5 gap-4">
                            <div className="flex items-center gap-4">
                                {/* Image Container */}
                                <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black">
                                    <img
                                        src="/Falcon Supernova iPhone 6 Pink Diamond.jpg"
                                        alt="Falcon iPhone"
                                        className="w-full h-full object-contain p-1"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-1 right-2 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,1)] animate-pulse"></div>
                                </div>

                                <div className="space-y-0.5">
                                    <h3 className="text-base font-black tracking-tight uppercase">Limited Terminal</h3>
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1">Falcon Elite Device</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></div>
                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Throttled Access</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed italic opacity-70">
                                Mobile node operations are restricted for certified hardware only.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Important Warning Box - Optimized for Mobile Contrast */}
                <div className="mt-10 p-5 bg-red-500/5 rounded-[2rem] border border-red-500/10 relative overflow-hidden">
                    <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-2.5">
                            <Lock size={14} className="text-red-500" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">System Protocol Restricted</h4>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                            Turner App operations are prioritized for laptop terminals. Your current device may be subject to security verification.
                        </p>
                    </div>
                </div>

                {/* Fixed Bottom Action Area for Better Mobile Usability */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 z-40">
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={() => router.push('/users/welcome')}
                            className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.96] transition-all rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20"
                        >
                            <span className="text-[11px] font-black text-white tracking-[0.25em] uppercase">Acknowledge & Sync</span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4 opacity-30 pb-12">
                    <div className="flex items-center gap-1.5">
                        <Layers size={12} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Secure</span>
                    </div>
                    <div className="w-[1px] h-2 bg-white/20"></div>
                    <div className="flex items-center gap-1.5">
                        <Globe size={12} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Global</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
