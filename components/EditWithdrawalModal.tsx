"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle, Calculator } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface EditWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    withdrawal: any;
    onSave?: () => void;
}

export default function EditWithdrawalModal({ isOpen, onClose, withdrawal, onSave }: EditWithdrawalModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [fee, setFee] = useState<number>(0);
    const [actualReceipt, setActualReceipt] = useState<number>(0);

    const calculateValues = (newAmount: number) => {
        const newFee = newAmount * 0.05; // 5% Fee
        const newActualReceipt = newAmount - newFee; // Amount - Fee

        setFee(newFee);
        setActualReceipt(newActualReceipt);
    };

    useEffect(() => {
        if (withdrawal) {
            const initialAmount = Number(withdrawal.amount || 0);
            setAmount(initialAmount);
            calculateValues(initialAmount);
            setError(null);
        }
    }, [withdrawal, isOpen]);


    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setAmount(val);
        calculateValues(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const withdrawalRef = doc(db, "Withdrawals", withdrawal.id);

            const updates = {
                amount: amount,
                fee: fee,
                actualReceipt: actualReceipt
            };

            await updateDoc(withdrawalRef, updates);

            if (onSave) onSave();
            onClose();
        } catch (err: any) {
            console.error("Error updating withdrawal:", err);
            setError(err.message || "Failed to update withdrawal");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !withdrawal) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
                    <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                        <span className="bg-white/10 p-1.5 rounded-lg text-indigo-400">
                            <Calculator size={16} />
                        </span>
                        Adjust Withdrawal
                    </h3>
                    <button
                        onClick={onClose}
                        type="button"
                        className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Withdrawal Amount (ETB)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    className="w-full pl-4 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 text-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                    placeholder="0.00"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 pointer-events-none">ETB</div>
                            </div>
                        </div>

                        {/* Calculated Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Service Fee ({((fee / amount) * 100 || 5).toFixed(0)}%)</p>
                                <p className="text-lg font-black text-rose-600">-{fee.toLocaleString()} <span className="text-[10px] opacity-50">ETB</span></p>
                            </div>
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Actual Receipt</p>
                                <p className="text-lg font-black text-emerald-600">{actualReceipt.toLocaleString()} <span className="text-[10px] opacity-50">ETB</span></p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl text-center">
                            <p className="text-[10px] text-slate-400 font-medium">
                                Formula: <span className="font-mono text-slate-600">Receipt = Amount - (Amount × 5%)</span>
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
                        >
                            {isLoading ? (
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Save Updates
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
