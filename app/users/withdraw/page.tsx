"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ChevronLeft,
    Wallet,
    CreditCard,
    AlertCircle,
    ChevronRight,
    Loader2,
    Lock,
    XCircle,
    CheckCircle2,
    Clock
} from "lucide-react";

const DAYS_MAP: Record<number, string> = {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    0: "Sun"
};

export default function WithdrawalPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [linkedBank, setLinkedBank] = useState<any>(null);
    const [showBankDetails, setShowBankDetails] = useState(false);
    const [withdrawalSettings, setWithdrawalSettings] = useState<any>({
        minAmount: 300,
        maxAmount: 40000,
        activeDays: [1, 2, 3, 4, 5, 6],
        startTime: "08:00",
        endTime: "17:00",
        frequency: 1,
    });

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    const translations = {
        english: {
            requestAlert: "Request Alert",
            okMatchRef: "OK, Matches Rule",
            withdrawal: "Withdrawal",
            withdrawalsClosed: "Withdrawals Closed",
            nextWindow: "Next window:",
            tomorrow: "tomorrow",
            withdrawalsActive: "Withdrawals Active",
            windowCloses: "Window Closes:",
            withdrawalAmount: "Withdrawal Amount",
            availableBalance: "Available Balance",
            singleFee: "Single Fee",
            actualReceipt: "Actual Receipt",
            selectAccount: "Select Withdrawal Account",
            account: "Account",
            bank: "Bank",
            holder: "Holder",
            number: "Number",
            noBank: "No Bank Linked",
            tapConnect: "Tap to Connect Account",
            withdrawalRules: "Withdrawal Rules",
            rule1: "Withdrawal time is from",
            to: "to",
            rule2: "Single withdrawal is",
            rule3: "Withdrawal frequency is every",
            days_interval: "day(s). Reset at 0:00.",
            rule4: "Withdrawal will arrive in your account in 2-72 hours.",
            rule5: "One person can only use one bank card to withdraw money.",
            withdrawFunds: "Withdraw Funds",
            errConnectBank: "Please connect a bank account first.",
            errValidAmount: "Please enter a valid amount.",
            errMinAmount: "Minimum withdrawal amount is",
            errMaxAmount: "Maximum single withdrawal is",
            errClosedToday: "Withdrawals are not available today.",
            errTimeWindow: "Withdrawals are only available between",
            and: "and",
            errInsufficient: "Insufficient balance to process request.",
            etb: "ETB"
        },
        amharic: {
            requestAlert: "የጥያቄ ማስጠንቀቂያ",
            okMatchRef: "እሺ",
            withdrawal: "ገንዘብ ማውጣት",
            withdrawalsClosed: "ገንዘብ ማውጣት ተዘግቷል",
            nextWindow: "ቀጣይ ክፍት ጊዜ:",
            tomorrow: "ነገ",
            withdrawalsActive: "ገንዘብ ማውጣት ይቻላል",
            windowCloses: "መስኮቱ ይዘጋል:",
            withdrawalAmount: "የማውጣት መጠን",
            availableBalance: "ያለዎት ቀሪ ሂሳብ",
            singleFee: "ነጠላ ክፍያ",
            actualReceipt: "ትክክለኛ ደረሰኝ",
            selectAccount: "የገንዘብ ማውጫ አካውንት ይምረጡ",
            account: "አካውንት",
            bank: "ባንክ",
            holder: "ባለቤት",
            number: "ቁጥር",
            noBank: "ምንም ባንክ አልተገናኘም",
            tapConnect: "አካውንት ለማገናኘት ይንኩ",
            withdrawalRules: "የገንዘብ ማውጣት ህጎች",
            rule1: "የገንዘብ ማውጣት ጊዜ ከ",
            to: "እስከ",
            rule2: "ነጠላ ማውጣት",
            rule3: "የማውጣት ድግግሞሽ በየ",
            days_interval: "ቀን(ናት)። በ0:00 ይጀምራል።",
            rule4: "ማውጣት በ2-72 ሰዓታት ውስጥ ወደ ሂሳብዎ ይገባል።",
            rule5: "አንድ ሰው ገንዘብ ለማውጣት አንድ የባንክ ካርድ ብቻ መጠቀም ይችላል።",
            withdrawFunds: "ገንዘብ ማውጣት",
            errConnectBank: "እባክዎ መጀመሪያ የባንክ ሂሳብ ያገናኙ።",
            errValidAmount: "እባክዎ ትክክለኛ መጠን ያስገቡ።",
            errMinAmount: "ዝቅተኛው የማውጣት መጠን",
            errMaxAmount: "ከፍተኛው ነጠላ ማውጣት",
            errClosedToday: "ዛሬ ገንዘብ ማውጣት አይቻልም።",
            errTimeWindow: "ገንዘብ ማውጣት የሚቻለው በ",
            and: "እና",
            errInsufficient: "ጥያቄውን ለማስተናገድ በቂ ያልሆነ ቀሪ ሂሳብ።",
            etb: "ብር"
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
            });

            // Fetch Global Withdrawal Settings
            const settingsRef = doc(db, "GlobalSettings", "withdrawal");
            const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
                if (doc.exists()) {
                    setWithdrawalSettings(doc.data());
                }
                setLoading(false);
            });

            // Fetch Withdrawal Rules for this user
            const qRules = query(
                collection(db, "withdrawal_rules"),
                where("active", "==", true)
            );
            const unsubscribeRules = onSnapshot(qRules, (snapshot) => {
                if (!snapshot.empty) {
                    // Check if any rule targets this user or is a global rule
                    const applicableRule = snapshot.docs.find(doc => {
                        const data = doc.data();
                        return data.targetAll === true || (data.targetUsers && data.targetUsers.includes(currentUser.uid));
                    });

                    if (applicableRule) {
                        const ruleData = applicableRule.data();
                        setErrorModal({
                            show: true,
                            message: ruleData.message || "Please read the withdrawal rules before proceeding."
                        });
                    }
                }
            });

            return () => {
                unsubscribeUser();
                unsubscribeBank();
                unsubscribeRules();
                unsubscribeSettings();
            };
        });

        return () => unsubscribeAuth();
    }, [router]);

    const handleWithdrawClick = () => {
        const numAmount = Number(amount);
        const balance = userData?.balance || 0;



        if (!linkedBank) {
            setErrorModal({ show: true, message: t("errConnectBank") });
            return;
        }

        if (!amount || isNaN(numAmount)) {
            setErrorModal({ show: true, message: t("errValidAmount") });
            return;
        }

        if (numAmount < withdrawalSettings.minAmount) {
            setErrorModal({ show: true, message: `${t("errMinAmount")} ${withdrawalSettings.minAmount} ${t("etb")}.` });
            return;
        }

        if (numAmount > withdrawalSettings.maxAmount) {
            setErrorModal({ show: true, message: `${t("errMaxAmount")} ${withdrawalSettings.maxAmount.toLocaleString()} ${t("etb")}.` });
            return;
        }

        // Check Schedule
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = withdrawalSettings.startTime.split(":").map(Number);
        const [endH, endM] = withdrawalSettings.endTime.split(":").map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (!withdrawalSettings.activeDays.includes(currentDay)) {
            setErrorModal({ show: true, message: t("errClosedToday") });
            return;
        }

        if (currentTime < startTotal || currentTime > endTotal) {
            setErrorModal({ show: true, message: `${t("errTimeWindow")} ${withdrawalSettings.startTime} ${t("and")} ${withdrawalSettings.endTime}.` });
            return;
        }

        if (numAmount > balance) {
            setErrorModal({ show: true, message: t("errInsufficient") });
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
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t("requestAlert")}</h3>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed px-2">
                                    {errorModal.message}
                                </p>
                            </div>

                            <button
                                onClick={() => setErrorModal(null)}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
                            >
                                {t("okMatchRef")}
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
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{t("withdrawal")}</h1>
            </header>

            {/* Withdrawal Schedule Status */}
            <div className="px-6 mt-4">
                {(() => {
                    const now = new Date();
                    const currentDay = now.getDay();
                    const currentTime = now.getHours() * 60 + now.getMinutes();
                    const [startH, startM] = withdrawalSettings.startTime.split(":").map(Number);
                    const [endH, endM] = withdrawalSettings.endTime.split(":").map(Number);
                    const startTotal = startH * 60 + startM;
                    const endTotal = endH * 60 + endM;

                    const isOpenToday = withdrawalSettings.activeDays.includes(currentDay);
                    const isWithinHours = currentTime >= startTotal && currentTime <= endTotal;

                    if (!isOpenToday || !isWithinHours) {
                        return (
                            <div className="bg-amber-50 border border-amber-200 rounded-[1.5rem] p-4 flex items-center gap-4 animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700">
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">{t("withdrawalsClosed")}</p>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase">
                                        {t("nextWindow")} {withdrawalSettings.startTime} {t("tomorrow")}
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-[1.5rem] p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{t("withdrawalsActive")}</p>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">
                                    {t("windowCloses")} {withdrawalSettings.endTime}
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>

            <main className="p-6 space-y-6">
                {/* Amount Input Card */}
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <p className="text-sm font-bold opacity-80 mb-4 uppercase tracking-wider">{t("withdrawalAmount")}</p>
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
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t("availableBalance")}</span>
                        <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                            {Number(userData?.balance || 0).toLocaleString()}
                        </span>
                    </div>

                    <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t("singleFee")}</span>
                        <span className="text-xs font-black text-white bg-blue-400 px-2 py-0.5 rounded-md">5%</span>
                    </div>

                    <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-wide">{t("actualReceipt")}</span>
                        <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold text-xs">$</div>
                            <span className="text-2xl font-black text-indigo-700">{actualReceipt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Bank Selection */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide ml-2">{t("selectAccount")}</h3>

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
                                    <h4 className="text-lg font-black text-slate-900 truncate tracking-tight">{linkedBank.accountNumber} {t("account")}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{linkedBank.holderName}</p>
                                </div>
                                <div className="text-indigo-200">
                                    <ChevronRight size={20} className="rotate-90" />
                                </div>
                            </div>

                            {/* Permanently Visible Details */}
                            <div className="pt-4 border-t border-dashed border-indigo-100 space-y-3 bg-slate-50/50 -mx-5 -mb-5 p-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("bank")}</span>
                                    <span className="text-[11px] font-bold text-slate-700">{linkedBank.bankName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("holder")}</span>
                                    <span className="text-[11px] font-bold text-slate-700">{linkedBank.holderName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("number")}</span>
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
                            <p className="text-xs font-bold text-gray-500 uppercase">{t("noBank")}</p>
                            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider mt-1">{t("tapConnect")}</p>
                        </div>
                    )}
                </div>

                {/* Usage Tips */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={18} className="text-slate-400" />
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{t("withdrawalRules")}</h4>
                    </div>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-slate-900">1.</span>
                            {t("rule1")} {withdrawalSettings.startTime} {t("to")} {withdrawalSettings.endTime} ({withdrawalSettings.activeDays.map((d: number) => DAYS_MAP[d]).join(", ")}).
                        </li>
                        <li className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-slate-900">2.</span>
                            {t("rule2")} {withdrawalSettings.minAmount}-{withdrawalSettings.maxAmount.toLocaleString()} {t("etb")}.
                        </li>
                        <li className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-slate-900">3.</span>
                            {t("rule3")} {withdrawalSettings.frequency} {t("days_interval")}
                        </li>
                        <li className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-slate-900">4.</span>
                            {t("rule4")}
                        </li>
                        <li className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span className="font-bold text-slate-900">5.</span>
                            {t("rule5")}
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
                    {t("withdrawFunds")}
                </button>
            </div>
        </div>
    );
}
