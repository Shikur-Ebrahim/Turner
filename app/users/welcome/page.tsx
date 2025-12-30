"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
    Home,
    Wallet,
    Ship,
    Users,
    Bell,
    TrendingUp,
    Loader2,
    Shield
} from "lucide-react";

export default function WelcomePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeNav, setActiveNav] = useState("home");
    const [banners, setBanners] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        // Handle tab selection from URL search params
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab && ['home', 'product', 'team', 'wallet'].includes(tab)) {
                setActiveNav(tab);
            }
        }
    }, []);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        });

        // Fetch banners and notifications once
        const qBanners = query(collection(db, "banners"), orderBy("createdAt", "desc"));
        const unsubscribeBanners = onSnapshot(qBanners, (snapshot) => {
            const bannerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBanners(bannerData);
        });

        const qNotifs = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
        const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
            const notifData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifData);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeBanners();
            unsubscribeNotifs();
        };
    }, [router]);

    // Separate effect for banner interval to avoid redundant subscriptions
    useEffect(() => {
        if (banners.length <= 1) return;

        const bannerInterval = setInterval(() => {
            setCurrentBannerIndex((prev) => prev + 1);
        }, 2000);

        return () => clearInterval(bannerInterval);
    }, [banners.length]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl z-40 px-6 py-4 flex items-center justify-between border-b border-gray-100/50 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 relative">
                        <img src="/logo.png" alt="Turner Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium leading-none">Welcome back,</p>
                        <p className="text-sm font-bold text-gray-900">{userData?.email?.split('@')[0] || "User"}</p>
                    </div>
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 relative">
                    <Bell size={20} className="text-gray-600" />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                </button>
            </header>

            <main className="pt-24 px-6 space-y-8 pb-10">
                {activeNav === "home" ? (
                    <>
                        {/* Seamless Infinite Auto-Sliding Banner Section */}
                        {banners.length > 0 && (
                            <section className="relative group">
                                <div className="w-full aspect-[16/9] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-purple-900/10 border border-gray-100 relative bg-gray-50">
                                    <div
                                        className="flex h-full"
                                        style={{
                                            transform: `translateX(-${currentBannerIndex * 100}%)`,
                                            transition: isResetting ? 'none' : 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                        onTransitionEnd={() => {
                                            if (currentBannerIndex >= banners.length) {
                                                setIsResetting(true);
                                                setCurrentBannerIndex(0);
                                                // Minimal timeout to allow the browser to process the instant jump before re-enabling transition
                                                setTimeout(() => setIsResetting(false), 50);
                                            }
                                        }}
                                    >
                                        {/* Original Banners + Clone of First Banner at the end */}
                                        {[...banners, banners[0]].map((banner, index) => (
                                            <div key={index} className="min-w-full h-full relative flex-shrink-0">
                                                <img
                                                    src={banner?.url}
                                                    alt="Banner"
                                                    className="w-full h-full object-cover"
                                                    loading={index === 0 ? "eager" : "lazy"}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Carousel Indicators */}
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 pointer-events-none">
                                        {banners.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 rounded-full transition-all duration-300 ${(currentBannerIndex % banners.length) === i ? "w-6 bg-white shadow-lg" : "w-1.5 bg-white/40"
                                                    }`}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Seamless Infinite Withdrawal Notifications Marquee */}
                        {notifications.length > 0 && (
                            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 overflow-hidden relative">
                                <div className="bg-blue-50 p-2 rounded-xl text-blue-600 relative z-20 shadow-sm border border-blue-50 shrink-0">
                                    <Bell size={18} className="animate-bounce" />
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    {/* Side fades for premium look */}
                                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                                    <div className="flex flex-nowrap gap-12 animate-horizontal-scroll whitespace-nowrap w-max min-w-full py-1">
                                        {/* Multiplying items to ensure the marquee is dense and hard to track */}
                                        {[...notifications, ...notifications, ...notifications].map((notif, i) => (
                                            <div key={i} className="flex items-center gap-2 shrink-0">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0"></span>
                                                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{notif.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}



                        {/* Elite 5-Card Interactive Action Grid (2+3 Layout) */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 px-1">
                                <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Main Operations</h3>
                            </div>

                            {/* Top Row: 2 Premium Cards */}
                            <div className="grid grid-cols-2 gap-5">
                                <button className="relative bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-2xl transition-all active:scale-95 group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-orange-400/10 transition-colors"></div>
                                    <div className="w-20 h-20 relative group-hover:scale-110 transition-transform duration-500">
                                        <img src="/assets/recharge.png" alt="Recharge" className="w-full h-full object-contain drop-shadow-[0_12px_20px_rgba(249,115,22,0.25)]" />
                                    </div>
                                    <span className="text-xs font-black text-gray-900 tracking-[0.1em] uppercase">RECHARGE</span>
                                </button>

                                <button className="relative bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-2xl transition-all active:scale-95 group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-400/10 transition-colors"></div>
                                    <div className="w-20 h-20 relative group-hover:scale-110 transition-transform duration-500">
                                        <img src="/assets/buy_product.png" alt="Buy Product" className="w-full h-full object-contain drop-shadow-[0_12px_20px_rgba(16,185,129,0.25)]" />
                                    </div>
                                    <span className="text-xs font-black text-gray-900 tracking-[0.1em] uppercase leading-none text-center">BUY PRODUCT</span>
                                </button>
                            </div>

                            {/* Bottom Row: 3 Elite Mini Nodes */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: "INVITE", img: "/assets/invite.png", color: "blue" },
                                    { label: "WITHDRAW", img: "/assets/withdrawal.png", color: "indigo" },
                                    { label: "TASKS", icon: TrendingUp, color: "amber", special: true }
                                ].map((item: any, i: number) => (
                                    <button key={i} className="bg-white rounded-[2rem] p-5 flex flex-col items-center justify-center gap-3 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.07)] border border-gray-100 hover:shadow-xl transition-all active:scale-95 group relative overflow-hidden">
                                        <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-500/[0.03] to-transparent`}></div>
                                        <div className="w-14 h-14 relative group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
                                            {item.img ? (
                                                <img src={item.img} alt={item.label} className="w-full h-full object-contain drop-shadow-md" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shadow-inner relative">
                                                    {item.icon && <item.icon size={26} className="text-amber-600 drop-shadow-[0_2px_4px_rgba(217,119,6,0.2)]" />}
                                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-25"></div>
                                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black text-gray-600 tracking-tighter uppercase">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 italic">
                        <Ship size={48} className="mb-4 opacity-20" />
                        <p>This section is coming soon...</p>
                    </div>
                )}
            </main>

            {/* Elite Separate-Node Navigation - Pinned to Bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 bg-gradient-to-t from-white via-white/80 to-transparent pt-10">
                <div className="max-w-md mx-auto flex items-center justify-between gap-2">
                    {[
                        { id: "home", icon: Home, label: "HOME" },
                        { id: "product", icon: Ship, label: "MARKET" },
                        { id: "team", icon: Users, label: "NODES" },
                        { id: "wallet", icon: Wallet, label: "ASSETS" },
                        { id: "me", icon: Shield, label: "ME" }
                    ].map((item: any) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === "me") {
                                    router.push("/users/profile");
                                    return;
                                }
                                setActiveNav(item.id);
                            }}
                            className="flex-1 flex flex-col items-center gap-1.5 group relative"
                        >
                            <div className={`relative w-full h-14 flex items-center justify-center rounded-[1.5rem] transition-all duration-500 ${activeNav === item.id
                                ? "bg-blue-600 text-white shadow-[0_12px_25px_-5px_rgba(37,99,235,0.6)] scale-110"
                                : "bg-slate-900/95 backdrop-blur-xl text-gray-500 border border-white/5 active:scale-90"
                                }`}>
                                {item.icon && <item.icon size={22} className="relative z-10" />}
                                {(activeNav === item.id) && (
                                    <div className="absolute inset-0 bg-blue-400 rounded-[1.5rem] blur-lg opacity-40 animate-pulse"></div>
                                )}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-tighter transition-colors leading-none truncate ${activeNav === item.id ? "text-blue-500" : "text-gray-500"
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
