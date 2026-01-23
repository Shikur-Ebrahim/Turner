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
                    <div className="w-full aspect-[16/10] relative">
                        <img src={notif.imageUrl} alt={notif.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
                    </div>
                ) : (
                    <div className="pt-20 pb-10 flex flex-col items-center bg-slate-50/50">
                        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-indigo-600 relative shadow-xl shadow-indigo-600/10 border border-slate-100">
                            <div className="absolute inset-0 bg-indigo-500/10 rounded-[2rem] animate-ping opacity-20"></div>
                            <Bell size={40} className="relative z-10" />
                        </div>
                    </div>
                )}

                <div className={`px-8 pb-8 space-y-6 text-center relative z-10 ${notif.imageUrl ? "-mt-16" : "mt-0"}`}>
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <span className="px-4 py-1.5 bg-indigo-600/10 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 border border-indigo-600/10 backdrop-blur-sm">
                                <Zap size={10} className="fill-indigo-600" />
                                {notif.type || 'Platform Update'}
                            </span>
                        </div>

                        <div className="max-h-[35vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight mb-3">{notif.title}</h2>
                            <p className="text-slate-500 text-[13px] font-medium leading-relaxed text-justify">
                                {notif.content}
                            </p>
                        </div>
                    </div>

                    <div className="w-full pt-2">
                        <div className="flex flex-col items-center gap-1 group/brand">
                            <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.5em] group-hover/brand:text-indigo-600 transition-colors">Turner Enterprise Protocol</p>
                            <div className="w-8 h-0.5 bg-slate-100 rounded-full group-hover/brand:w-12 transition-all group-hover/brand:bg-indigo-600"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
