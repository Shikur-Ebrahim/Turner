"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, MessageCircle, ExternalLink, ShieldCheck, Loader2 } from "lucide-react";

export default function ServicePage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState({
        channelLink: "",
        teamLink: ""
    });

    useEffect(() => {
        setMounted(true);
        const fetchLinks = async () => {
            try {
                const docRef = doc(db, "telegram_links", "active");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setLinks({
                        channelLink: docSnap.data().channelLink || "",
                        teamLink: docSnap.data().teamLink || ""
                    });
                }
            } catch (error) {
                console.error("Error fetching telegram links:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLinks();
    }, []);

    // Helper to format telegram link (handles @username or full link)
    const formatTG = (input: string) => {
        if (!input) return "#";
        if (input.startsWith("http")) return input;
        if (input.startsWith("@")) return `https://t.me/${input.substring(1)}`;
        return `https://t.me/${input}`;
    };

    const contactOptions = [
        {
            title: "Official Company",
            description: "Direct line to our main corporate account",
            image: "/logo.png",
            colorClass: "bg-emerald-600",
            shadowClass: "shadow-emerald-500/30",
            textClass: "text-emerald-600",
            glowClass: "bg-emerald-500/5",
            hoverGlowClass: "group-hover:bg-emerald-500/10",
            path: "/users/chat",
            label: "CHAT NOW"
        },
        {
            title: "Team Support",
            description: "Contact our dedicated team for assistance",
            image: "/telegram team.jpg",
            colorClass: "bg-purple-600",
            shadowClass: "shadow-purple-500/30",
            textClass: "text-purple-600",
            glowClass: "bg-purple-500/5",
            hoverGlowClass: "group-hover:bg-purple-500/10",
            link: formatTG(links.teamLink),
            label: "CONTACT TEAM"
        },
        {
            title: "Official Channel",
            description: "Stay updated with latest news and announcements",
            image: "/telegram.jpg",
            colorClass: "bg-blue-600",
            shadowClass: "shadow-blue-500/30",
            textClass: "text-blue-600",
            glowClass: "bg-blue-500/5",
            hoverGlowClass: "group-hover:bg-blue-500/10",
            link: formatTG(links.channelLink),
            label: "JOIN CHANNEL"
        }
    ];

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 backdrop-blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-32 -mb-32 backdrop-blur-3xl"></div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-40 px-6 py-6 flex items-center gap-4 border-b border-gray-100">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shadow-sm"
                >
                    <ChevronLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Customer Service</h1>
            </header>

            <main className="pt-28 px-6 max-w-md mx-auto space-y-8 pb-44">
                {/* Intro Section */}
                <div className="text-center space-y-3 px-4">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <MessageCircle size={36} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">How can we help?</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                        Connect with us through our official channels for 24/7 priority support
                    </p>
                </div>

                {/* Contact Options Grid */}
                <div className="space-y-5">
                    {contactOptions.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                try {
                                    if (option.path) {
                                        router.push(option.path);
                                    } else if (option.link) {
                                        window.open(option.link, "_blank", "noopener,noreferrer");
                                    }
                                } catch (e) {
                                    console.error("Navigation error:", e);
                                }
                            }}
                            className="group relative block w-full bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-gray-200 transition-all active:scale-[0.98] overflow-hidden"
                        >
                            {/* Accent Glow */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${option.glowClass} rounded-full blur-3xl -mr-16 -mt-16 ${option.hoverGlowClass} transition-colors`}></div>

                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-gray-100 shadow-sm relative overflow-hidden">
                                    <img
                                        src={encodeURI(option.image)}
                                        alt={option.title}
                                        className="w-10 h-10 object-contain relative z-10"
                                    />
                                    {/* Subtle inner background */}
                                    <div className="absolute inset-0 bg-gray-50 opacity-50"></div>
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-sm font-black text-gray-900 mb-0.5 uppercase tracking-wide">{option.title}</h3>
                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed max-w-[180px]">
                                        {option.description}
                                    </p>
                                </div>
                                <div className={`w-10 h-10 rounded-full ${option.colorClass} text-white flex items-center justify-center shadow-lg ${option.shadowClass} group-hover:translate-x-1 transition-transform`}>
                                    <ExternalLink size={18} />
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <span className={`text-[10px] font-black ${option.textClass} uppercase tracking-[0.2em]`}>
                                    {option.label}
                                </span>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                                            <div className="w-full h-full bg-gray-50 animate-pulse"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Trust Badge */}
                <div className="pt-6">
                    <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-0.5">Verified Corporate Support</h4>
                            <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest opacity-70">
                                100% Secure communication with encrypted protocols
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] px-10 leading-loose">
                    For your security, only use links from this official app section. We never ask for your password.
                </p>
            </main>
        </div>
    );
}
