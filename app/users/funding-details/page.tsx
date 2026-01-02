"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ChevronLeft,
    Loader2,
    TrendingUp,
    TrendingDown,
    Package,
    Calendar,
    Timer,
    Zap,
    Coins,
    Gem,
    LayoutDashboard,
    ArrowRight
} from "lucide-react";

export default function FundingDetailsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<Record<string, any>>({});

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }

            // Fetch User Orders
            const qOrders = query(
                collection(db, "UserOrders"),
                where("userId", "==", currentUser.uid)
            );

            const unsubscribeDocs = onSnapshot(qOrders, async (snapshot) => {
                const ordersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as any[];

                // Fetch unique product details for images
                const productIds = Array.from(new Set(ordersData.map(o => o.productId)));
                const productMap: Record<string, any> = { ...products };

                for (const pid of productIds) {
                    if (!productMap[pid]) {
                        const pDoc = await getDoc(doc(db, "Products", pid));
                        if (pDoc.exists()) {
                            productMap[pid] = pDoc.data();
                        }
                    }
                }

                setProducts(productMap);
                setOrders(ordersData);
                setLoading(false);
            });

            return () => unsubscribeDocs();
        });

        return () => unsubscribeAuth();
    }, [router]);

    const formatDate = (dateValue: any) => {
        if (!dateValue) return "N/A";
        const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
        if (isNaN(date.getTime())) return "N/A";

        return new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date) + " UTC+3";
    };

    const calculateRemainingDays = (order: any) => {
        if (order.remainingDays !== undefined) return order.remainingDays;

        // Fallback calculation if not synced
        const dateValue = order.purchaseDate || order.createdAt;
        const purchaseDate = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
        if (isNaN(purchaseDate.getTime())) return 0;

        const now = new Date();
        const diffDays = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = (order.contractPeriod || 0) - diffDays;
        return remaining > 0 ? remaining : 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white pb-20 font-sans">
            {/* Immersive Header */}
            <header className="px-6 pt-10 pb-8 flex items-center gap-5 sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90 border border-white/5"
                >
                    <ChevronLeft size={24} className="text-white" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">Portfolio</h1>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Asset Intelligence</p>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <TrendingUp size={20} className="text-white" />
                </div>
            </header>

            <main className="p-6 space-y-8">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
                        <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
                            <Gem size={40} className="text-slate-700 relative z-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest leading-none">Market Vacant</h3>
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter">No active funding plans detected</p>
                        </div>
                        <button
                            onClick={() => router.push('/users/product')}
                            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                        >
                            Explore Plans
                        </button>
                    </div>
                ) : (
                    orders.map((order) => {
                        const product = products[order.productId] || {};
                        const remaining = calculateRemainingDays(order);
                        const progress = ((order.contractPeriod - remaining) / order.contractPeriod) * 100;
                        const totalProfit = (order.dailyIncome || 0) * (order.contractPeriod - remaining);

                        return (
                            <div
                                key={order.id}
                                className="relative bg-white/5 rounded-[2.8rem] border border-white/5 p-7 shadow-2xl overflow-hidden group hover:border-white/10 transition-all active:scale-[0.99]"
                            >
                                {/* Glow Background */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                {/* Product Image & Header */}
                                <div className="flex gap-6 mb-8 relative z-10">
                                    <div className="w-24 h-24 rounded-[1.8rem] bg-slate-900 border border-white/5 overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                        {product.imageUrl ? (
                                            <img src={product.imageUrl} alt={order.productName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package size={32} className="text-slate-800" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 py-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-black text-white leading-none tracking-tighter uppercase">{order.productName}</h3>
                                            <div className="px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em]">Active</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Timer size={12} className="text-blue-400" />
                                            <p className="text-[10px] font-black text-blue-400/80 uppercase tracking-widest">Plan Cycle: {order.contractPeriod} Days</p>
                                        </div>
                                        {/* Simple Progress Bar */}
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Analytics Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Coins size={12} className="text-amber-400" />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Principal</span>
                                        </div>
                                        <p className="text-lg font-black text-white tracking-tighter">{Number(order.price).toLocaleString()} <span className="text-[10px] text-gray-500">ETB</span></p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap size={12} className="text-emerald-400" />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Daily Yield</span>
                                        </div>
                                        <p className="text-lg font-black text-emerald-400 tracking-tighter">{Number(order.dailyIncome).toLocaleString()} <span className="text-[10px] text-emerald-900/40 font-bold">ETB</span></p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 mb-2 text-indigo-400">
                                            <LayoutDashboard size={12} />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Earned</span>
                                        </div>
                                        <p className="text-lg font-black text-indigo-400 tracking-tighter">{totalProfit.toLocaleString()} <span className="text-[10px] text-indigo-900/40 font-bold">ETB</span></p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 mb-2 text-red-400">
                                            <Timer size={12} />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Time Remaining</span>
                                        </div>
                                        <p className="text-lg font-black text-white tracking-tighter">{remaining} <span className="text-[10px] text-red-900/40 font-bold">DAYS</span></p>
                                    </div>
                                </div>

                                {/* Bottom Meta Card */}
                                <div className="bg-gradient-to-br from-slate-900 to-[#1e293b] rounded-2xl p-5 border border-white/5 flex items-center justify-between group-hover:from-slate-800 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                            <Calendar size={18} className="text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Purchase Timeline</p>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                                                {formatDate(order.purchaseDate || order.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all text-slate-500 hover:text-white">
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </main>
        </div>
    );
}
