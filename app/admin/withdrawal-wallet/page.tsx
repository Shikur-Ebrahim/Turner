"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    doc,
    runTransaction,
    Timestamp,
    increment,
    orderBy
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    CheckCircle2,
    Clock,
    Search,
    Loader2,
    RefreshCcw,
    Menu,
    Copy,
    Check,
    Banknote,
    User,
    Phone,
    Calendar,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    History,
    AlertCircle
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { toast } from "sonner";

export default function WithdrawalWalletPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmAction, setConfirmAction] = useState<{ type: 'verify', data: any } | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            const isMaster = localStorage.getItem("admin_session") === "true";
            if (!user && !isMaster) {
                router.push("/admin");
                return;
            }
            setLoading(false);
        });

        const q = query(
            collection(db, "Withdrawals"),
            orderBy("createdAt", "desc")
        );

        const unsubscribeWithdrawals = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWithdrawals(data);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeWithdrawals();
        };
    }, [router]);

    const handleVerify = async (withdrawal: any) => {
        if (verifying) return;
        setVerifying(withdrawal.id);
        setConfirmAction(null);

        try {
            await runTransaction(db, async (transaction) => {
                const userDocRef = doc(db, "users", withdrawal.userId);
                const withdrawalRef = doc(db, "Withdrawals", withdrawal.id);

                const userDocSnap = await transaction.get(userDocRef);
                if (!userDocSnap.exists()) throw "User does not exist!";

                const amount = Number(withdrawal.amount);

                transaction.update(withdrawalRef, {
                    status: "verified",
                    verifiedAt: Timestamp.now()
                });

                transaction.update(userDocRef, {
                    totalWithdrawal: increment(amount)
                });

                // SEND NOTIFICATION TO USER
                const notifRef = doc(collection(db, "UserNotifications"));
                transaction.set(notifRef, {
                    userId: withdrawal.userId,
                    type: "withdrawal_verified",
                    amount: amount,
                    status: "verified",
                    read: false,
                    createdAt: Timestamp.now()
                });
            });

            toast.success(`Withdrawal of ETB ${withdrawal.amount} verified!`);
        } catch (error) {
            console.error("Verification error:", error);
            toast.error(typeof error === 'string' ? error : "Failed to verify");
        } finally {
            setVerifying(null);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.info("Account Number Copied");
    };

    // Organized Data
    const { pending, history, stats } = useMemo(() => {
        const filtered = withdrawals.filter(w =>
            w.userPhone?.includes(searchTerm) ||
            w.amount?.toString().includes(searchTerm) ||
            w.bankDetails?.accountNumber?.includes(searchTerm)
        );

        const p = filtered.filter(w => w.status === 'pending');
        const h = filtered.filter(w => w.status !== 'pending');

        return {
            pending: p,
            history: h,
            stats: {
                totalVerified: withdrawals
                    .filter(w => w.status === 'verified' || w.status === 'approved')
                    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
                totalPending: withdrawals
                    .filter(w => w.status === 'pending')
                    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
                pendingCount: withdrawals.filter(w => w.status === 'pending').length
            }
        };
    }, [withdrawals, searchTerm]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin relative z-10" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 flex">
            {/* Confirmation Drawer */}
            {confirmAction && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 transition-all">
                    <div className="w-full max-w-sm bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl space-y-8 animate-in slide-in-from-bottom duration-300">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center ring-[12px] ring-indigo-50/50">
                                <ShieldCheck size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">Authorize Payment?</h3>
                            <p className="text-sm text-slate-500 font-medium px-4">
                                Confirming <span className="text-indigo-600 font-black">ETB {Number(confirmAction.data.amount).toLocaleString()}</span> payout for {confirmAction.data.userPhone}.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleVerify(confirmAction.data)}
                                disabled={verifying === confirmAction.data.id}
                                className="w-full h-18 rounded-[1.8rem] bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest transition-all shadow-2xl active:scale-95 disabled:opacity-50 py-5 flex items-center justify-center gap-3"
                            >
                                {verifying === confirmAction.data.id ? <Loader2 className="animate-spin" size={24} /> : 'Process Payout Now'}
                            </button>
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="w-full h-14 rounded-2xl bg-white text-slate-400 font-bold text-sm tracking-tight hover:bg-slate-50 transition-all mb-4 sm:mb-0"
                            >
                                Cancel Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col min-h-screen max-w-full overflow-hidden">
                <header className="sticky top-0 bg-white/90 backdrop-blur-3xl px-6 py-6 flex items-center justify-between z-50 border-b border-slate-100/60">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-all"
                        >
                            <Menu size={24} strokeWidth={3} />
                        </button>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Vault Control</h2>
                                {stats.pendingCount > 0 && (
                                    <div className="flex items-center justify-center min-w-[2.2rem] h-9 px-3 bg-red-500 text-white rounded-[1rem] text-xs font-black shadow-lg shadow-red-500/30 animate-bounce">
                                        {stats.pendingCount}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Settlement Engine</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-14 h-14 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 active:rotate-180 transition-all duration-700 shadow-sm"
                    >
                        <RefreshCcw size={22} strokeWidth={2.5} />
                    </button>
                </header>

                <div className="p-4 sm:p-8 space-y-10 max-w-lg mx-auto w-full">
                    {/* Visual Stats Block */}
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between h-36">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Settled</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                                    {stats.totalVerified > 1000 ? `${(stats.totalVerified / 1000).toPrecision(3)}k` : stats.totalVerified} <span className="text-[10px] text-slate-300">ETB</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-900/10 flex flex-col justify-between h-36 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-2 relative z-10">
                                <Clock size={24} className="animate-pulse" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Active Pipeline</p>
                                <p className="text-2xl font-black text-white tracking-tighter leading-none">
                                    {stats.totalPending > 1000 ? `${(stats.totalPending / 1000).toPrecision(3)}k` : stats.totalPending} <span className="text-[10px] text-white/20">ETB</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Elite Universal Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none">
                            <Search size={22} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="SEARCH BY PHONE OR KEY..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-18 pl-16 pr-6 bg-white border-2 border-slate-100 rounded-[2.2rem] focus:outline-none focus:border-indigo-500/30 focus:ring-[12px] focus:ring-indigo-500/5 transition-all text-sm font-black tracking-widest uppercase placeholder:text-slate-200 shadow-sm"
                        />
                    </div>

                    <div className="space-y-12 pb-24">
                        {/* PENDING SECTION */}
                        {pending.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                        <AlertCircle size={18} strokeWidth={3} />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Pending Actions ({pending.length})</h3>
                                    <div className="flex-1 h-[2px] bg-amber-100/50 rounded-full"></div>
                                </div>
                                <div className="space-y-6">
                                    {pending.map(item => (
                                        <WithdrawalCard key={item.id} item={item} isPending={true} verifying={verifying} setConfirmAction={setConfirmAction} copyToClipboard={copyToClipboard} copiedId={copiedId} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* HISTORY SECTION */}
                        {history.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                                        <History size={18} strokeWidth={3} />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Processed History</h3>
                                    <div className="flex-1 h-[2px] bg-slate-100 rounded-full"></div>
                                </div>
                                <div className="space-y-6">
                                    {history.map(item => (
                                        <WithdrawalCard key={item.id} item={item} isPending={false} verifying={verifying} setConfirmAction={setConfirmAction} copyToClipboard={copyToClipboard} copiedId={copiedId} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {pending.length === 0 && history.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                                    <Banknote size={48} strokeWidth={1} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Vault Empty</p>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">No transactions matched your query</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-component for clarity and re-renders
function WithdrawalCard({ item, isPending, verifying, setConfirmAction, copyToClipboard, copiedId }: any) {
    return (
        <div
            className={`relative rounded-[3rem] overflow-hidden transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 shadow-2xl border-2
                ${isPending
                    ? 'bg-amber-50 border-amber-300 shadow-amber-200/40'
                    : 'bg-white border-emerald-200 shadow-slate-200/50'}
            `}
        >
            {/* Top Accent Line (Boundary) */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${isPending ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>

            {isPending && <div className="absolute inset-0 bg-white/40 pointer-events-none"></div>}

            <div className="relative p-7 space-y-7 z-10">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border shadow-sm
                                ${isPending ? 'bg-amber-100 text-amber-700 border-amber-300/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200/50'}`}>
                                {isPending ? '🔴 Action Required' : '🟢 Verified'}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-3">
                            <span className={`text-5xl font-black tracking-tighter ${isPending ? 'text-slate-900' : 'text-emerald-600'}`}>
                                {Number(item.actualReceipt).toLocaleString()}
                            </span>
                            <span className="text-xs font-black text-slate-300">ETB</span>
                        </div>
                    </div>

                    <div className="w-16 h-16 rounded-[1.8rem] bg-white shadow-2xl flex items-center justify-center border border-slate-100 p-2">
                        {item.bankDetails?.bankLogoUrl ? (
                            <img src={item.bankDetails.bankLogoUrl} alt="Bank" className="w-full h-full object-contain rounded-xl" />
                        ) : (
                            <Banknote className="text-slate-200" size={32} />
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-xl rounded-[1.8rem] p-5 border border-white/80 shadow-sm transition-all hover:bg-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Phone size={12} className="text-indigo-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 leading-none">{item.userPhone}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl rounded-[1.8rem] p-5 border border-white/80 shadow-sm transition-all hover:bg-white">
                        <div className="flex items-center gap-2 mb-2">
                            <User size={12} className="text-indigo-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</span>
                        </div>
                        <p className="text-xs font-black text-slate-800 leading-none truncate uppercase tracking-tighter">{item.bankDetails?.holderName}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Vault</span>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-3 py-1 rounded-lg">{item.bankDetails?.bankName}</span>
                    </div>
                    <button
                        onClick={() => copyToClipboard(item.bankDetails?.accountNumber, item.id)}
                        className="w-full bg-slate-900 rounded-[1.8rem] p-6 flex items-center justify-between group overflow-hidden relative shadow-2xl active:scale-95 transition-all"
                    >
                        <span className="text-lg font-mono font-black text-indigo-400 tracking-[0.25em] drop-shadow-sm">
                            {item.bankDetails?.accountNumber}
                        </span>
                        <div className={`p-3 rounded-2xl transition-all ${copiedId === item.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}>
                            {copiedId === item.id ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2.5} />}
                        </div>
                    </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Fee Deduced</p>
                            <p className="text-xs font-black text-red-500 tracking-tighter leading-none">-{Number(item.fee).toLocaleString()} ETB</p>
                        </div>
                    </div>
                </div>

                {isPending ? (
                    <button
                        onClick={() => setConfirmAction({ type: 'verify', data: item })}
                        disabled={verifying === item.id}
                        className="w-full h-18 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-indigo-600/30 transition-all group active:scale-95 py-5"
                    >
                        {verifying === item.id ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>Authorize & Release <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} /></>
                        )}
                    </button>
                ) : (
                    <div className="w-full h-18 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center gap-4 py-5 shadow-sm">
                        <ShieldCheck className="text-emerald-600" size={24} strokeWidth={2.5} />
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">Settlement Authenticated</span>
                    </div>
                )}
            </div>
        </div>
    );
}
