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
        // Track the view permanently for this session/user
        const viewedData = JSON.parse(localStorage.getItem(`p_notif_v3_${notif.id}`) || '{"count": 0}');
        localStorage.setItem(`p_notif_v3_${notif.id}`, JSON.stringify({ count: viewedData.count + 1 }));
        setTimeout(onClose, 300);
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-xl transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            <div className={`w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 transition-all duration-500 relative ${isVisible ? "scale-100 translate-y-0" : "scale-90 translate-y-10"}`}>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none"></div>

                {/* Header Close Section (Overlay) */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-end z-[60]">
                    <button
                        onClick={handleClose}
                        className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all active:scale-90 shadow-xl group"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Image Section */}
                {notif.imageUrl ? (
                    <div className="w-full aspect-[4/5] relative">
                        <img src={notif.imageUrl} alt={notif.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                    </div>
                ) : (
                    <div className="pt-24 pb-12 flex flex-col items-center bg-slate-50">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-indigo-600 relative shadow-2xl shadow-indigo-600/10 border border-slate-100">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-[2.5rem] animate-ping opacity-25"></div>
                            <Bell size={48} className="relative z-10" />
                        </div>
                    </div>
                )}

                <div className={`px-10 pb-10 space-y-8 text-center relative z-10 ${notif.imageUrl ? "-mt-24" : "mt-0"}`}>
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <span className="px-5 py-2 bg-indigo-600/10 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 border border-indigo-600/10">
                                <Zap size={12} className="fill-indigo-600" />
                                {notif.type || 'Platform Update'}
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-[0.9]">{notif.title}</h2>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-4">
                            {notif.content}
                        </p>
                    </div>

                    <div className="w-full space-y-4 pt-2">
                        <button
                            onClick={handleClose}
                            className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_-12px_rgba(15,23,42,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 group"
                        >
                            <span>Dismiss Notification</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="flex flex-col items-center gap-1 group/brand">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] group-hover/brand:text-indigo-600 transition-colors">Turner Enterprise</p>
                            <div className="w-4 h-0.5 bg-slate-100 rounded-full group-hover/brand:w-8 transition-all group-hover/brand:bg-indigo-600"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
