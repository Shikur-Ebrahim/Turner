"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ChevronLeft,
    Wallet,
    CreditCard,
    AlertCircle,
    ChevronRight,
    Loader2,
    Lock,
    XCircle
} from "lucide-react";

export default function WithdrawalPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [linkedBank, setLinkedBank] = useState<any>(null);
    const [showBankDetails, setShowBankDetails] = useState(false);

    // Error Modal State
    const [errorModal, setErrorModal] = useState<{ show: boolean, message: string } | null>(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            // Fetch User Data for Balance
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeUser = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setUserData(doc.data());
                }
            });

            // Fetch Linked Bank
            const bankRef = doc(db, "Bank", currentUser.uid);
            const unsubscribeBank = onSnapshot(bankRef, (doc) => {
                setLinkedBank(doc.exists() ? doc.data() : null);
                setLoading(false);
            });

            return () => {
                unsubscribeUser();
                unsubscribeBank();
            };
        });

        return () => unsubscribeAuth();
    }, [router]);

    const handleWithdrawClick = () => {
        const numAmount = Number(amount);
        const balance = userData?.balance || 0;

        if (!linkedBank) {
            setErrorModal({ show: true, message: "Please connect a bank account first." });
            return;
        }

        if (!amount || isNaN(numAmount)) {
            setErrorModal({ show: true, message: "Please enter a valid amount." });
            return;
        }

        if (numAmount < 300) {
            setErrorModal({ show: true, message: "Minimum withdrawal amount is 300 ETB." });
            return;
        }

        if (numAmount > 40000) {
            setErrorModal({ show: true, message: "Maximum single withdrawal is 40,000 ETB." });
            return;
        }

        if (numAmount > balance) {
            setErrorModal({ show: true, message: "Insufficient balance to process request." });
            return;
        }

        // Redirect to Security Page with amount as query param
        router.push(`/users/withdraw/security?amount=${amount}`);
    };

    const feePercent = 0.05; // 5% fee
    const withdrawAmount = Number(amount) || 0;
    const fee = withdrawAmount * feePercent;
    const actualReceipt = withdrawAmount - fee;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans pb-10 relative">

            {/* Advanced Error Modal */}
            {errorModal?.show && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-50 rounded-full -ml-16 -mb-16 blur-xl"></div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-2 shadow-inner">
                                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center shadow-sm">
                                    <XCircle size={32} className="text-red-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Request Alert</h3>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed px-2">
                                    {errorModal.message}
                                </p>
                            </div>

                            <button
                                onClick={() => setErrorModal(null)}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
                            >
                                OK, Matches Rule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="px-6 pt-8 pb-6 flex items-center gap-4 bg-white sticky top-0 z-50 border-b border-gray-100">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-700" />
                </button>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Withdrawal</h1>
            </header>

            <main className="p-6 space-y-6">
                {/* Amount Input Card */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <p className="text-sm font-bold opacity-80 mb-4 uppercase tracking-wider">Withdrawal Amount</p>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent text-5xl font-black placeholder:text-white/20 outline-none border-none p-0 z-10 relative"
                        />
                        {amount && <div className="absolute left-0 bottom-1 w-0.5 h-8 bg-white animate-pulse"></div>}
                    </div>
                    {/* Add visual line if needed or keep clean */}
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Available Balance</span>
                        <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                            {Number(userData?.balance || 0).toLocaleString()}
                        </span>
                    </div>

                    <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Single Fee</span>
                        <span className="text-xs font-black text-white bg-blue-400 px-2 py-0.5 rounded-md">5%</span>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-wide">Actual Receipt</span>
                        <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold text-xs">$</div>
                            <span className="text-2xl font-black text-indigo-700">{actualReceipt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Bank Selection */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide ml-2">Select Withdrawal Account</h3>

                    {linkedBank ? (
                        <div
                            className="bg-white rounded-[2rem] p-5 shadow-sm border border-indigo-500 ring-4 ring-indigo-500/5 relative overflow-hidden"
                        >
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-1 border border-gray-100 shadow-sm">
                                    {linkedBank.bankLogoUrl ? (
                                        <img src={linkedBank.bankLogoUrl} alt={linkedBank.bankName} className="w-full h-full object-contain" />
                                    ) : (
                                        <Wallet className="text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-black text-slate-900 truncate tracking-tight">{linkedBank.accountNumber} Account</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{linkedBank.holderName}</p>
                                </div>
                                <div className="text-indigo-200">
                                    <ChevronRight size={20} className="rotate-90" />
                                </div>
                            </div>

                            {/* Permanently Visible Details */}
                            <div className="pt-4 border-t border-dashed border-indigo-100 space-y-3 bg-slate-50/50 -mx-5 -mb-5 p-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bank</span>
                                    <span className="text-[11px] font-bold text-slate-700">{linkedBank.bankName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Holder</span>
                                    <span className="text-[11px] font-bold text-slate-700">{linkedBank.holderName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Number</span>
                                    <span className="text-[11px] font-bold text-slate-700 tracking-wider font-mono">{linkedBank.accountNumber}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => router.push('/users/bank')}
                            className="bg-white rounded-[2rem] p-6 text-center border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/10 transition-colors cursor-pointer"
                        >
                            <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-gray-500 uppercase">No Bank Linked</p>
                            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider mt-1">Tap to Connect Account</p>
                        </div>
                    )}
                </div>

                {/* Usage Tips */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={18} className="text-slate-400" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Withdrawal Rules</h4>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-slate-900">1.</span>
                            Withdrawal time is from 8 am to 5 pm from Monday to Friday.
                        </li>
                        <li className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-slate-900">2.</span>
                            Single withdrawal is 300-40000 Br.
                        </li>
                        <li className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-slate-900">3.</span>
                            Withdrawal will arrive in your account in 2-72 hours.
                        </li>
                        <li className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-slate-900">4.</span>
                            One person can only use one bank card to withdraw money.
                        </li>
                    </ul>
                </div>
            </main>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white p-6 pb-8 border-t border-gray-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                <button
                    onClick={handleWithdrawClick}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Lock size={16} />
                    Withdraw Funds
                </button>
            </div>
        </div>
    );
}
