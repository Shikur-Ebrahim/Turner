"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ChevronLeft,
    Loader2,
    Calendar,
    CheckCircle2,
    Clock,
    TrendingDown,
    Building2,
    ShieldCheck,
    History,
    AlertCircle,
    Copy,
    Check,
    Banknote,
    TrendingUp,
    XCircle
} from "lucide-react";
import { toast } from "sonner";

export default function WithdrawalRecordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }

            const q = query(
                collection(db, "Withdrawals"),
                where("userId", "==", currentUser.uid)
            );

            const unsubscribeDocs = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as any[];

                // Client-side sorting for history consistency
                const sorted = data.sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                });

                setRecords(sorted);
                setLoading(false);
            });

            return () => unsubscribeDocs();
        });

        return () => unsubscribeAuth();
    }, [router]);

    const { pending, history, stats } = useMemo(() => {
        const p = records.filter(r => r.status === 'pending');
        const h = records.filter(r => r.status !== 'pending');

        return {
            pending: p,
            history: h,
            stats: {
                totalSettled: records
                    .filter(r => r.status === 'verified' || r.status === 'approved' || r.status === 'success')
                    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
                inPipeline: records
                    .filter(r => r.status === 'pending')
                    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
            }
        };
    }, [records]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
            {/* Header Mirroring Admin Section */}
            <header className="sticky top-0 bg-white/90 backdrop-blur-3xl px-6 py-6 flex items-center justify-between z-50 border-b border-slate-100/60">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 active:scale-90 transition-all"
                    >
                        <ChevronLeft size={24} strokeWidth={3} />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">My Records</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction History</span>
                        </div>
                    </div>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
                    <History size={20} strokeWidth={2.5} />
                </div>
            </header>

            <main className="p-4 sm:p-8 space-y-8 max-w-lg mx-auto w-full">
                {/* Visual Stats Block - User Side */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden flex flex-col justify-between h-32">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Withdrawn</p>
                            <p className="text-xl font-black text-slate-900 tracking-tighter">
                                {stats.totalSettled.toLocaleString()} <span className="text-[10px] text-slate-300 font-bold">ETB</span>
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-[2rem] shadow-2xl shadow-slate-900/10 relative overflow-hidden flex flex-col justify-between h-32 group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-2 relative z-10">
                            <Clock size={20} className="animate-pulse" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">In Process</p>
                            <p className="text-xl font-black text-white tracking-tighter">
                                {stats.inPipeline.toLocaleString()} <span className="text-[10px] text-white/20 font-bold">ETB</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-10 pb-20">
                    {/* PENDING SECTION - Automatic Top */}
                    {pending.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 px-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <AlertCircle size={18} strokeWidth={3} />
                                </div>
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Pending Review ({pending.length})</h3>
                                <div className="flex-1 h-[1px] bg-amber-200/30"></div>
                            </div>
                            <div className="space-y-6">
                                {pending.map(item => (
                                    <UserWithdrawalCard key={item.id} item={item} status="pending" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* HISTORY SECTION */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                                <History size={18} strokeWidth={3} />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Verification History</h3>
                            <div className="flex-1 h-[1px] bg-slate-100"></div>
                        </div>
                        {history.length > 0 ? (
                            <div className="space-y-6">
                                {history.map(item => (
                                    <UserWithdrawalCard key={item.id} item={item} status={item.status} />
                                ))}
                            </div>
                        ) : pending.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-slate-100 border-2 border-slate-50">
                                    <Banknote size={32} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No activity detected</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>
        </div>
    );
}

function UserWithdrawalCard({ item, status }: any) {
    const isPending = status === 'pending';
    const isSuccess = status === 'verified' || status === 'approved' || status === 'success';
    const isFailed = status === 'rejected' || status === 'failed';

    return (
        <div
            className={`relative rounded-[3rem] overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 shadow-2xl border-2
                ${isPending ? 'bg-amber-50 border-amber-300 shadow-amber-200/40' :
                    isSuccess ? 'bg-white border-emerald-200 shadow-slate-200/50' :
                        'bg-red-50 border-red-200 shadow-red-200/20'}
            `}
        >
            {/* Top Balance Line Boundary */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${isPending ? 'bg-amber-400' : isSuccess ? 'bg-emerald-400' : 'bg-red-400'}`}></div>

            <div className="relative p-7 space-y-6 z-10">
                {/* Amount Row */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className={`w-fit px-3 py-1.5 rounded-full border shadow-sm text-[9px] font-black uppercase tracking-widest flex items-center gap-2
                            ${isPending ? 'bg-amber-100 text-amber-700 border-amber-300/30' :
                                isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200/30' :
                                    'bg-red-100 text-red-700 border-red-300/30'}`}>
                            {isPending ? <Clock size={10} className="animate-pulse" /> : isSuccess ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                            {status}
                        </div>
                        <div className="flex items-baseline gap-1 mt-3">
                            <span className={`text-4xl font-black tracking-tighter ${isPending ? 'text-slate-900' : isSuccess ? 'text-emerald-600' : 'text-red-600'}`}>
                                {Number(item.actualReceipt).toLocaleString()}
                            </span>
                            <span className="text-xs font-black text-slate-300">ETB</span>
                        </div>
                    </div>

                    <div className="w-16 h-16 rounded-[1.8rem] bg-white shadow-2xl flex items-center justify-center border-2 border-slate-50 p-2">
                        {item.bankDetails?.bankLogoUrl ? (
                            <img src={item.bankDetails.bankLogoUrl} alt="Bank" className="w-full h-full object-contain rounded-xl" />
                        ) : (
                            <Building2 className="text-slate-200" size={32} />
                        )}
                    </div>
                </div>

                {/* Financial Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-4 border border-white/80 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Amount</p>
                        <p className="text-xs font-black text-slate-700">{Number(item.amount).toLocaleString()} ETB</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] p-4 border border-white/80 shadow-sm">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Fee</p>
                        <p className="text-xs font-black text-red-500">-{Number(item.fee).toLocaleString()} ETB</p>
                    </div>
                </div>

                {/* Bank Account Logic (Admin Style - Static on User Side) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1 font-black text-[9px] uppercase tracking-widest">
                        <span className="text-slate-400">Target Account</span>
                        <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">{item.bankDetails?.bankName}</span>
                    </div>
                    <div
                        className="w-full bg-slate-900 rounded-[1.8rem] p-5 flex items-center justify-center shadow-xl transition-all"
                    >
                        <span className="text-base font-mono font-black text-indigo-400 tracking-[0.2em]">
                            {item.bankDetails?.accountNumber}
                        </span>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Account Name: <span className="text-slate-900">{item.bankDetails?.holderName}</span></p>
                </div>

                {/* Status Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300" />
                        <p className="text-[10px] font-black text-slate-400 uppercase">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    {isSuccess ? (
                        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl text-emerald-600">
                            <ShieldCheck size={14} strokeWidth={3} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Settled</span>
                        </div>
                    ) : isPending ? (
                        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl text-amber-600 animate-pulse">
                            <Clock size={14} strokeWidth={3} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Reviewing</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl text-red-600">
                            <XCircle size={14} strokeWidth={3} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Failed</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
