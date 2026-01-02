"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, increment, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Lock,
    Loader2,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Delete,
    Clock
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

    // Restriction State
    const [isRestricted, setIsRestricted] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

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
                    toast.success("Security PIN Set Successfully");
                    setUserData({ ...userData, withdrawalPassword: input });
                    setStep("enter");
                    setInput("");
                    setVerifying(false);
                } else {
                    toast.error("PINs do not match. Try again.");
                    setInput("");
                    setConfirmInput("");
                    setStep("set");
                    setVerifying(false);
                }
            } else if (step === "enter") {
                // Check Password
                if (input === userData.withdrawalPassword) {
                    // CHECK 24H RESTRICTION FIRST (Collection-based)
                    const restricted = await checkRestriction();
                    if (restricted) {
                        setIsRestricted(true);
                        setVerifying(false);
                        return;
                    }
                    await executeWithdrawal();
                } else {
                    // Wrong Password
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                    setCustomError("Incorrect withdrawal password. Please enter the correct password.");
                    setInput("");
                    setVerifying(false);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
            setVerifying(false);
        }
    };

    const checkRestriction = async () => {
        if (!user) return false;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Fetch all withdrawals for this user (avoids composite index requirement)
        const q = query(
            collection(db, "Withdrawals"),
            where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        // Filter by date on the client side to avoid index issues
        const hasTodayWithdrawal = snapshot.docs.some(doc => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            return createdAt >= startOfDay;
        });

        return hasTodayWithdrawal;
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isRestricted) {
            timer = setInterval(() => {
                const now = new Date();
                const midnight = new Date();
                midnight.setHours(24, 0, 0, 0); // Next midnight

                const diff = midnight.getTime() - now.getTime();

                if (diff <= 0) {
                    setIsRestricted(false);
                    return;
                }

                setTimeLeft({
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
            toast.error("Withdrawal Failed");
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
            {/* Custom Error Overlay Card - REMOVED, moving inline */}


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
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Daily Cap Reached</h3>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">One Withdrawal Per 24h</p>
                                </div>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed px-2">
                                    Your next payout window opens at <span className="text-slate-900">Midnight (0:00)</span>.
                                    Stay focused on your journey!
                                </p>
                            </div>

                            {/* Advanced Countdown UI */}
                            <div className="flex gap-3 justify-center w-full bg-slate-50 py-6 rounded-[2rem] border border-slate-100">
                                <div className="flex flex-col items-center min-w-[60px]">
                                    <span className="text-2xl font-black text-slate-900 tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hrs</span>
                                </div>
                                <span className="text-2xl font-black text-slate-300 self-start mt-0.5">:</span>
                                <div className="flex flex-col items-center min-w-[60px]">
                                    <span className="text-2xl font-black text-slate-900 tabular-nums">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Min</span>
                                </div>
                                <span className="text-2xl font-black text-slate-300 self-start mt-0.5">:</span>
                                <div className="flex flex-col items-center min-w-[60px]">
                                    <span className="text-2xl font-black text-slate-900 tabular-nums text-indigo-600">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sec</span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/users/welcome')}
                                className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-[1.8rem] text-xs font-black uppercase tracking-[0.25em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={18} /> Acknowleged
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal Overlay */}
            {showSuccessModal && (
                <div className="absolute inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10"></div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner mb-2">
                                <CheckCircle2 size={40} className="text-emerald-600" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Withdrawal Successful</h3>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed px-4">
                                    Your request has been verified. Withdrawal will arrive in your account in <span className="text-slate-900">2-72 hours</span>.
                                </p>
                            </div>

                            <button
                                onClick={() => router.push('/users/welcome')}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                            >
                                OK
                            </button>
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
                    {step === "set" ? "Create Security PIN" : step === "confirm" ? "Confirm PIN" : "Security Check"}
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    {step === "set"
                        ? "Set a 4-digit code to secure your withdrawals."
                        : step === "confirm"
                            ? "Re-enter your code to confirm."
                            : "Enter your 4-digit code to authorize withdrawal."}
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
                {verifying ? <Loader2 className="animate-spin" /> : (step === "enter" ? "Unlock & Withdraw" : "Continue")}
            </button>

            <button
                onClick={() => router.back()}
                className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
                Cancel Transaction
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
