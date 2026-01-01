"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    ChevronLeft,
    Loader2,
    CheckCircle2,
    Clock,
    CreditCard,
    Calendar,
    Hash,
    Building2,
    User as UserIcon,
    DollarSign,
    FileText,
    TrendingUp,
    Activity,
    Zap,
    Shield
} from "lucide-react";

interface RechargeRecord {
    id: string;
    FTcode: string;
    accountHolderName: string;
    accountNumber: string;
    amount: number;
    bankName: string;
    paymentMethod: string;
    phoneNumber: string;
    status: string;
    timestamp: any;
    userId: string;
    verifiedAt?: any;
}

export default function RechargeRecordsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [records, setRecords] = useState<RechargeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "verified" | "under review">("all");
    const [paymentMethodLogos, setPaymentMethodLogos] = useState<Record<string, string>>({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);
            await fetchRechargeRecords(currentUser.uid);
            await fetchPaymentMethodLogos();
        });

        return () => unsubscribe();
    }, [router]);

    const fetchPaymentMethodLogos = async () => {
        try {
            const methodsQuery = query(collection(db, "paymentMethods"));
            const querySnapshot = await getDocs(methodsQuery);
            const logos: Record<string, string> = {};

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.methodName && data.logoUrl) {
                    logos[data.methodName.toLowerCase()] = data.logoUrl;
                }
            });

            setPaymentMethodLogos(logos);
        } catch (error) {
            console.error("Error fetching payment method logos:", error);
        }
    };

    const fetchRechargeRecords = async (userId: string) => {
        try {
            const q = query(
                collection(db, "RechargeReview"),
                where("userId", "==", userId)
            );

            const querySnapshot = await getDocs(q);
            const fetchedRecords: RechargeRecord[] = [];

            querySnapshot.forEach((doc) => {
                fetchedRecords.push({
                    id: doc.id,
                    ...doc.data()
                } as RechargeRecord);
            });

            // Sort by timestamp descending (newest first) on client side
            fetchedRecords.sort((a, b) => {
                const timeA = a.timestamp?.toMillis?.() || 0;
                const timeB = b.timestamp?.toMillis?.() || 0;
                return timeB - timeA;
            });

            setRecords(fetchedRecords);
        } catch (error) {
            console.error("Error fetching recharge records:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case "verified":
                return {
                    icon: CheckCircle2,
                    color: "emerald",
                    bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
                    lightBg: "bg-emerald-50",
                    textColor: "text-emerald-600",
                    borderColor: "border-emerald-200",
                    label: "Verified",
                    glow: "shadow-emerald-500/20"
                };
            case "under review":
            case "underreview":
            case "review":
                return {
                    icon: Clock,
                    color: "blue",
                    bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600",
                    lightBg: "bg-blue-50",
                    textColor: "text-blue-600",
                    borderColor: "border-blue-200",
                    label: "Under Review",
                    glow: "shadow-blue-500/20"
                };
            default:
                return {
                    icon: Clock,
                    color: "blue",
                    bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600",
                    lightBg: "bg-blue-50",
                    textColor: "text-blue-600",
                    borderColor: "border-blue-200",
                    label: "Under Review",
                    glow: "shadow-blue-500/20"
                };
        }
    };

    const filteredRecords = records.filter(record => {
        if (filter === "all") return true;
        if (filter === "under review") {
            const status = record.status.toLowerCase();
            return status === "under review" || status === "underreview" || status === "review";
        }
        return record.status.toLowerCase() === filter;
    });

    const stats = {
        total: records.length,
        verified: records.filter(r => r.status.toLowerCase() === "verified").length,
        underReview: records.filter(r => {
            const status = r.status.toLowerCase();
            return status === "under review" || status === "underreview" || status === "review";
        }).length,
        totalAmount: records
            .filter(r => r.status.toLowerCase() === "verified")
            .reduce((sum, r) => sum + r.amount, 0)
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Loading Records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Premium Header */}
            <header className="fixed top-0 left-0 right-0 z-[60] px-6 pt-12 pb-6 bg-gradient-to-b from-blue-700 via-blue-600/90 to-transparent backdrop-blur-[2px]">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 transition-transform"
                    >
                        <ChevronLeft className="text-white" size={24} />
                    </button>
                    <h1 className="text-lg font-black text-white tracking-[0.2em] uppercase">Recharge History</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="relative z-10 pt-32 bg-white rounded-t-[3.5rem] min-h-screen p-6 pb-52 overflow-hidden shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-100 to-transparent"></div>
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] animate-pulse"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s' }}></div>

                {/* Elite Stats Grid */}
                <div className="relative mb-8">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Total Records */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-[2rem] p-6 shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `radial-gradient(#ffffff 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}></div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[40px] -mr-16 -mt-16"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                            <FileText className="text-blue-400" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-200/60 uppercase tracking-[0.2em]">Total</p>
                                            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Records</p>
                                        </div>
                                    </div>
                                    <p className="text-4xl font-black text-white tracking-tighter drop-shadow-md">{stats.total}</p>
                                </div>
                            </div>
                        </div>

                        {/* Verified Amount */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                            <div className="relative bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 rounded-[2rem] p-6 shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `radial-gradient(#ffffff 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}></div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[40px] -mr-16 -mt-16"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                            <DollarSign className="text-emerald-400" size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-200/60 uppercase tracking-[0.2em]">Verified</p>
                                            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Amount</p>
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{stats.totalAmount.toLocaleString()}</p>
                                        <span className="text-sm font-black text-emerald-400 uppercase">ETB</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Verified</p>
                            </div>
                            <p className="text-2xl font-black text-emerald-900">{stats.verified}</p>
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider">Under Review</p>
                            </div>
                            <p className="text-2xl font-black text-blue-900">{stats.underReview}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { key: "all", label: "All", icon: Activity },
                        { key: "verified", label: "Verified", icon: CheckCircle2 },
                        { key: "under review", label: "Under Review", icon: Clock }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`flex items-center gap-2 px-3 py-3 rounded-2xl font-black text-xs whitespace-nowrap transition-all ${filter === tab.key
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/30 scale-105"
                                : "bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-300 active:scale-95"
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Records List */}
                {filteredRecords.length === 0 ? (
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-gray-100 to-transparent rounded-[3rem] opacity-50"></div>
                        <div className="relative bg-white rounded-[3rem] p-16 text-center border-2 border-gray-100 shadow-xl">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <FileText className="text-gray-400" size={40} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Records Found</h3>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                {filter !== "all" ? `No ${filter} recharge records yet` : "You don't have any recharge records yet"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredRecords.map((record) => {
                            const statusConfig = getStatusConfig(record.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={record.id}
                                    className="relative group"
                                >
                                    {/* Glow Effect */}
                                    <div className={`absolute -inset-1 ${statusConfig.bgColor} rounded-[2rem] blur-xl opacity-0 group-hover:opacity-20 transition-opacity`}></div>

                                    <div className="relative bg-white rounded-[2rem] p-6 border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all overflow-hidden">
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(#2563eb 0.5px, transparent 0.5px)`, backgroundSize: '16px 16px' }}></div>

                                        {/* Header */}
                                        <div className="relative z-10 flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                {/* Payment Method Logo - Circular */}
                                                <div className="relative w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xl overflow-hidden border-2 border-gray-100">
                                                    {paymentMethodLogos[record.paymentMethod.toLowerCase()] ? (
                                                        <img
                                                            src={paymentMethodLogos[record.paymentMethod.toLowerCase()]}
                                                            alt={record.paymentMethod}
                                                            className="w-10 h-10 object-contain"
                                                        />
                                                    ) : (
                                                        <StatusIcon className="text-gray-400" size={24} />
                                                    )}
                                                </div>

                                                <div>
                                                    {/* Status Badge */}
                                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl ${statusConfig.lightBg} ${statusConfig.borderColor} border-2 mb-2`}>
                                                        <div className={`w-2 h-2 rounded-full ${statusConfig.textColor.replace('text-', 'bg-')} animate-pulse`}></div>
                                                        <span className={`text-xs font-black uppercase tracking-widest ${statusConfig.textColor}`}>
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>
                                                    {/* Timestamp */}
                                                    <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                                        <Calendar size={12} />
                                                        {formatDate(record.timestamp)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-gray-900 tracking-tighter">{record.amount.toLocaleString()}</p>
                                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest">ETB</p>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="relative z-10 grid grid-cols-2 gap-4 pt-5 border-t-2 border-gray-100">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Hash size={14} className="text-blue-500" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">FT Code</p>
                                                </div>
                                                <p className="text-sm font-black text-gray-900 truncate">{record.FTcode}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <CreditCard size={14} className="text-purple-500" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Method</p>
                                                </div>
                                                <p className="text-sm font-black text-gray-900 capitalize">{record.paymentMethod}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Building2 size={14} className="text-emerald-500" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Bank</p>
                                                </div>
                                                <p className="text-sm font-black text-gray-900 truncate">{record.bankName}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <UserIcon size={14} className="text-orange-500" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Account</p>
                                                </div>
                                                <p className="text-sm font-black text-gray-900 truncate">{record.accountHolderName}</p>
                                            </div>
                                        </div>

                                        {/* Verified At */}
                                        {record.verifiedAt && (
                                            <div className="relative z-10 mt-5 pt-5 border-t-2 border-gray-100">
                                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                                                    <Shield size={14} className="text-emerald-600" />
                                                    <p className="text-xs font-bold text-emerald-600">
                                                        Verified on {formatDate(record.verifiedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
