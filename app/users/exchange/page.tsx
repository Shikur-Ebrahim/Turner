"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot, increment } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    ArrowLeftRight,
    Coins,
    Banknote,
    Loader2,
    ChevronLeft,
    CheckCircle2,
    AlertCircle,
    TrendingUp
} from "lucide-react";

export default function ExchangePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exchangeRate, setExchangeRate] = useState(0);
    const [coinAmount, setCoinAmount] = useState("");
    const [etbPreview, setEtbPreview] = useState(0);
    const [exchanging, setExchanging] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [exchangedCoins, setExchangedCoins] = useState(0);
    const [exchangedETB, setExchangedETB] = useState(0);
    const [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            // Real-time subscription to user data
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeUser = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setUserData(doc.data());
                }
                setLoading(false);
            });

            // Fetch exchange rate from Settings
            const ratesRef = doc(db, "Settings", "currency");
            const unsubscribeRates = onSnapshot(ratesRef, (doc) => {
                if (doc.exists()) {
                    const rateData = doc.data();
                    setExchangeRate(rateData.coinRate || 0);
                }
            });

            return () => {
                unsubscribeUser();
                unsubscribeRates();
            };
        });

        return () => unsubscribe();
    }, [router]);

    // Update ETB preview when coin amount changes
    useEffect(() => {
        const amount = parseFloat(coinAmount) || 0;
        setEtbPreview(amount * exchangeRate);
        setError("");
    }, [coinAmount, exchangeRate]);

    const handleExchange = async () => {
        if (!user || !userData) return;

        const amount = parseFloat(coinAmount);

        // Validation
        if (amount < 100) {
            setError("Minimum exchange amount is 100 Coins");
            return;
        }

        if (amount > (userData.teamIncome || 0)) {
            setError("Insufficient Coin balance");
            return;
        }

        setExchanging(true);
        setError("");

        try {
            const userRef = doc(db, "users", user.uid);
            const etbAmount = amount * exchangeRate;

            // Update user document
            await updateDoc(userRef, {
                teamIncome: increment(-amount),
                balance: increment(etbAmount),
                totalIncome: increment(etbAmount)
            });

            // Store exchanged amounts for success modal
            setExchangedCoins(amount);
            setExchangedETB(etbAmount);

            // Show success animation
            setShowSuccess(true);
            setCoinAmount("");

        } catch (error) {
            console.error("Error exchanging coins:", error);
            setError("Failed to process exchange. Please try again.");
        } finally {
            setExchanging(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-slate-900 tracking-wide uppercase">Exchange</span>
                    <span className="text-xs text-slate-500 font-medium">Coin to ETB</span>
                </div>
                <div className="w-10" /> {/* Spacer for centering */}
            </header>

            <main className="flex-1 flex flex-col px-6 pt-4 space-y-6 pb-32 overflow-y-auto">
                {/* Exchange Rate Card */}
                <section className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-[2rem] p-6 shadow-2xl shadow-violet-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <TrendingUp size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Current Rate</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-white">{exchangeRate}</span>
                                    <span className="text-sm font-bold text-white/80">ETB</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Per Coin</p>
                            <div className="flex items-center gap-1 justify-end mt-1">
                                <Coins size={16} className="text-emerald-300" />
                                <span className="text-sm font-bold text-white">1 Coin</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Balance Display */}
                <section className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Available Coins</p>
                            <div className="flex items-center gap-2">
                                <Coins size={24} className="text-emerald-600" />
                                <span className="text-3xl font-black text-slate-900">{Number(userData?.teamIncome || 0).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <Coins size={32} className="text-emerald-600" />
                        </div>
                    </div>
                </section>

                {/* Exchange Form */}
                <section className="bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100 space-y-6">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Exchange Amount</h3>

                    {/* Coin Input */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coins to Exchange</label>
                            <span className="text-[10px] font-black text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Min: 100</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={coinAmount}
                                onChange={(e) => setCoinAmount(e.target.value)}
                                placeholder="Min 100"
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 text-2xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl">
                                <Coins size={18} className="text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-600">COIN</span>
                            </div>
                        </div>
                    </div>

                    {/* Exchange Arrow */}
                    <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <ArrowLeftRight size={24} className="text-white rotate-90" />
                        </div>
                    </div>

                    {/* ETB Preview */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">You Will Receive</label>
                        <div className="relative">
                            <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl px-4 py-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-black text-slate-900">{etbPreview.toLocaleString()}</span>
                                    <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-xl">
                                        <Banknote size={18} className="text-blue-600" />
                                        <span className="text-sm font-bold text-blue-600">ETB</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                            <AlertCircle size={20} className="text-red-600 shrink-0" />
                            <span className="text-sm font-bold text-red-600">{error}</span>
                        </div>
                    )}

                    {/* Exchange Button */}
                    <button
                        onClick={handleExchange}
                        disabled={exchanging || !coinAmount || parseFloat(coinAmount) < 100}
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {exchanging ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <ArrowLeftRight size={20} />
                                <span>Exchange Now</span>
                            </>
                        )}
                    </button>
                </section>

                {/* Success Modal */}
                {showSuccess && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-6 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="flex flex-col items-center text-center space-y-8">
                                {/* Success Icon */}
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-in zoom-in duration-500 shadow-xl shadow-emerald-500/30">
                                    <CheckCircle2 size={48} className="text-white" />
                                </div>

                                {/* Title & Message */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 mb-2">Exchange Successful!</h3>
                                        <p className="text-sm text-slate-500 font-medium">Transaction completed successfully</p>
                                    </div>

                                    {/* Simplified Descriptive Message */}
                                    <div className="px-4 py-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl"></div>
                                        <div className="relative z-10 flex flex-col items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-black text-emerald-600">-{exchangedCoins.toLocaleString()}</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Coins</span>
                                            </div>
                                            <div className="w-8 h-[2px] bg-slate-200 rounded-full"></div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black text-blue-600">+{exchangedETB.toLocaleString()}</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ETB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* OK Button */}
                                <button
                                    onClick={() => setShowSuccess(false)}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-95 transition-all"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
