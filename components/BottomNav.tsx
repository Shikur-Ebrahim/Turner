"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home, Ship, Users, Wallet, Shield } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { syncDailyIncome } from "@/lib/sync";
import { auth } from "@/lib/firebase";

function BottomNavContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("home");
    const [mounted, setMounted] = useState(false);
    const isChat = pathname === "/users/chat";

    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        // Clean up any potential auth listeners
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserId(user.uid);
                // Trigger sync when we have a user
                syncDailyIncome(user.uid);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const tab = searchParams.get("tab");
        if (pathname === "/users/welcome") {
            setActiveTab(tab || "home");
        } else if (pathname === "/users/product") {
            setActiveTab("product");
        } else if (pathname === "/users/profile") {
            setActiveTab("me");
        } else if (pathname.includes("/users/team")) {
            setActiveTab("team");
        }
    }, [pathname, searchParams, mounted]);

    const hideNav = pathname === "/users/chat" || pathname.startsWith("/users/withdraw") || pathname === "/users/change-withdrawal-password" || pathname.includes("-record") || pathname === "/users/funding-details";

    if (!mounted || hideNav) return null;

    const navItems = [
        { id: "home", icon: Home, label: "HOME", path: "/users/welcome?tab=home" },
        { id: "product", icon: Ship, label: "MARKET", path: "/users/product" },
        { id: "team", icon: Users, label: "TEAMS", path: "/users/team" },
        { id: "wallet", icon: Wallet, label: "WALLETS", path: "/users/welcome?tab=wallet" },
        { id: "me", icon: Shield, label: "ME", path: "/users/profile" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 bg-gradient-to-t from-white via-white/80 to-transparent pt-10 pointer-events-none">
            <div className="max-w-md mx-auto flex items-center justify-between gap-2 pointer-events-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className="flex-1 flex flex-col items-center gap-1.5 group relative"
                    >
                        <div
                            className={`relative w-full h-14 flex items-center justify-center rounded-[1.5rem] transition-all duration-500 ${activeTab === item.id
                                ? "bg-blue-600 text-white shadow-[0_12px_25px_-5px_rgba(37,99,235,0.6)] scale-110"
                                : "bg-slate-900/95 backdrop-blur-xl text-gray-500 border border-white/5 active:scale-90"
                                }`}
                        >
                            <item.icon size={22} className="relative z-10" />
                            {activeTab === item.id && (
                                <div className="absolute inset-0 bg-blue-400 rounded-[1.5rem] blur-lg opacity-40 animate-pulse"></div>
                            )}
                        </div>
                        <span
                            className={`text-[8px] font-black uppercase tracking-tighter transition-colors leading-none truncate ${activeTab === item.id ? "text-blue-500" : "text-gray-500"
                                }`}
                        >
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function BottomNav() {
    return (
        <Suspense fallback={null}>
            <BottomNavContent />
        </Suspense>
    );
}
