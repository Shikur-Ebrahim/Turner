"use client";

import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
    LayoutDashboard,
    Home,
    Image as ImageIcon,
    Banknote,
    Building2,
    ShieldCheck,
    Bell,
    Percent,
    Send,
    MessageSquare,
    BookOpen,
    Settings,
    LogOut,
    UserX,
    Package
} from "lucide-react";

interface AdminSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();

    const navigation = [
        { id: "home", label: "Dashboard", icon: Home, path: "/admin/dashboard" },
        { id: "banners", label: "Banner Ads", icon: ImageIcon, path: "/admin/dashboard?tab=banners" },
        { id: "payment-methods", label: "Payment Methods", icon: Banknote, path: "/admin/payment-methods" },
        { id: "withdrawal-banks", label: "Withdrawal Banks", icon: Building2, path: "/admin/withdrawal-banks" },
        { id: "unlink-account", label: "Unlink Account", icon: UserX, path: "/admin/unlink-account" },
        { id: "recharge", label: "Recharge Wallet", icon: ShieldCheck, path: "/admin/recharge-verification" },
        { id: "withdrawal-wallet", label: "Withdrawal Wallet", icon: Banknote, path: "/admin/withdrawal-wallet" },
        { id: "notifications", label: "Withdrawal Alerts", icon: Bell, path: "/admin/notifications" },
        { id: "products", label: "Products", icon: Package, path: "/admin/product" },
        { id: "referral", label: "Referral Rule", icon: Percent, path: "/admin/referral-settings" },
        { id: "telegram", label: "Telegram Staff", icon: Send, path: "/admin/telegram" },
        { id: "chats", label: "Live Support", icon: MessageSquare, path: "/admin/chats" },
        { id: "guidelines", label: "Chat Guidelines", icon: BookOpen, path: "/admin/guidelines" },
        { id: "settings", label: "Settings", icon: Settings, path: "/admin/dashboard?tab=settings" },
    ];

    const handleLogout = async () => {
        localStorage.removeItem("admin_session");
        await signOut(auth);
        router.push("/admin");
    };

    // Helper to determine active state
    // For dashboard with tabs, we might need special logic or just match the base path
    // For other pages, exact match or startsWith
    const isActive = (path: string) => {
        if (path.includes("?tab=")) {
            // For query params/tabs, simplistic check if we are on dashboard. 
            // Ideally we check params but for now let's just highlight if the main path matches.
            // Actually, if we are on dashboard, active tab state is managed by the page itself usually?
            // But the user wants the sidebar to handle it.
            // Let's assume dashboard handles its own tabs internally, so sidebar linking to ?tab=banners is just a navigation trigger.
            // Highlights will largely depend on pathname.
            return pathname === "/admin/dashboard" && path.includes(pathname);
        }
        return pathname === path || pathname.startsWith(path + "/");
    };

    // Better Active Logic:
    // If we are on /admin/dashboard, Home is active unless we navigated via a specific tab link?
    // Actually, simply matching pathname is safer for separate pages.
    // For "Banner Ads" which is technically Dashboard + Tab, we might need to handle it.
    // However, the `dashboard` page separates `activeTab` state.
    // To make this fully functional, the sidebar navigation should probably just navigate to the URL.
    // If the URL has a query param, the dashboard page should read it on mount.

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-100 z-50 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
                <div className="p-8 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <LayoutDashboard size={20} />
                        </div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Turner Boss</h1>
                    </div>

                    <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                        {navigation.map((item) => {
                            // Custom active check
                            let active = false;
                            if (item.path.includes("?")) {
                                // It's a query param route (Dashboard tabs)
                                // Check if current pathname is dashboard
                                // Note: This sidebar is dumb, it just highlights based on basic path matching mainly.
                                // If we want detailed tab highlighting, we need useSearchParams. 
                                // But simplistically:
                                if (pathname === "/admin/dashboard" && item.id === "home") active = true;
                                // Banners and Settings share dashboard path, so 'home' might steal focus.
                                // Let's just highlight based on exact path match for non-dashboard pages, and 'home' for dashboard.
                            } else {
                                active = pathname === item.path || pathname.startsWith(item.path);
                            }

                            // Specific override for dashboard tabs if needed, but for now let's keep it simple.
                            // 'Banner Ads' links to dashboard?tab=banners. 

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        router.push(item.path);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${active
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-indigo-600"
                                        }`}
                                >
                                    <item.icon size={22} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <button
                        onClick={handleLogout}
                        className="mt-6 flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                    >
                        <LogOut size={22} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
