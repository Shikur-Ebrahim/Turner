"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, orderBy, onSnapshot, where, getDocs, limit, deleteDoc, writeBatch, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
    Home,
    Wallet,
    Ship,
    Users,
    Bell,
    TrendingUp,
    Loader2,
    Shield,
    Package,
    CheckCircle2,
    Coins,
    Star,
    PartyPopper,
    Zap,
    X,
    XCircle
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import VipCelebrationCard from "@/components/VipCelebrationCard";
import PlatformNotificationModal from "@/components/PlatformNotificationModal";

import { Suspense } from "react";

function WelcomeContent() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeNav, setActiveNav] = useState("home");
    const [banners, setBanners] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [mounted, setMounted] = useState(false);


    // Notification State
    const [userNotifs, setUserNotifs] = useState<any[]>([]);
    const [latestRecharge, setLatestRecharge] = useState<any>(null);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // VIP Celebration State
    const [showVipCeleb, setShowVipCeleb] = useState(false);
    const [vipCelebData, setVipCelebData] = useState<any>(null);

    // Platform Notification State
    const [platformNotif, setPlatformNotif] = useState<any>(null);
    const [showPlatformNotif, setShowPlatformNotif] = useState(false);

    // Language State
    const [language, setLanguage] = useState<"english" | "amharic">("english");

    const translations = {
        english: {
            welcome: "Welcome back,",
            wallets: "Wallets",
            mainOperations: "Main Operations",
            recharge: "RECHARGE",
            buyProduct: "BUY PRODUCT",
            vipRules: "VIP RULES",
            withdraw: "WITHDRAW",
            tasks: "TASKS",
            inviteFriends: "Invite Friends",
            earnRewards: "Earn Multi-Level Rewards",
            announcement: "Announcement",
            noRecentActivity: "No recent activity",
            notifications: "Notifications",
            user: "User",
            comingSoon: "This section is coming soon...",
        },
        amharic: {
            welcome: "እንኳን በደህና መጡ፣",
            wallets: "የኪስ ቦርሳዎች",
            mainOperations: "ዋና ተግባራት",
            recharge: "ገንዘብ ይሙሉ",
            buyProduct: "ምርት ይግዙ",
            vipRules: "ቪአይፒ ደንቦች",
            withdraw: "ገንዘብ ያውጡ",
            tasks: "ተግባራት",
            inviteFriends: "ጓደኞችን ይጋብዙ",
            earnRewards: "የብዙ ደረጃ ሽልማቶችን ያግኙ",
            announcement: "ማስታወቂያ",
            noRecentActivity: "ምንም የቅርብ ጊዜ እንቅስቃሴ የለም",
            notifications: "ማሳወቂያዎች",
            user: "ተጠቃሚ",
            comingSoon: "ይህ ክፍል በቅርቡ ይመጣል።",
        }
    };

    const t = (key: keyof typeof translations.english) => {
        return translations[language][key] || translations.english[key];
    };

    useEffect(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    }, []);

    const toggleLanguage = (lang: "english" | "amharic") => {
        setLanguage(lang);
        localStorage.setItem("appLanguage", lang);
    };

    const searchParams = useSearchParams();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const tab = searchParams.get('tab');
        if (tab && ['home', 'product', 'team', 'wallet'].includes(tab)) {
            setActiveNav(tab);
        } else {
            setActiveNav('home');
        }
    }, [searchParams]);

    useEffect(() => {
        if (!user) return;

        // 1. Listen for User's Latest Recharge
        const qRecharge = query(
            collection(db, "RechargeReview"),
            where("userId", "==", user.uid)
        );

        const unsubscribeRec = onSnapshot(qRecharge, (snapshot) => {
            if (!snapshot.empty) {
                const recharges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Client-side sort to avoid index issues
                recharges.sort((a: any, b: any) => {
                    const timeA = a.timestamp?.toMillis?.() || 0;
                    const timeB = b.timestamp?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                const latest = recharges[0] as any;
                setLatestRecharge(latest);
                // Only trigger dot for 'Under Review' recharges
                if (latest.status === 'Under Review') {
                    setHasUnread(true);
                }
            }
        });

        // 2. Listen for User-Specific Reward Notifications
        const qUserNotifs = query(
            collection(db, "UserNotifications"),
            where("userId", "==", user.uid)
        );

        const unsubscribeNotifs = onSnapshot(qUserNotifs, async (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            // Client-side sort to avoid index requirements
            notifs.sort((a: any, b: any) => {
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;
                return timeB - timeA;
            });

            // Limit to top 25 most recent for display
            const limitedNotifs = notifs.slice(0, 25);

            setUserNotifs(limitedNotifs);

            // Sync unread dot with actual unread notifications
            const hasAnyUnread = limitedNotifs.some((n: any) => !n.read);
            if (hasAnyUnread) {
                setHasUnread(true);
            }

            // --- Auto-Cleanup Logic ---
            // If total notifications exceed 25, delete the older ones from the database
            if (notifs.length > 25) {
                const toDelete = notifs.slice(25);
                const batch = writeBatch(db);
                toDelete.forEach((notif) => {
                    const docRef = doc(db, "UserNotifications", notif.id);
                    batch.delete(docRef);
                });
                try {
                    await batch.commit();
                } catch (error) {
                    console.error("Error cleaning up old notifications:", error);
                }
            }
        });

        return () => {
            unsubscribeRec();
            unsubscribeNotifs();
        };
    }, [user]);

    const handleMarkAsRead = async (notif: any) => {
        if (notif.read === false) {
            try {
                const docRef = doc(db, "UserNotifications", notif.id);
                await updateDoc(docRef, { read: true });
            } catch (error) {
                console.error("Error marking as read:", error);
            }
        }
    };

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
                    const data = docSnap.data();
                    setUserData(data);

                    // --- VIP Celebration Logic ---
                    const currentVip = data.vip || 0;
                    const vipViews = data.vipViews || {};
                    const currentViews = vipViews[`level_${currentVip}`] || 0;

                    if (currentVip > 0 && currentViews < 3) {
                        const notifDoc = await getDoc(doc(db, "VipNotifications", `vip_${currentVip}`));
                        if (notifDoc.exists()) {
                            setVipCelebData({ ...notifDoc.data(), currentViews });
                            setShowVipCeleb(true);
                        }
                    }
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


        // Fetch platform notifications
        console.log("Fetching platform notifications...");
        const qPlatform = query(
            collection(db, "PlatformNotifications"),
            where("isActive", "==", true)
        );

        const unsubscribePlatform = onSnapshot(qPlatform, (snapshot) => {
            console.log("Platform notifications snapshot received. Count:", snapshot.size);
            if (!snapshot.empty) {
                // Manually sort by createdAt if multiple (to avoid composite index requirement)
                const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                docs.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis?.() || 0;
                    const timeB = b.createdAt?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                const notif = docs[0];
                setPlatformNotif(notif);
                setShowPlatformNotif(true);
            } else {
                console.log("No active platform notifications found.");
            }
        }, (error) => {
            console.error("Firestore onSnapshot error (PlatformNotifications):", error);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeBanners();
            unsubscribeNotifs();
            unsubscribePlatform();
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

    const handleRechargeClick = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                router.push("/users/recharge");
                return;
            }

            // Check for pending recharge
            const q = query(
                collection(db, "RechargeReview"),
                where("userId", "==", currentUser.uid),
                where("status", "==", "Under Review"),
                limit(1)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const pendingData = querySnapshot.docs[0].data();
                const theme = pendingData.paymentMethod || "regular";
                router.push(`/users/transaction-pending?theme=${theme}`);
            } else {
                router.push("/users/recharge");
            }
        } catch (error) {
            console.error("Error checking pending status:", error);
            router.push("/users/recharge");
        }
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-44 relative" onClick={() => showNotifPanel && setShowNotifPanel(false)}>
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl z-40 px-6 py-4 flex items-center justify-between border-b border-gray-100/50 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 relative">
                        <img src="/logo.png" alt="Turner Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium leading-none">{t('welcome')}</p>
                        <p className="text-sm font-bold text-gray-900">{userData?.email?.split('@')[0] || t('user')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Language Toggle */}
                    <div className="flex bg-gray-100 rounded-full p-1 border border-red-100 shadow-sm">
                        <button
                            onClick={() => toggleLanguage('english')}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${language === 'english' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            <img src="/Flag_of_the_United_States.png" alt="EN" className="w-4 h-3 object-contain" />
                            EN
                        </button>
                        <button
                            onClick={() => toggleLanguage('amharic')}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${language === 'amharic' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                            <img src="/Ethiopia.png" alt="AM" className="w-4 h-3 object-contain" />
                            AM
                        </button>
                    </div>

                    {/* Notification Bell with Dropdown */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                setShowNotifPanel(!showNotifPanel);
                                // We don't verify all on click anymore, user must click specific items or we could add a "mark all read" later. 
                                // But per standard UX, opening usually clears the "new" badge or we keep it until read.
                                // For this specific request, the user wants to "track" them. 
                                // Reviewing the prompt: "just unsee notiifcation just only red icon... justn number just just diplsyed the number"
                                // I will keep the badge showing the count of unread items.
                            }}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 relative hover:bg-gray-200 transition-colors"
                        >
                            <Bell size={20} className="text-gray-600" />
                            {userNotifs.filter(n => !n.read).length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-bold text-white animate-in zoom-in px-1">
                                    {userNotifs.filter(n => !n.read).length > 9 ? '9+' : userNotifs.filter(n => !n.read).length}
                                </span>
                            )}
                        </button>

                        {/* Notification Panel */}
                        {showNotifPanel && (
                            <div className="absolute top-full right-0 mt-3 w-80 bg-white/90 backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-white p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-4 border-b border-gray-100">
                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">{t('notifications')}</h4>
                                </div>
                                <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                                    {(() => {
                                        // Combine and Sort All Notifications
                                        const allNotifs: any[] = [...userNotifs];
                                        if (latestRecharge && latestRecharge.status === 'verified') {
                                            allNotifs.push({ ...latestRecharge, type: 'recharge' });
                                        }

                                        allNotifs.sort((a, b) => {
                                            const timeA = (a.createdAt || a.timestamp)?.toMillis?.() || 0;
                                            const timeB = (b.createdAt || b.timestamp)?.toMillis?.() || 0;
                                            return timeB - timeA;
                                        });

                                        if (allNotifs.length === 0) {
                                            return (
                                                <div className="py-8 text-center text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                                                    {t('noRecentActivity')}
                                                </div>
                                            );
                                        }

                                        return allNotifs.map((notif, idx) => {
                                            if (notif.type === 'recharge' || (notif.amount && !notif.level && notif.type !== 'withdrawal' && notif.type !== 'withdrawal_verified')) {
                                                // Render Recharge Style
                                                return (
                                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden group">
                                                        {notif.status === 'verified' ? (
                                                            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-sm">
                                                                <img src="/logo.png" alt="Turner" className="w-full h-full object-contain" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                                                <Loader2 size={18} className="text-blue-600 animate-spin" />
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col relative z-10">
                                                            <p className="text-xs font-bold text-gray-900 leading-tight">
                                                                {notif.status === 'verified' ? 'Transaction verified successfully.' : 'Recharge Under Review'}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 font-medium">
                                                                {Number(notif.amount).toLocaleString()} ETB
                                                            </p>
                                                        </div>

                                                        {notif.status === 'verified' && (
                                                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
                                                        )}
                                                    </div>
                                                );
                                            } else if (notif.type === 'registration') {
                                                // Render Registration Style
                                                const levelMap: { [key: string]: string } = {
                                                    "Level A": "1",
                                                    "Level B": "2",
                                                    "Level C": "3",
                                                    "Level D": "4"
                                                };
                                                const levelNum = levelMap[notif.level] || "1";
                                                const isUnread = notif.read === false;

                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleMarkAsRead(notif)}
                                                        className={`flex items-center gap-3 p-3 rounded-2xl relative overflow-hidden group transition-all duration-300 cursor-pointer border ${isUnread
                                                            ? "bg-emerald-50 border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                                            : "bg-slate-50 border-slate-100"
                                                            }`}
                                                    >
                                                        {isUnread && (
                                                            <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] z-20"></div>
                                                        )}

                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm relative z-10">
                                                            <img
                                                                src={encodeURI(`/level ${levelNum}.jpg`)}
                                                                alt={notif.level}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col relative z-10">
                                                            <p className={`text-xs font-bold leading-tight ${isUnread ? "text-emerald-900" : "text-gray-900"}`}>
                                                                {notif.level} Registered Successfully
                                                            </p>
                                                            <p className={`text-[10px] font-bold mt-0.5 ${isUnread ? "text-emerald-600" : "text-gray-700"}`}>
                                                                New Member Joined
                                                            </p>
                                                            <p className="text-[9px] text-gray-400 font-medium">
                                                                from {notif.fromUser ? `${notif.fromUser.substring(0, 3)}***${notif.fromUser.substring(notif.fromUser.length - 4)}` : "Team Member"}
                                                            </p>
                                                        </div>
                                                        <div className="absolute -right-2 -top-2 opacity-10">
                                                            <Users size={40} className={isUnread ? "text-emerald-600" : "text-slate-400"} />
                                                        </div>
                                                    </div>
                                                );
                                            } else if (notif.type === 'withdrawal_verified') {
                                                const isUnread = notif.read === false;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleMarkAsRead(notif)}
                                                        className={`flex items-center gap-3 p-3 rounded-2xl relative overflow-hidden group transition-all duration-300 cursor-pointer border ${isUnread
                                                            ? "bg-emerald-50 border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                                            : "bg-slate-50 border-slate-100"
                                                            }`}
                                                    >
                                                        {isUnread && (
                                                            <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] z-20"></div>
                                                        )}
                                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border-2 border-slate-100 shadow-sm relative z-10 p-1">
                                                            <img src="/assets/withdrawal.png" alt="Withdrawal" className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="flex flex-col relative z-10">
                                                            <p className={`text-xs font-black leading-tight ${isUnread ? "text-emerald-900" : "text-gray-900"} uppercase tracking-tight`}>
                                                                Payout Authorized
                                                            </p>
                                                            <p className={`text-[10px] font-bold mt-0.5 ${isUnread ? "text-emerald-600" : "text-gray-700"}`}>
                                                                {Number(notif.amount).toLocaleString()} ETB Verified
                                                            </p>
                                                        </div>
                                                        <div className="absolute -right-2 -top-2 opacity-10 text-emerald-600">
                                                            <CheckCircle2 size={40} />
                                                        </div>
                                                    </div>
                                                );
                                            } else if (notif.type === 'withdrawal') {
                                                const isUnread = notif.read === false;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleMarkAsRead(notif)}
                                                        className={`flex items-center gap-3 p-3 rounded-2xl relative overflow-hidden group transition-all duration-300 cursor-pointer border ${isUnread
                                                            ? "bg-indigo-50 border-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.1)]"
                                                            : "bg-slate-50 border-slate-100"
                                                            }`}
                                                    >
                                                        {isUnread && (
                                                            <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)] z-20"></div>
                                                        )}
                                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border-2 border-slate-100 shadow-sm relative z-10 p-1">
                                                            <img src="/assets/withdrawal.png" alt="Withdrawal" className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="flex flex-col relative z-10">
                                                            <p className={`text-xs font-black leading-tight ${isUnread ? "text-indigo-900" : "text-gray-900"} uppercase tracking-tight`}>
                                                                Withdrawal Pending
                                                            </p>
                                                            <p className={`text-[10px] font-bold mt-0.5 ${isUnread ? "text-indigo-600" : "text-gray-700"}`}>
                                                                {Number(notif.amount).toLocaleString()} ETB Payout
                                                            </p>
                                                        </div>
                                                        <div className="absolute -right-2 -top-2 opacity-10 text-indigo-600">
                                                            <Wallet size={40} />
                                                        </div>
                                                    </div>
                                                );
                                            } else if (notif.type === 'password_change') {
                                                const isUnread = notif.read === false;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleMarkAsRead(notif)}
                                                        className={`flex items-center gap-3 p-3 rounded-2xl relative overflow-hidden group transition-all duration-300 cursor-pointer border ${isUnread
                                                            ? "bg-blue-50 border-blue-100 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                                                            : "bg-slate-50 border-slate-100"
                                                            }`}
                                                    >
                                                        {isUnread && (
                                                            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)] z-20"></div>
                                                        )}

                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm relative z-10">
                                                            <Shield size={20} className="text-blue-600" />
                                                        </div>
                                                        <div className="flex flex-col relative z-10">
                                                            <p className={`text-xs font-bold leading-tight ${isUnread ? "text-blue-900" : "text-gray-900"}`}>
                                                                Security Update
                                                            </p>
                                                            <p className={`text-[10px] font-bold mt-0.5 ${isUnread ? "text-blue-600" : "text-gray-700"}`}>
                                                                {notif.message}
                                                            </p>
                                                        </div>
                                                        <div className="absolute -right-2 -top-2 opacity-10 text-blue-600">
                                                            <Shield size={40} />
                                                        </div>
                                                    </div>
                                                );
                                            } else if (notif.type === 'rate_update') {
                                                const isUnread = notif.read === false;
                                                const isCoin = notif.asset === 'coin';

                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleMarkAsRead(notif)}
                                                        className={`flex items-center gap-3 p-3 rounded-2xl relative overflow-hidden group transition-all duration-300 cursor-pointer border ${isUnread
                                                            ? isCoin ? "bg-emerald-50 border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-amber-50 border-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                                            : "bg-slate-50 border-slate-100"
                                                            }`}
                                                    >
                                                        {isUnread && (
                                                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)] z-20 ${isCoin ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                                                        )}

                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm relative z-10 ${isCoin ? "bg-emerald-100" : "bg-amber-100"}`}>
                                                            {isCoin ? (
                                                                <Coins size={20} className={isUnread ? "text-emerald-600" : "text-emerald-500"} />
                                                            ) : (
                                                                <Star size={20} className={isUnread ? "text-amber-600" : "text-amber-500"} />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col relative z-10">
                                                            <p className={`text-xs font-bold leading-tight ${isUnread ? isCoin ? "text-emerald-900" : "text-amber-900" : "text-gray-900"}`}>
                                                                {isCoin ? "Coin" : "Star"} Rate Updated
                                                            </p>
                                                            <p className={`text-[10px] font-bold mt-0.5 ${isUnread ? isCoin ? "text-emerald-600" : "text-amber-600" : "text-gray-700"}`}>
                                                                New Rate: {notif.newRate} ETB
                                                            </p>
                                                            <p className="text-[9px] text-gray-400 font-medium">
                                                                Previous: {notif.oldRate} ETB
                                                            </p>
                                                        </div>
                                                        <div className={`absolute -right-2 -top-2 opacity-10 ${isCoin ? "text-emerald-600" : "text-amber-600"}`}>
                                                            <TrendingUp size={40} />
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Render Reward Style
                                                const levelMap: { [key: string]: string } = {
                                                    "Level A": "1",
                                                    "Level B": "2",
                                                    "Level C": "3",
                                                    "Level D": "4"
                                                };
                                                const levelNum = levelMap[notif.level] || "1";
                                                const isUnread = notif.read === false;

                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleMarkAsRead(notif)}
                                                        className={`flex items-center gap-3 p-3 rounded-2xl relative overflow-hidden group transition-all duration-300 cursor-pointer border ${isUnread
                                                            ? "bg-red-50 border-red-100 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                                            : "bg-indigo-50/50 border-indigo-100"
                                                            }`}
                                                    >
                                                        {isUnread && (
                                                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)] z-20"></div>
                                                        )}

                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm relative z-10">
                                                            <img
                                                                src={encodeURI(`/level ${levelNum}.jpg`)}
                                                                alt={notif.level}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col relative z-10">
                                                            <p className={`text-xs font-bold leading-tight ${isUnread ? "text-red-900" : "text-gray-900"}`}>
                                                                {notif.level} Reward Earned
                                                            </p>
                                                            <p className={`text-[10px] font-bold mt-0.5 ${isUnread ? "text-red-600" : "text-gray-700"}`}>
                                                                +{Number(notif.amount).toLocaleString()} ETB
                                                            </p>
                                                            <p className="text-[9px] text-gray-400 font-medium">
                                                                from {notif.fromUser ? `${notif.fromUser.substring(0, 3)}***${notif.fromUser.substring(notif.fromUser.length - 4)}` : "Team Member"}
                                                            </p>
                                                        </div>
                                                        <div className="absolute -right-2 -top-2 opacity-10">
                                                            <TrendingUp size={40} className={isUnread ? "text-red-600" : "text-indigo-600"} />
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
                        {/* Special Announcement Card Section (Inline) */}
                        {platformNotif && showPlatformNotif && (
                            <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/10 border border-white relative group">
                                    <button
                                        onClick={() => setShowPlatformNotif(false)}
                                        className="absolute top-4 right-4 z-20 w-10 h-10 bg-slate-900/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all active:scale-95"
                                    >
                                        <X size={18} />
                                    </button>

                                    {platformNotif.imageUrl && (
                                        <div className="w-full h-48 relative">
                                            <img src={platformNotif.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Announcement" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                                        </div>
                                    )}

                                    <div className="p-8 text-center relative z-10">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 mb-4">
                                            <Zap size={12} className="fill-white" />
                                            {platformNotif.type || t('announcement')}
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-3">{platformNotif.title}</h4>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                                            {platformNotif.content}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}



                        {/* Elite 5-Card Interactive Action Grid (2+3 Layout) */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 px-1">
                                <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div>
                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">{t('mainOperations')}</h3>
                            </div>

                            {/* Premium Invite Banner */}
                            <div
                                onClick={() => router.push("/users/invite")}
                                className="relative w-full h-32 rounded-[2.5rem] overflow-hidden cursor-pointer group shadow-2xl shadow-indigo-500/10 active:scale-95 transition-all duration-500 border border-white"
                            >
                                <img
                                    src="/invite_banner.png"
                                    alt="Invite Banner"
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-transparent flex flex-col justify-center px-8">
                                    <div className="flex flex-col">
                                        <span className="text-white font-black text-xl tracking-tight leading-none drop-shadow-md">{t('inviteFriends')}</span>
                                        <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mt-1 drop-shadow-sm">{t('earnRewards')}</span>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>

                            {/* Top Row: 2 Premium Cards */}
                            <div className="grid grid-cols-2 gap-5">
                                <button
                                    onClick={handleRechargeClick}
                                    className="relative bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-2xl transition-all active:scale-95 group overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-orange-400/10 transition-colors"></div>
                                    <div className="w-20 h-20 relative group-hover:scale-110 transition-transform duration-500">
                                        <img src="/assets/recharge.png" alt="Recharge" className="w-full h-full object-contain drop-shadow-[0_12px_20px_rgba(249,115,22,0.25)]" />
                                    </div>
                                    <span className="text-xs font-black text-gray-900 tracking-[0.1em] uppercase">{t('recharge')}</span>
                                </button>

                                <button
                                    onClick={() => router.push("/users/product")}
                                    className="relative bg-white rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-2xl transition-all active:scale-95 group overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-400/10 transition-colors"></div>
                                    <div className="w-20 h-20 relative group-hover:scale-110 transition-transform duration-500">
                                        <img src="/assets/buy_product.png" alt="Buy Product" className="w-full h-full object-contain drop-shadow-[0_12px_20px_rgba(16,185,129,0.25)]" />
                                    </div>
                                    <span className="text-xs font-black text-gray-900 tracking-[0.1em] uppercase leading-none text-center">{t('buyProduct')}</span>
                                </button>
                            </div>

                            {/* Bottom Row: 3 Elite Mini Nodes */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: t('vipRules'), img: "/vip_rule_3d.png", color: "blue", action: () => router.push("/users/vip-rules") },
                                    { label: t('withdraw'), img: "/assets/withdrawal.png", color: "indigo", action: () => router.push("/users/withdraw") },
                                    { label: t('tasks'), icon: TrendingUp, color: "amber", special: true, action: () => router.push("/users/tasks") }
                                ].map((item: any, i: number) => (
                                    <button
                                        key={i}
                                        onClick={item.action}
                                        className="bg-white rounded-[2rem] p-5 flex flex-col items-center justify-center gap-3 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.07)] border border-gray-100 hover:shadow-xl transition-all active:scale-95 group relative overflow-hidden"
                                    >
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
                        <p>{t('comingSoon')}</p>
                    </div>
                )}
            </main >

            {/* VIP Celebration Overlay */}
            {
                showVipCeleb && vipCelebData && (
                    <VipCelebrationCard
                        vipLevel={vipCelebData.vipLevel}
                        text={vipCelebData.text}
                        imageUrl={vipCelebData.imageUrl}
                        onClose={async () => {
                            setShowVipCeleb(false);
                            // Increment view count for this VIP level
                            if (user) {
                                try {
                                    const userRef = doc(db, "users", user.uid);
                                    const currentViews = vipCelebData.currentViews || 0;
                                    await updateDoc(userRef, {
                                        [`vipViews.level_${vipCelebData.vipLevel}`]: currentViews + 1
                                    });
                                } catch (err) {
                                    console.error("Error updating achievement status:", err);
                                }
                            }
                        }}
                    />
                )
            }
            {/* Platform Notification Overlay */}
            {
                showPlatformNotif && platformNotif && (
                    <PlatformNotificationModal
                        notif={platformNotif}
                        onClose={() => setShowPlatformNotif(false)}
                    />
                )
            }
        </div >
    );
}

export default function WelcomePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        }>
            <WelcomeContent />
        </Suspense>
    );
}
