"use client";

import { useEffect, useState } from "react";
import { X, Bell, ChevronRight, Zap } from "lucide-react";

interface PlatformNotificationModalProps {
    notif: {
        id: string;
        title: string;
        content: string;
        imageUrl?: string;
        type?: string;
    };
    onClose: () => void;
}

export default function PlatformNotificationModal({ notif, onClose }: PlatformNotificationModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-xl transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <div className={`w-full max-w-sm bg-white rounded-[3.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 transition-all duration-500 relative ${isVisible ? "scale-100 translate-y-0" : "scale-90 translate-y-10"}`}>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none"></div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90 z-20"
                >
                    <X size={20} />
                </button>

                {/* Image Section */}
                {notif.imageUrl ? (
                    <div className="w-full aspect-[16/10] relative">
                        <img src={notif.imageUrl} alt={notif.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                    </div>
                ) : (
                    <div className="pt-16 pb-8 flex flex-col items-center">
                        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 relative">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-[2.5rem] animate-ping opacity-25"></div>
                            <Bell size={48} className="relative z-10" />
                        </div>
                    </div>
                )}

                <div className="px-10 pb-10 pt-4 space-y-6 text-center">
                    <div className="space-y-3">
                        <div className="flex justify-center">
                            <span className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1.5 shadow-lg shadow-indigo-600/20">
                                <Zap size={10} />
                                {notif.type || 'Platform Update'}
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{notif.title}</h2>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed">
                            {notif.content}
                        </p>
                    </div>

                    <div className="w-full space-y-4 pt-2">
                        <button
                            onClick={handleClose}
                            className="w-full h-18 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 group py-5"
                        >
                            <span>Continue Profile</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Official Turner Broadcast</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
