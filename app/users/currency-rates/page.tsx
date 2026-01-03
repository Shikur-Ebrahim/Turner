"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ChevronLeft, Coins, Gem, ArrowRightLeft } from "lucide-react";
import { countries }
    from "@/lib/constants";

export default function CurrencyRatesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [selectedAsset, setSelectedAsset] = useState<"COIN" | "STAR">("COIN");
    const [hasNewCoinRate, setHasNewCoinRate] = useState(false);
    const [hasNewStarRate, setHasNewStarRate] = useState(false);
    const [lastSeenCoinRate, setLastSeenCoinRate] = useState(0);
    const [lastSeenStarRate, setLastSeenStarRate] = useState(0);
    const [config, setConfig] = useState({
        usdRate: 0.017, // 1 ETB = x USD (Default)
        coinRate: 0.5,
        starRate: 2.0
    });

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            // Real-time subscription to user data
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeData = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setUserData(doc.data());
                    const data = doc.data();
                    setLastSeenCoinRate(data.lastSeenCoinRate || 0);
                    setLastSeenStarRate(data.lastSeenStarRate || 0);
                }
                setLoading(false);
            });

            // Real-time subscription to currency config
            const configRef = doc(db, "Settings", "currency");
            const unsubscribeConfig = onSnapshot(configRef, (doc) => {
                if (doc.exists()) {
                    const newConfig = doc.data() as any;
                    setConfig(newConfig);

                    const lastUpdated = newConfig.lastUpdated || 0;

                    // Check if coin rate is new
                    if (lastUpdated > lastSeenCoinRate && lastSeenCoinRate > 0) {
                        setHasNewCoinRate(true);
                    }

                    // Check if star rate is new
                    if (lastUpdated > lastSeenStarRate && lastSeenStarRate > 0) {
                        setHasNewStarRate(true);
                    }
                }
            });

            return () => {
                unsubscribeData();
                unsubscribeConfig();
            };
        });

        return () => unsubscribeAuth();
    }, [router]);

    // Helper: Calculate Selected Asset Total Value = ? Local Currency
    const calculateTotalValue = (country: any) => {
        // Base value in ETB
        let baseValueInETB = 0;
        let holdingAmount = 0;

        if (selectedAsset === "COIN") {
            baseValueInETB = config.coinRate;
            holdingAmount = Number(userData?.teamIncome || 0);
        }
        if (selectedAsset === "STAR") {
            baseValueInETB = config.starRate;
            holdingAmount = Number(userData?.taskIncome || 0);
        }

        // If target is ETB, return direct value
        if (country.code === "ET") {
            return (baseValueInETB * holdingAmount).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
        }

        // Convert ETB -> USD -> Local
        // 1 ETB = config.usdRate USD
        // 1 USD = country.rateToUSD Local
        const valueInUSD = baseValueInETB * config.usdRate;
        const valueInLocal = valueInUSD * country.rateToUSD;
        const totalValue = valueInLocal * holdingAmount;

        return totalValue.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-700 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 active:scale-95 transition-all hover:bg-slate-800"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold tracking-wide">Currency Rates</h1>
                </div>
            </header>

            <main className="p-4 space-y-6 pb-10 overflow-hidden">

                {/* Top Section: Interactive Asset Selectors */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Coin Card */}
                    <button
                        onClick={async () => {
                            setSelectedAsset("COIN");
                            if (hasNewCoinRate && user) {
                                setHasNewCoinRate(false);
                                const userRef = doc(db, "users", user.uid);
                                await updateDoc(userRef, {
                                    lastSeenCoinRate: Date.now()
                                });
                            }
                        }}
                        className={`relative rounded-[2rem] p-6 text-left transition-all duration-500 group overflow-hidden ${selectedAsset === "COIN"
                                ? "bg-[#00C278] shadow-2xl shadow-emerald-500/30 scale-[1.02] ring-0"
                                : "bg-[#1A1F2E] border border-white/5 hover:bg-[#1E2335]"
                            }`}
                    >
                        {/* Notification Badge */}
                        {hasNewCoinRate && (
                            <div className="absolute -top-2 -right-2 z-30">
                                <div className="relative">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                                        <span className="text-[9px] font-black text-white">!</span>
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                                </div>
                            </div>
                        )}

                        {/* Decorative background for active state */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 ${selectedAsset === "COIN" ? "bg-white/20" : "opacity-0"}`}></div>

                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                            <div className="flex justify-between items-start">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${selectedAsset === "COIN" ? "bg-white/20 text-white backdrop-blur-md" : "bg-emerald-500/10 text-emerald-500"}`}>
                                    <Coins size={24} className={selectedAsset === "COIN" ? "animate-pulse fill-current" : ""} />
                                </div>
                            </div>

                            <div>
                                <h3 className={`font-bold text-sm tracking-wide mb-1 ${selectedAsset === "COIN" ? "text-emerald-50" : "text-slate-400"}`}>Turner Coin</h3>
                                <span className={`text-3xl font-black tracking-tight ${selectedAsset === "COIN" ? "text-white" : "text-slate-200"}`}>
                                    {Number(userData?.teamIncome || 0).toLocaleString()}
                                </span>
                            </div>

                            <div className={`text-[10px] font-bold font-mono px-3 py-1.5 rounded-xl w-fit transition-colors ${selectedAsset === "COIN" ? "bg-black/20 text-white" : "bg-[#252A3B] text-slate-500"}`}>
                                1 Coin = {config.coinRate} ETB
                            </div>
                        </div>
                    </button>

                    {/* Star Card */}
                    <button
                        onClick={async () => {
                            setSelectedAsset("STAR");
                            if (hasNewStarRate && user) {
                                setHasNewStarRate(false);
                                const userRef = doc(db, "users", user.uid);
                                await updateDoc(userRef, {
                                    lastSeenStarRate: Date.now()
                                });
                            }
                        }}
                        className={`relative rounded-[2rem] p-6 text-left transition-all duration-500 group overflow-hidden ${selectedAsset === "STAR"
                                ? "bg-[#F5A623] shadow-2xl shadow-amber-500/30 scale-[1.02] ring-0"
                                : "bg-[#1A1F2E] border border-white/5 hover:bg-[#1E2335]"
                            }`}
                    >
                        {/* Notification Badge */}
                        {hasNewStarRate && (
                            <div className="absolute -top-2 -right-2 z-30">
                                <div className="relative">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                                        <span className="text-[9px] font-black text-white">!</span>
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                                </div>
                            </div>
                        )}

                        {/* Decorative background for active state */}
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 ${selectedAsset === "STAR" ? "bg-white/20" : "opacity-0"}`}></div>

                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                            <div className="flex justify-between items-start">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${selectedAsset === "STAR" ? "bg-white/20 text-white backdrop-blur-md" : "bg-amber-500/10 text-amber-500"}`}>
                                    <Gem size={24} className={selectedAsset === "STAR" ? "animate-pulse fill-current" : ""} />
                                </div>
                            </div>

                            <div>
                                <h3 className={`font-bold text-sm tracking-wide mb-1 ${selectedAsset === "STAR" ? "text-amber-50" : "text-slate-400"}`}>Turner Star</h3>
                                <span className={`text-3xl font-black tracking-tight ${selectedAsset === "STAR" ? "text-white" : "text-slate-200"}`}>
                                    {Number(userData?.taskIncome || 0).toLocaleString()}
                                </span>
                            </div>

                            <div className={`text-[10px] font-bold font-mono px-3 py-1.5 rounded-xl w-fit transition-colors ${selectedAsset === "STAR" ? "bg-black/20 text-white" : "bg-[#252A3B] text-slate-500"}`}>
                                1 Star = {config.starRate} ETB
                            </div>
                        </div>
                    </button>
                </div>

                <div className="h-px bg-white/5 my-4"></div>

                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Total Asset Value
                    </h2>
                    <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-1 rounded border border-white/5">
                        Amount: {Number(selectedAsset === "COIN" ? userData?.teamIncome : userData?.taskIncome).toLocaleString()}
                    </span>
                </div>

                {/* Country List */}
                <div className="space-y-3">
                    {countries.map((country) => (
                        <div key={country.code} className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 flex items-center justify-between hover:bg-slate-900 hover:border-white/10 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden ring-2 ring-white/5 relative shadow-lg group-hover:scale-110 transition-transform">
                                    <img src={country.flag} alt={country.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-slate-200">{country.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-1.5 rounded uppercase">{country.currency}</span>
                                        {country.code === "ET" && (
                                            <span className="text-[10px] text-blue-400 font-medium">Home Currency</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                <span className={`text-base font-bold font-mono ${selectedAsset === "COIN" ? "text-emerald-400" : "text-amber-400"}`}>
                                    {calculateTotalValue(country)}
                                </span>
                                <div className="flex items-center gap-1.5 opacity-40">
                                    <ArrowRightLeft size={10} />
                                    <span className="text-[10px] uppercase tracking-wider">
                                        Total Value
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}
