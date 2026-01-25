"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, increment, query, where, getDocs, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Lock,
    Loader2,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Delete,
    Clock,
    Rocket
} from "lucide-react";
import { toast } from "sonner";

function SecurityContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amountParam = searchParams.get('amount');

    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [input, setInput] = useState("");
    const [confirmInput, setConfirmInput] = useState(""); // For setting password logic
    const [step, setStep] = useState<"check" | "set" | "confirm" | "enter">("check");
    const [shake, setShake] = useState(false);

    // Restriction States
    const [isRestricted, setIsRestricted] = useState(false); // 24h Cap
    const [isPartnerRestricted, setIsPartnerRestricted] = useState(false); // Verified Recharge
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [minRecharge, setMinRecharge] = useState<number>(4500);
    const [withdrawalSettings, setWithdrawalSettings] = useState<any>({
        frequency: 1,
    });

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    const translations = {
        english: {
            pinSetSuccess: "Security PIN Set Successfully",
            pinMismatch: "PINs do not match. Try again.",
            incorrectPin: "Incorrect withdrawal password. Please enter the correct password.",
            errorOccurred: "An error occurred",
            withdrawalFailed: "Withdrawal Failed",
            unlockWithdrawals: "Unlock Withdrawals",
            turnerPartners: "Turner Partners",
            partnerDesc: "Withdrawals are available only for",
            partnerDesc2: "Recharge your wallet, activate funding, and join the Turner Partnership to start withdrawing.",
            rechargeJoin: "Recharge & Join Now",
            returnSecure: "Return to Secure Area",
            withdrawalLimit: "Withdrawal Limit",
            oneWithdrawalPer: "One Withdrawal Per",
            days: "Day(s)",
            payoutWindow: "Your next payout window opens at",
            midnight: "Midnight (0:00)",
            stayFocused: "Stay focused on your journey!",
            dayLabel: "Days",
            hrLabel: "Hrs",
            minLabel: "Min",
            secLabel: "Sec",
            acknowledged: "Acknowleged",
            withdrawalSuccess: "Withdrawal Successful",
            successMsg: "Your request has been verified and submitted for processing. Funds will arrive in your account in",
            hoursRange: "2-72 hours",
            proceedHome: "Proceed to Home",
            securedBy: "Transaction Secured by Turner",
            createPin: "Create Security PIN",
            confirmPin: "Confirm PIN",
            securityCheck: "Security Check",
            setPinDesc: "Set a 4-digit code to secure your withdrawals.",
            confirmPinDesc: "Re-enter your code to confirm.",
            enterPinDesc: "Enter your 4-digit code to authorize withdrawal.",
            unlockWithdraw: "Unlock & Withdraw",
            continue: "Continue",
            cancelTrans: "Cancel Transaction"
        },
        amharic: {
            pinSetSuccess: "የደህንነት ፒን በተሳካ ሁኔታ ተዘጋጅቷል",
            pinMismatch: "ፒኖች አይዛመዱም። እንደገና ይሞክሩ።",
            incorrectPin: "የተሳሳተ የገንዘብ ማውጫ የይለፍ ቃል። እባክዎ ትክክለኛውን የይለፍ ቃል ያስገቡ።",
            errorOccurred: "ስህተት ተከስቷል",
            withdrawalFailed: "ገንዘብ ማውጣት አልተሳካም",
            unlockWithdrawals: "ገንዘብ ማውጣትን ይክፈቱ",
            turnerPartners: "የተርነር አጋሮች",
            partnerDesc: "ገንዘብ ማውጣት የሚገኘው ለ",
            partnerDesc2: "ብቻ ነው። ቦርሳዎን ይሙሉ፣ የገንዘብ ድጋፍን ያግብሩ እና ገንዘብ ማውጣት ለመጀመር የተርነር አጋርነትን ይቀላቀሉ።",
            rechargeJoin: "አሁን ይሙሉ እና ይቀላቀሉ",
            returnSecure: "ወደ ደህንነቱ የተጠበቀ ቦታ ይመለሱ",
            withdrawalLimit: "የገንዘብ ማውጣት ገደብ",
            oneWithdrawalPer: "አንድ ወጪ በየ",
            days: "ቀን(ናት)",
            payoutWindow: "ቀጣዩ የክፍያ መስኮትዎ በ",
            midnight: "እኩለ ሌሊት (0:00)",
            stayFocused: "ይከፈታል። በጉዞዎ ላይ ያተኩሩ!",
            dayLabel: "ቀናት",
            hrLabel: "ሰዓታት",
            minLabel: "ደቂቃዎች",
            secLabel: "ሰከንዶች",
            acknowledged: "ተረድቻለሁ",
            withdrawalSuccess: "ገንዘብ ማውጣት ተሳክቷል",
            successMsg: "ጥያቄዎ ተረጋግጦ ለሂደት ቀርቧል። ገንዘብ በ",
            hoursRange: "2-72 ሰዓታት",
            proceedHome: "ወደ መነሻ ገጽ ይቀጥሉ",
            securedBy: "ግብይቱ በተርነር የተጠበቀ ነው",
            createPin: "የደህንነት ፒን ይፍጠሩ",
            confirmPin: "ፒን ያረጋግጡ",
            securityCheck: "የደህንነት ምርመራ",
            setPinDesc: "ገንዘብ ማውጣትዎን ለመጠበቅ ባለ 4 አሃዝ ኮድ ያዘጋጁ።",
            confirmPinDesc: "ለማረጋገጥ ኮድዎን እንደገና ያስገቡ።",
            enterPinDesc: "ገንዘብ ማውጣትን ለማጽደቅ ባለ 4 አሃዝ ኮድዎን ያስገቡ።",
            unlockWithdraw: "ይክፈቱ እና ያውጡ",
            continue: "ይቀጥሉ",
            cancelTrans: "ግብይቱን ይሰርዙ"
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

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            // Fetch User Data for Password Check
            const userRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                const hasPass = !!data.withdrawalPassword;
                setHasPassword(hasPass);
                setStep(hasPass ? "enter" : "set");
            }
            setLoading(false);
        });

        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "GlobalSettings", "recharge");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const settings = docSnap.data();
                    if (settings.minAmount) {
                        setMinRecharge(Number(settings.minAmount));
                    }
                }

                // Fetch Withdrawal Settings
                const withdrawRef = doc(db, "GlobalSettings", "withdrawal");
                const withdrawSnap = await getDoc(withdrawRef);
                if (withdrawSnap.exists()) {
                    setWithdrawalSettings(withdrawSnap.data());
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };

        fetchSettings();
        return () => unsubscribeAuth();
    }, [router]);

    // Handle Numpad Input
    const handleNumClick = (num: string) => {
        if (input.length < 4) {
            setInput(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
    };

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [customError, setCustomError] = useState("");

    useEffect(() => {
        if (customError) {
            const timer = setTimeout(() => {
                setCustomError("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [customError]);

    const handleAction = async () => {
        if (input.length !== 4) return;
        setVerifying(true);

        try {
            if (step === "set") {
                // Determine next step
                setConfirmInput(input);
                setInput("");
                setStep("confirm");
                setVerifying(false);
            } else if (step === "confirm") {
                if (input === confirmInput) {
                    // Save Password
                    await updateDoc(doc(db, "users", user.uid), {
                        withdrawalPassword: input
                    });
                    toast.success(t("pinSetSuccess"));
                    setUserData({ ...userData, withdrawalPassword: input });

                    // AUTO EXECUTE WITHDRAWAL after setting password
                    const isRecruited = await checkPartnerStatus();
                    if (!isRecruited) {
                        setIsPartnerRestricted(true);
                        setVerifying(false);
                        return;
                    }

                    const dailyRestricted = await checkRestriction();
                    if (dailyRestricted) {
                        setIsRestricted(true);
                        setStep("enter");
                        setInput("");
                        setVerifying(false);
                        return;
                    }
                    await executeWithdrawal();
                } else {
                    toast.error(t("pinMismatch"));
                    setInput("");
                    setConfirmInput("");
                    setStep("set");
                    setVerifying(false);
                }
            } else if (step === "enter") {
                // Check Password
                if (input === userData.withdrawalPassword) {
                    // 1. CHECK PARTNER STATUS FIRST
                    const isRecruited = await checkPartnerStatus();
                    if (!isRecruited) {
                        setIsPartnerRestricted(true);
                        setVerifying(false);
                        return;
                    }

                    // 2. CHECK 24H RESTRICTION 
                    const dailyRestricted = await checkRestriction();
                    if (dailyRestricted) {
                        setIsRestricted(true);
                        setVerifying(false);
                        return;
                    }
                    await executeWithdrawal();
                } else {
                    // Wrong Password
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                    setCustomError(t("incorrectPin"));
                    setInput("");
                    setVerifying(false);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error(t("errorOccurred"));
            setVerifying(false);
        }
    };

    const checkRestriction = async () => {
        if (!user) return false;

        const now = new Date();
        const f = withdrawalSettings.frequency || 1;
        // Start date for checking previous withdrawals: today - (f-1) days at 0:00
        const checkStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (f - 1));

        // Fetch all withdrawals for this user (avoids composite index requirement)
        const q = query(
            collection(db, "Withdrawals"),
            where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        // Filter by date on the client side to avoid index issues
        const hasRestrictedWithdrawal = snapshot.docs.some(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            return createdAt >= checkStartDate;
        });

        return hasRestrictedWithdrawal;
    };

    const checkPartnerStatus = async () => {
        if (!user) return false;
        try {
            const q = query(
                collection(db, "RechargeReview"),
                where("userId", "==", user.uid),
                where("status", "==", "verified"),
                limit(1)
            );
            const snap = await getDocs(q);
            return !snap.empty;
        } catch (error) {
            console.error("Error checking partner status:", error);
            return false;
        }
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isRestricted) {
            timer = setInterval(() => {
                const now = new Date();

                // Reset always happens at midnight 0:00
                const targetReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                targetReset.setHours(0, 0, 0, 0);

                const diff = targetReset.getTime() - now.getTime();

                if (diff <= 0) {
                    setIsRestricted(false);
                    return;
                }

                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / (1000 * 60)) % 60),
                    seconds: Math.floor((diff / 1000) % 60)
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isRestricted]);

    const executeWithdrawal = async () => {
        try {
            const amount = Number(amountParam);
            const fee = amount * 0.05;
            const actualReceipt = amount - fee;

            // Fetch Linked Bank Snapshot
            const bankSnap = await getDoc(doc(db, "Bank", user.uid));
            const rawBankData = bankSnap.data() as any;

            // Filter Bank Details (Remove status, uid, createdAt etc)
            const bankDetails = {
                accountNumber: rawBankData?.accountNumber,
                bankLogoUrl: rawBankData?.bankLogoUrl,
                bankName: rawBankData?.bankName,
                holderName: rawBankData?.holderName,
                // phoneNumber removed as per strict new instruction
            };

            await addDoc(collection(db, "Withdrawals"), {
                userId: user.uid,
                amount: amount,
                fee: fee,
                actualReceipt: actualReceipt,
                bankDetails: bankDetails,
                status: "pending",
                createdAt: serverTimestamp(),
                userEmail: user.email,
                userPhone: userData.phoneNumber || ""
            });

            // ADD NOTIFICATION
            await addDoc(collection(db, "UserNotifications"), {
                userId: user.uid,
                type: "withdrawal",
                amount: amount,
                status: "pending",
                read: false,
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, "users", user.uid), {
                balance: increment(-amount)
                // lastWithdrawalAt removed, using collection check now
            });

            // SHOW SUCCESS MODAL INSTEAD OF REDIRECT
            setShowSuccessModal(true);
            setVerifying(false);
        } catch (error) {
            console.error(error);
            toast.error(t("withdrawalFailed"));
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* 🚀 Partner Recruitment Modal (Unlock Withdrawals) */}
            {isPartnerRestricted && (
                <div className="absolute inset-0 z-[120] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-700">
                    <div className="bg-[#111111] w-full max-w-sm rounded-[3.5rem] p-10 border border-amber-500/20 shadow-[0_0_80px_rgba(245,158,11,0.1)] relative overflow-hidden animate-in zoom-in-90 duration-500">
                        {/* Advanced Sci-Fi Glows */}
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-amber-600/5 rounded-full blur-[100px] pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-10">
                            {/* Animated Rocket Icon */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-amber-500/20 rounded-[2.5rem] blur-2xl animate-pulse group-hover:bg-amber-500/40 transition-all"></div>
                                <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-amber-200 to-amber-600 p-[1px] shadow-2xl relative">
                                    <div className="w-full h-full rounded-[2.45rem] bg-[#0a0a0a] flex items-center justify-center text-amber-500 overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1),transparent)] flex items-center justify-center">
                                            <div className="w-20 h-20 border border-amber-500/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                                        </div>
                                        <Rocket size={54} strokeWidth={1.2} className="relative z-10 animate-bounce" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-100 via-amber-400 to-amber-600 uppercase tracking-tighter leading-none italic">
                                        {t("unlockWithdrawals").split(' ')[0]}<br />{t("unlockWithdrawals").split(' ').slice(1).join(' ')}
                                    </h3>
                                    <div className="h-1 w-12 bg-amber-500/50 mx-auto rounded-full"></div>
                                </div>
                                <p className="text-amber-100/50 text-xs font-bold leading-relaxed px-2 uppercase tracking-wider">
                                    {t("partnerDesc")} <span className="text-amber-400 font-black">{t("turnerPartners")}</span>.
                                    {t("partnerDesc2")}
                                </p>
                            </div>

                            <div className="w-full space-y-4 pt-2">
                                <button
                                    onClick={() => router.push(`/users/recharge?amount=${minRecharge}`)}
                                    className="w-full py-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] active:scale-95 transition-all relative overflow-hidden group"
                                >
                                    <span className="relative z-10">{t("rechargeJoin")}</span>
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 slant-glow"></div>
                                </button>
                                <button
                                    onClick={() => setIsPartnerRestricted(false)}
                                    className="text-amber-100/20 text-[9px] font-black uppercase tracking-[0.4em] hover:text-amber-400 transition-all hover:tracking-[0.5em]"
                                >
                                    {t("returnSecure")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 24-Hour Restriction Overlay */}
            {isRestricted && (
                <div className="absolute inset-0 z-[70] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-500">
                        {/* Status Accents */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-amber-400"></div>
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50"></div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-amber-50 flex items-center justify-center shadow-inner relative">
                                <div className="absolute inset-0 border-4 border-amber-200/50 rounded-[2rem] animate-pulse"></div>
                                <Clock size={48} className="text-amber-500" />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{t("withdrawalLimit")}</h3>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">{t("oneWithdrawalPer")} {withdrawalSettings.frequency} {t("days")}</p>
                                </div>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed px-2">
                                    {t("payoutWindow")} <span className="text-slate-900">{t("midnight")}</span>.
                                    {t("stayFocused")}
                                </p>
                            </div>

                            {/* Advanced Countdown UI */}
                            <div className="flex gap-3 justify-center w-full bg-slate-50 py-6 rounded-[2rem] border border-slate-100">
                                {timeLeft.days > 0 && (
                                    <>
                                        <div className="flex flex-col items-center min-w-[60px]">
                                            <span className="text-2xl font-black text-slate-900 tabular-nums">{timeLeft.days}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t("dayLabel")}</span>
                                        </div>
                                        <span className="text-2xl font-black text-slate-300 self-start mt-0.5">:</span>
                                    </>
                                )}
                                <div className="flex flex-col items-center min-w-[60px]">
                                    <span className="text-2xl font-black text-slate-900 tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t("hrLabel")}</span>
                                </div>
                                <span className="text-2xl font-black text-slate-300 self-start mt-0.5">:</span>
                                <div className="flex flex-col items-center min-w-[60px]">
                                    <span className="text-2xl font-black text-slate-900 tabular-nums">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t("minLabel")}</span>
                                </div>
                                <span className="text-2xl font-black text-slate-300 self-start mt-0.5">:</span>
                                <div className="flex flex-col items-center min-w-[60px]">
                                    <span className="text-2xl font-black text-slate-900 tabular-nums text-indigo-600">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t("secLabel")}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/users/welcome')}
                                className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[1.8rem] text-xs font-black uppercase tracking-[0.25em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={18} /> {t("acknowledged")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Golden Success Modal Overlay */}
            {showSuccessModal && (
                <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-[#1a1a1a] w-full max-w-sm rounded-[3rem] p-10 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-500 shadow-amber-500/10">
                        {/* Premium Golden Glows */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-8">
                            {/* Success Icon Container */}
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-amber-400 via-amber-200 to-amber-600 p-[1px] shadow-2xl shadow-amber-500/20">
                                <div className="w-full h-full rounded-[1.95rem] bg-[#1a1a1a] flex items-center justify-center text-amber-500 relative">
                                    <div className="absolute inset-0 bg-amber-500/10 rounded-[1.95rem] animate-ping"></div>
                                    <CheckCircle2 size={48} strokeWidth={1.5} className="relative z-10" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 uppercase tracking-tight">{t("withdrawalSuccess")}</h3>
                                <p className="text-amber-100/60 text-sm font-bold leading-relaxed px-4">
                                    {t("successMsg")} <span className="text-amber-400 font-black">{t("hoursRange")}</span>.
                                </p>
                            </div>

                            <div className="w-full pt-4">
                                <button
                                    onClick={() => router.push('/users/welcome')}
                                    className="w-full py-5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                    {t("proceedHome")}
                                </button>
                                <p className="mt-6 text-[8px] font-black text-amber-500/30 uppercase tracking-[0.4em]">{t("securedBy")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header/Icon */}
            <div className="mb-8 relative">
                <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-indigo-100 flex items-center justify-center relative z-10">
                    {step === "enter" ? <Lock size={32} className="text-indigo-600" /> : <ShieldCheck size={32} className="text-indigo-600" />}
                </div>
                <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-500 rounded-[2rem] blur-xl opacity-20 animate-pulse"></div>
            </div>

            {/* Title & Instructions */}
            <div className="space-y-3 mb-12 max-w-xs mx-auto">
                <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                    {step === "set" ? t("createPin") : step === "confirm" ? t("confirmPin") : t("securityCheck")}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    {step === "set"
                        ? t("setPinDesc")
                        : step === "confirm"
                            ? t("confirmPinDesc")
                            : t("enterPinDesc")}
                </p>
            </div>

            {/* PIN Display */}
            <div className={`flex gap-6 mb-12 ${shake ? "animate-shake" : ""}`}>
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-300 ${i < input.length
                            ? "bg-indigo-600 scale-125 shadow-lg shadow-indigo-600/30"
                            : "bg-slate-200"
                            }`}
                    ></div>
                ))}
            </div>

            {/* Inline Error Message Area */}
            <div className="h-10 mb-2 w-full flex items-center justify-center">
                {customError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <AlertCircle size={16} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{customError}</span>
                    </div>
                )}
            </div>

            {/* Native-style Numpad (Visual only, usually safer to use actual buttons for mobile web) */}
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-8 w-full max-w-[280px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumClick(num.toString())}
                        className="w-16 h-16 rounded-full text-2xl font-bold text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
                    >
                        {num}
                    </button>
                ))}
                <div className="w-16 h-16"></div> {/* Empty */}
                <button
                    onClick={() => handleNumClick("0")}
                    className="w-16 h-16 rounded-full text-2xl font-bold text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
                >
                    <Delete size={24} />
                </button>
            </div>

            {/* Action Button */}
            <button
                onClick={handleAction}
                disabled={input.length !== 4 || verifying}
                className="w-full max-w-[280px] py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:scale-100 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {verifying ? <Loader2 className="animate-spin" /> : (step === "enter" ? t("unlockWithdraw") : t("continue"))}
            </button>

            <button
                onClick={() => router.back()}
                className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
                {t("cancelTrans")}
            </button>
        </div>
    );
}

export default function SecurityPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        }>
            <SecurityContent />
        </Suspense>
    );
}
