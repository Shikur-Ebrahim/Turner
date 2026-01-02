"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    Lock,
    Loader2,
    CheckCircle2,
    Delete,
    ChevronLeft,
    ShieldCheck,
    Key,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";

function ChangePasswordContent() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // State management for logic flow
    const [step, setStep] = useState<"enter_old" | "create_new" | "confirm_new">("create_new");
    const [input, setInput] = useState("");
    const [tempNew, setTempNew] = useState("");
    const [hasExistingPass, setHasExistingPass] = useState(false);
    const [existingPass, setExistingPass] = useState("");

    const [shake, setShake] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            // Fetch current setting
            const userRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.withdrawalPassword) {
                    setHasExistingPass(true);
                    setExistingPass(data.withdrawalPassword);
                    setStep("enter_old");
                }
            }
            setLoading(false);
        });

        return () => unsubscribeAuth();
    }, [router]);

    const handleNumClick = (num: string) => {
        if (input.length < 4) {
            setInput(prev => prev + num);
            setErrorMsg(""); // Clear error on type
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
        setErrorMsg("");
    };

    const handleAction = async () => {
        if (input.length !== 4) return;
        setSubmitting(true);
        setErrorMsg("");

        try {
            if (step === "enter_old") {
                if (input === existingPass) {
                    toast.success("Identity Verified");
                    setStep("create_new");
                    setInput("");
                } else {
                    triggerShake();
                    setErrorMsg("Incorrect Password! Please enter the correct PIN.");
                    toast.error("Incorrect Password! Please enter the correct PIN.");
                    setInput("");
                }
                setSubmitting(false);
            } else if (step === "create_new") {
                if (hasExistingPass && input === existingPass) {
                    setErrorMsg("New PIN cannot be the same as old PIN.");
                    toast.error("New PIN cannot be the same as old PIN");
                    triggerShake();
                    setInput("");
                    setSubmitting(false);
                    return;
                }
                setTempNew(input);
                setStep("confirm_new");
                setInput("");
                setSubmitting(false);
            } else if (step === "confirm_new") {
                if (input === tempNew) {
                    // Update Password in Firestore
                    await updateDoc(doc(db, "users", user.uid), {
                        withdrawalPassword: input
                    });
                    setSubmitting(false);
                    setShowSuccess(true); // Trigger Success View
                } else {
                    triggerShake();
                    setErrorMsg("PINs do not match. Please try again.");
                    toast.error("PINs do not match. Please try again.");
                    setStep("create_new"); // Reset to creation step
                    setInput("");
                    setTempNew("");
                    setSubmitting(false);
                }
            }

        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
            setSubmitting(false);
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-6 animate-in fade-in fill-mode-forwards duration-500">
                <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-100 border border-slate-50 text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full -ml-16 -mb-16 blur-xl"></div>

                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
                                <CheckCircle2 size={40} className="text-emerald-500 drop-shadow-sm" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Success!</h2>
                            <p className="text-sm font-bold text-slate-500 leading-relaxed">
                                Your withdrawal password has been changed correctly.
                            </p>
                        </div>

                        <div className="w-full pt-4">
                            <button
                                onClick={() => router.back()}
                                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 transition-all active:scale-95"
                            >
                                Back to Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Determine visual steps
    const steps = hasExistingPass
        ? [
            { id: 1, label: "Verify Old" },
            { id: 2, label: "Create New" },
            { id: 3, label: "Confirm" }
        ]
        : [
            { id: 2, label: "Create New" },
            { id: 3, label: "Confirm" }
        ];

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col text-slate-900 font-sans pb-10">
            {/* Header */}
            <header className="px-6 pt-8 pb-4 flex items-center gap-4 sticky top-0 bg-[#F8F9FB] z-50">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors active:scale-95"
                >
                    <ChevronLeft size={24} className="text-slate-700" />
                </button>
                <div className="flex-1 text-center pr-10">
                    <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Security Center</h1>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center p-6 pt-8 max-w-md mx-auto w-full">

                {/* Visual Stepper */}
                <div className="flex items-center justify-center gap-4 mb-10 w-full">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500 ${(step === "enter_old" && s.id === 1) ||
                                    (step === "create_new" && s.id === 2) ||
                                    (step === "confirm_new" && s.id === 3)
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110"
                                    : ((step === "create_new" && s.id < 2) || (step === "confirm_new" && s.id < 3))
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "bg-transparent border-slate-200 text-slate-300"
                                }`}>
                                {(step === "create_new" && s.id < 2) || (step === "confirm_new" && s.id < 3) ? <CheckCircle2 size={14} /> : s.id}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-8 h-0.5 rounded-full transition-colors duration-500 ${(step === "create_new" && s.id < 2) || (step === "confirm_new" && s.id < 3)
                                        ? "bg-emerald-500"
                                        : "bg-slate-200"
                                    }`}></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Animated Icon Container */}
                <div className="mb-8 relative group">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(99,102,241,0.2)] flex items-center justify-center relative z-10 border border-indigo-50 transform transition-transform duration-500">
                        {step === "confirm_new" ? (
                            <ShieldCheck size={40} className="text-emerald-500 drop-shadow-sm" />
                        ) : step === "create_new" ? (
                            <Key size={40} className="text-indigo-600 drop-shadow-sm" />
                        ) : (
                            <Lock size={40} className="text-slate-700 drop-shadow-sm" />
                        )}
                    </div>
                </div>

                {/* Dynamic Title & Instructions */}
                <div className="space-y-4 mb-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300" key={step}>
                    <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                        {step === "enter_old" ? "Verification Required" : step === "create_new" ? "Set New PIN" : "Confirm PIN"}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto">
                        {step === "enter_old"
                            ? "Please enter your current withdrawal password to proceed."
                            : step === "create_new"
                                ? "Enter a new 4-digit security code for your account."
                                : "Re-enter your new code to verify and save changes."}
                    </p>
                </div>

                {/* Pincode Dots */}
                <div className={`flex gap-5 mb-4 p-4 rounded-3xl bg-white shadow-sm border border-slate-100 ${shake ? "animate-shake ring-2 ring-red-100" : ""}`}>
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${i < input.length
                                    ? (shake ? "bg-red-500" : "bg-indigo-600") + " scale-125 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                                    : "bg-slate-200"
                                }`}
                        ></div>
                    ))}
                </div>

                {/* Explicit Error Message Area */}
                <div className="h-6 mb-6">
                    {errorMsg && (
                        <div className="flex items-center justify-center gap-2 text-red-500 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wide">{errorMsg}</span>
                        </div>
                    )}
                </div>

                {/* Custom Numpad */}
                <div className="grid grid-cols-3 gap-x-6 gap-y-5 w-full max-w-[260px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumClick(num.toString())}
                            className="w-16 h-16 rounded-[1.5rem] text-xl font-black text-slate-800 bg-white hover:bg-slate-50 hover:shadow-md active:bg-indigo-50 active:text-indigo-600 active:scale-95 transition-all shadow-sm border border-slate-100 outline-none select-none"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="w-16 h-16"></div>
                    <button
                        onClick={() => handleNumClick("0")}
                        className="w-16 h-16 rounded-[1.5rem] text-xl font-black text-slate-800 bg-white hover:bg-slate-50 hover:shadow-md active:bg-indigo-50 active:text-indigo-600 active:scale-95 transition-all shadow-sm border border-slate-100 outline-none select-none"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-slate-400 bg-white hover:text-red-500 hover:bg-red-50 hover:shadow-md active:scale-95 transition-all shadow-sm border border-slate-100 outline-none select-none"
                    >
                        <Delete size={20} />
                    </button>
                </div>

                {/* Bottom Action Button */}
                <div className="w-full mt-8">
                    <button
                        onClick={handleAction}
                        disabled={input.length !== 4 || submitting}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:scale-100 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : "Next Step"}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default function ChangeWithdrawalPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        }>
            <ChangePasswordContent />
        </Suspense>
    );
}
