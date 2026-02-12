"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface EditOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onSave?: () => void;
}

export default function EditOrderModal({ isOpen, onClose, order, onSave }: EditOrderModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        price: 0,
        dailyIncome: 0,
        contractPeriod: 0,
        remainingDays: 0,
    });

    useEffect(() => {
        if (order) {
            setFormData({
                price: Number(order.price || 0),
                dailyIncome: Number(order.dailyIncome || 0),
                contractPeriod: Number(order.contractPeriod || 0),
                remainingDays: Number(order.remainingDays || 0),
            });
            setError(null);
        }
    }, [order, isOpen]);

    if (!isOpen || !order) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const orderRef = doc(db, "UserOrders", order.id);

            // Convert strings to numbers just in case
            const updates = {
                price: Number(formData.price),
                dailyIncome: Number(formData.dailyIncome),
                contractPeriod: Number(formData.contractPeriod),
                remainingDays: Number(formData.remainingDays),
            };

            await updateDoc(orderRef, updates);

            if (onSave) onSave();
            onClose();
        } catch (err: any) {
            console.error("Error updating order:", err);
            setError(err.message || "Failed to update order");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                        <span className="bg-white/20 p-1.5 rounded-lg">
                            <Save size={14} />
                        </span>
                        Edit Order
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Price */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price (ETB)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/20 transition-all"
                            />
                        </div>

                        {/* Daily Income */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Income</label>
                            <input
                                type="number"
                                name="dailyIncome"
                                value={formData.dailyIncome}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/20 transition-all"
                            />
                        </div>

                        {/* Contract Period */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contract (Days)</label>
                            <input
                                type="number"
                                name="contractPeriod"
                                value={formData.contractPeriod}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/20 transition-all"
                            />
                        </div>

                        {/* Remaining Days */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remaining Days</label>
                            <input
                                type="number"
                                name="remainingDays"
                                value={formData.remainingDays}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
                        >
                            {isLoading ? (
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
