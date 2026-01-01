"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    AlertCircle,
    CheckCircle2,
    CreditCard,
    Info,
    ArrowRight
} from "lucide-react";

const PRESET_AMOUNTS = [
    7500, 17000, 29000, 45000, 75000,
    130000, 210000, 280000, 350000, 460000
];

export default function RechargePage() {
    const router = useRouter();
    const [amount, setAmount] = useState<string>("7500");
    const [customAmount, setCustomAmount] = useState<string>("");

    const handleAmountSelect = (val: number) => {
        setAmount(val.toString());
        setCustomAmount("");
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            setCustomAmount(val);
            if (val) setAmount(val);
        }
    };

    const handleNext = () => {
        const numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount < 1000) {
            alert("Minimum recharge amount is 1000 ETB");
            return;
        }
        router.push(`/users/payment-method?amount=${amount}`);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-40">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 px-6 py-5 flex items-center justify-between border-b border-slate-100">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 active:scale-90 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-lg font-black tracking-tight uppercase">Recharge</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="pt-28 px-6 space-y-8 max-w-lg mx-auto">
                {/* Amount Display Card */}
                <section className="relative group animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-600/30 relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>

                        <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1">Recharge Amount</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-white text-5xl font-black">{Number(amount).toLocaleString()}</span>
                            <span className="text-indigo-200 font-bold uppercase tracking-widest text-sm">ETB</span>
                        </div>

                        <div className="mt-8 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white/40 w-2/3 rounded-full"></div>
                        </div>
                    </div>
                </section>

                {/* Preset Grid */}
                <section className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {PRESET_AMOUNTS.map((val) => (
                            <button
                                key={val}
                                onClick={() => handleAmountSelect(val)}
                                className={`py-5 rounded-3xl font-black text-sm transition-all active:scale-95 ${amount === val.toString() && !customAmount
                                    ? "bg-white text-indigo-600 shadow-xl shadow-indigo-600/10 border-2 border-indigo-600"
                                    : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"
                                    }`}
                            >
                                {val.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Custom Amount */}
                <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Custom Amount (Min. 1000)</h2>
                    </div>

                    <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                            <CreditCard size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Enter amount..."
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="w-full bg-white border border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-xl font-black placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
                        />
                    </div>
                </section>

                {/* Tips Section */}
                <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <Info size={20} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Important Tips</h3>
                    </div>

                    <ul className="space-y-4">
                        {[
                            "Do not trust recharge account info from any unverified sources. Always use our official app.",
                            "The receiving account changes periodically. Always copy the latest bank details before each recharge.",
                            "After payment, you must provide the 12-digit transaction number to confirm your recharge."
                        ].map((tip, i) => (
                            <li key={i} className="flex gap-4 group">
                                <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                    <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600">{i + 1}</span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed">{tip}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Action Button */}
                <div className="pt-4">
                    <button
                        onClick={handleNext}
                        className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                    >
                        <span>Select Payment Method</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </main>
        </div>
    );
}
