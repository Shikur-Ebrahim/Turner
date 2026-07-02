"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import {
    ChevronLeft,
    AlertCircle,
    CheckCircle2,
    CreditCard,
    Info,
    ArrowRight,
    Loader2
} from "lucide-react";


// Default fallback in case Firestore fetch fails
const DEFAULT_PRESETS = [
    4500, 12550, 35500, 65550, 135550,
    250500, 450500, 600550, 850500, 1500000, 3550050
];

function RechargeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [language, setLanguage] = useState<"english" | "amharic">("english");

    const translations = {
        english: {
            rechargeTitle: "Recharge",
            rechargeAmount: "Recharge Amount",
            etb: "ETB",
            loadingPresets: "Loading Presets...",
            customAmountLabel: "Custom Amount",
            minLabel: "Min.",
            placeholderAmount: "Enter amount...",
            importantTips: "Important Tips",
            tip1: "Do not trust recharge account info from any unverified sources. Always use our official app.",
            tip2: "The receiving account changes periodically. Always copy the latest bank details before each recharge.",
            tip3: "After payment, you must provide the 12-digit transaction number to confirm your recharge.",
            selectPaymentMethod: "Pay Now",
            accessRestricted: "Access Restricted",
            okUnderstood: "OK, Understood",
            minRechargeError: "Minimum recharge amount is",
        },
        amharic: {
            rechargeTitle: "ገንዘብ ይሙሉ",
            rechargeAmount: "የመሙያ መጠን",
            etb: "ብር",
            loadingPresets: "ቅድመ-ቅምጦችን በመጫን ላይ...",
            customAmountLabel: "ብጁ መጠን",
            minLabel: "ዝቅተኛ.",
            placeholderAmount: "መጠን ያስገቡ...",
            importantTips: "አስፈላጊ ምክሮች",
            tip1: "ያልተረጋገጠ መረጃን አያምኑ። ሁልጊዜ የእኛን ኦፊሴላዊ መተግበሪያ ይጠቀሙ።",
            tip2: "ተቀባዩ አካውንት በየጊዜው ይቀየራል። ሁልጊዜ ከመሙላትዎ በፊት የቅርብ ጊዜውን የባንክ መረጃ ይቅዱ።",
            tip3: "ከከፈሉ በኋላ፣ ክፍያዎን ለማረጋገጥ ባለ 12 አሃዝ የግብይት ቁጥር መስጠት አለብዎት።",
            selectPaymentMethod: "አሁን ይክፈሉ",
            accessRestricted: "መዳረሻ ተገድቧል",
            okUnderstood: "እሺ፣ ተረድቻለሁ",
            minRechargeError: "ዝቅተኛው የመሙያ መጠን",
        }
    };

    const t = (key: keyof typeof translations.english) => {
        return translations[language][key] || translations.english[key];
    };

    useEffect(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    }, []);

    const [amount, setAmount] = useState<string>("0");
    const [customAmount, setCustomAmount] = useState<string>("");
    const [minRecharge, setMinRecharge] = useState<number>(4500);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [presetAmounts, setPresetAmounts] = useState<number[]>(DEFAULT_PRESETS);
    const [fetchingPresets, setFetchingPresets] = useState(true);
    useEffect(() => {
        const fetchProductPrices = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "Products"));
                const prices: number[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.price) prices.push(Number(data.price));
                });

                // Filter unique values and sort ascending
                const uniquePrices = Array.from(new Set(prices)).sort((a, b) => a - b);

                if (uniquePrices.length > 0) {
                    setPresetAmounts(uniquePrices);
                }
            } catch (error) {
                console.error("Error fetching product prices:", error);
            } finally {
                setFetchingPresets(false);
            }
        };

        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "GlobalSettings", "recharge");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const settings = docSnap.data();
                    if (settings.minAmount) {
                        const min = Number(settings.minAmount);
                        setMinRecharge(min);
                        // If no amount in searchParams, use min
                        if (!searchParams.get("amount")) {
                            setAmount(min.toString());
                        } else {
                            setAmount(searchParams.get("amount")!);
                        }
                    }
                } else {
                    // Fallback to initial amount if no doc
                    setAmount(searchParams.get("amount") || "4500");
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                setAmount(searchParams.get("amount") || "4500");
            }
        };

        fetchProductPrices();
        fetchSettings();
    }, [searchParams]);

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

    const handleNext = async () => {
        const numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount < minRecharge) {
            setErrorMsg(`${t('minRechargeError')} ${minRecharge.toLocaleString()} ${t('etb')}`);
            setShowErrorModal(true);
            return;
        }

        router.push(`/users/payment-method?amount=${amount}`);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-40 relative">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-50 px-6 py-5 flex items-center justify-between border-b border-slate-100">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 active:scale-90 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-lg font-black tracking-tight">{t('rechargeTitle')}</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="pt-28 px-6 space-y-8 max-w-lg mx-auto">
                {/* Amount Display Card */}
                <section className="relative group animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-600/30 relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>

                        <p className="text-indigo-100 text-[10px] font-black tracking-[0.2em] mb-3 ml-1">{t('rechargeAmount')}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-white text-5xl font-black">{Number(amount).toLocaleString()}</span>
                            <span className="text-indigo-200 font-bold tracking-widest text-sm">{t('etb')}</span>
                        </div>

                        <div className="mt-8 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-white/40 w-2/3 rounded-full"></div>
                        </div>
                    </div>
                </section>

                {/* Custom Amount */}
                <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                        <h2 className="text-[10px] font-black text-slate-400 tracking-widest leading-none">
                            {t('customAmountLabel')} ({t('minLabel')} {minRecharge.toLocaleString()})
                        </h2>
                    </div>

                    <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                            <CreditCard size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder={t('placeholderAmount')}
                            value={customAmount}
                            onChange={handleCustomAmountChange}
                            className="w-full bg-white border border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-xl font-black placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
                        />
                    </div>
                </section>

                {/* Preset Grid */}
                <section className="space-y-4">
                    {fetchingPresets ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 opacity-20" />
                            <p className="text-[10px] font-black text-slate-300 tracking-widest">{t('loadingPresets')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {presetAmounts.map((val) => (
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
                    )}
                </section>

                {/* Tips Section */}
                <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <Info size={20} />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 tracking-widest leading-none">{t('importantTips')}</h3>
                    </div>

                    <ul className="space-y-4">
                        {[
                            t('tip1'),
                            t('tip2'),
                            t('tip3')
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
                        className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black tracking-[0.2em] text-xs shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                    >
                        <span>{t('selectPaymentMethod')}</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </main>

            {/* Premium Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Static light effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                        <div className="flex flex-col items-center text-center gap-6 relative z-10">
                            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 animate-bounce">
                                <AlertCircle size={40} />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('accessRestricted')}</h2>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                    {errorMsg}
                                </p>
                            </div>

                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-5 rounded-2xl font-black tracking-widest text-xs shadow-xl shadow-red-500/30 active:scale-95 transition-all"
                            >
                                {t('okUnderstood')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RechargePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        }>
            <RechargeContent />
        </Suspense>
    );
}
