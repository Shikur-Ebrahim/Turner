"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
    ChevronLeft,
    CheckCircle2,
    Building2,
    Loader2
} from "lucide-react";

function PaymentMethodContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0";

    const [loading, setLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, "paymentMethods"),
            where("status", "==", "active")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPaymentMethods(data);
            if (data.length > 0 && !selectedMethod) {
                setSelectedMethod(data[0].id);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedMethod]);

    const handleRecharge = () => {
        if (!selectedMethod) {
            alert("Please select a payment method");
            return;
        }

        const method = paymentMethods.find(m => m.id === selectedMethod);
        const theme = method?.bankDetailType || "regular";
        const validThemes = ["regular", "premium", "digital", "express", "smart", "secure"];
        const targetTheme = validThemes.includes(theme.toLowerCase()) ? theme.toLowerCase() : "regular";

        router.push(`/users/bank-detail/${targetTheme}?amount=${amount}&methodId=${selectedMethod}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-32">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 px-6 py-5 flex items-center justify-between border-b border-slate-100">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 active:scale-90 transition-all font-bold"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-lg font-black tracking-tight uppercase">Recharge</h1>
                <div className="w-10" />
            </header>

            <main className="pt-28 px-6 max-w-lg mx-auto space-y-12">
                {/* Amount Display Section */}
                <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">The amount</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-6xl font-black text-indigo-600 tracking-tighter">
                            {Number(amount).toLocaleString()}
                        </span>
                        <span className="text-6xl font-black text-indigo-600">Br</span>
                    </div>
                </div>

                {/* Selection Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Select payment method</h2>
                    </div>

                    <div className="space-y-4">
                        {paymentMethods.map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                                className={`w-full p-6 rounded-[2.5rem] flex items-center justify-between transition-all duration-500 border-2 ${selectedMethod === method.id
                                    ? "bg-white border-indigo-600 shadow-2xl shadow-indigo-600/10 scale-[1.02]"
                                    : "bg-white border-transparent shadow-sm hover:border-slate-100"
                                    }`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-16 h-16 rounded-full border-4 p-1 flex items-center justify-center overflow-hidden transition-colors ${selectedMethod === method.id ? "border-indigo-600/20 shadow-lg shadow-indigo-600/10" : "border-slate-50 shadow-none"
                                        }`}>
                                        {method.logoUrl ? (
                                            <img src={method.logoUrl} className="w-full h-full object-contain" alt={method.methodName} />
                                        ) : (
                                            <Building2 className="text-slate-200" size={32} />
                                        )}
                                    </div>
                                    <span className={`text-xl font-black transition-colors ${selectedMethod === method.id ? "text-slate-900" : "text-slate-500"
                                        }`}>
                                        {method.methodName}
                                    </span>
                                </div>

                                {selectedMethod === method.id && (
                                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 animate-in zoom-in-50 duration-300">
                                        <CheckCircle2 size={16} fill="white" className="text-indigo-600" />
                                    </div>
                                )}
                            </button>
                        ))}

                        {paymentMethods.length === 0 && (
                            <div className="py-20 text-center space-y-4 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                <Building2 size={48} className="mx-auto text-slate-200" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No payment methods available</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Fixed Bottom Button */}
            <div className="p-6 bg-white pt-10">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleRecharge}
                        disabled={!selectedMethod}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white h-20 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all text-sm"
                    >
                        Recharge
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UserPaymentMethodPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <PaymentMethodContent />
        </Suspense>
    );
}
