"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { ChevronLeft, Building2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

function RegularBankDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0";
    const methodId = searchParams.get("methodId");

    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [smsContent, setSmsContent] = useState("");
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [copiedName, setCopiedName] = useState(false);

    useEffect(() => {
        const fetchMethod = async () => {
            if (!methodId) return;
            try {
                const docRef = doc(db, "paymentMethods", methodId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setMethod(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching method:", error);
                toast.error("Failed to load payment details");
            } finally {
                setLoading(false);
            }
        };

        fetchMethod();
    }, [methodId]);

    // Timer logic
    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return { m, s };
    };

    const { m, s } = formatTime(timeLeft);

    const handleCopy = (text: string, type: 'account' | 'name') => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");

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

            await addDoc(collection(db, "RechargeReview"), {
                paymentMethod: "regular",
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
            router.push("/users/transaction-pending?theme=regular");
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Failed to submit. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 pb-32 font-sans text-slate-900">
            {/* Header with Timer */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white relative overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
                </div>

                {/* Navbar */}
                <header className="flex items-center justify-between px-4 py-4 relative z-10">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold">Recharge</h1>
                    <div className="w-8" />
                </header>

                {/* Timer Section */}
                <div className="flex items-center justify-between px-6 pb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                            {/* Timer Icon / Clock */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <span className="font-medium text-lg">Order Remaining</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 min-w-[3rem] text-center border border-white/30">
                            <span className="text-xl font-bold">{String(m).padStart(1, '0')}</span>
                            <span className="text-xs ml-1 opacity-80">Min</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 min-w-[3rem] text-center border border-white/30">
                            <span className="text-xl font-bold">{String(s).padStart(2, '0')}</span>
                            <span className="text-xs ml-1 opacity-80">Sec</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="px-5 pt-8 space-y-8 max-w-lg mx-auto">
                {/* Step 1 */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-6">
                        Step 1 <span className="text-slate-500 font-normal">Copy account for payment</span>
                    </h2>

                    <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 space-y-6 shadow-xl shadow-purple-100/50">
                        {/* Order Amount */}
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
                            <span className="text-slate-500 text-sm">Order Amount</span>
                            <span className="text-xl font-bold text-purple-600">
                                ETB {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Payment Channel */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-sm">Payment Channel</span>
                                <button className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">switch</button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-900">{method?.bankName || "Bank Name"}</span>
                                {method?.bankLogoUrl && (
                                    <img src={method.bankLogoUrl} alt="Bank" className="w-6 h-6 object-contain" />
                                )}
                            </div>
                        </div>

                        {/* Account Name */}
                        <div className="space-y-2">
                            <span className="text-slate-500 text-sm">Account Name</span>
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-900 text-lg flex-1">{method?.holderName || "Account Name"}</span>
                                <button
                                    onClick={() => handleCopy(method?.holderName, 'name')}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${copiedName
                                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                        : 'bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-200 active:scale-95'
                                        }`}
                                >
                                    {copiedName ? 'Copied!' : 'copy'}
                                </button>
                            </div>
                        </div>

                        {/* Account Number */}
                        <div className="space-y-2">
                            <span className="text-slate-500 text-sm">Account Number</span>
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-900 text-xl tracking-wide">{method?.accountNumber || "0000000000"}</span>
                                <button
                                    onClick={() => handleCopy(method?.accountNumber, 'account')}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${copiedAccount
                                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                        : 'bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-200 active:scale-95'
                                        }`}
                                >
                                    {copiedAccount ? 'Copied!' : 'copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step 2 */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex flex-wrap gap-1">
                        Step 2
                        <span className="text-red-500">Paste payment sms Or enter TID: FT*****</span>
                    </h2>

                    <div className="relative">
                        <textarea
                            value={smsContent}
                            onChange={(e) => setSmsContent(e.target.value)}
                            placeholder="Dear Mr your Account 1*********1122 has been debited wth ETB 200.00. Your Current Balance is ETB 44.76 Thank you for Banking with CBE! etc..."
                            className="w-full h-32 p-4 rounded-xl border border-slate-200/60 bg-white/70 backdrop-blur-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none text-sm leading-relaxed shadow-lg shadow-purple-100/30"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-slate-200 rounded-full opacity-50"></div>
                    </div>
                </section>
            </main>

            {/* Fixed Bottom Button */}
            <div className="p-6 bg-white border-t border-white/60">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!smsContent.trim()}
                        className={`w-full h-14 rounded-xl font-bold transition-all shadow-lg ${!smsContent.trim()
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70 shadow-none'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] shadow-purple-300/50'
                            }`}
                    >
                        I HAVE TRANSFERRED
                    </button>
                </div>
            </div>

            {/* Welcome Notification - Regular Theme */}
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-2xl rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl shadow-purple-500/20 space-y-8 text-center transform transition-all duration-300 ${animateOut ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'} animate-in slide-in-from-bottom-8 border border-white/60 relative overflow-hidden`}>
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-indigo-100/30 to-transparent opacity-50 pointer-events-none"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl"></div>

                {/* Icon Container */}
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto text-white mb-2 relative shadow-xl shadow-indigo-500/30 transform hover:scale-105 transition-transform">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-3xl"></div>
                        <div className="absolute inset-0 bg-indigo-400/20 rounded-3xl animate-pulse"></div>
                        <Building2 size={40} className="relative z-10" />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4 relative z-10">
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900">Welcome to Turner</h3>
                    <p className="text-slate-600 text-sm leading-relaxed px-2 font-medium">
                        You have selected <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{method?.bankDetailType || "Regular"} Payment</span>.
                        <br />
                        Tap below to access your profitable partnership dashboard.
                    </p>
                </div>

                {/* Button */}
                <button
                    onClick={handleDismiss}
                    className="relative z-10 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 hover:bg-pos-100 text-white font-bold h-16 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-indigo-300/40 flex items-center justify-center gap-2 group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10 text-lg tracking-wide">GET STARTED</span>
                    <ChevronLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform relative z-10" />
                </button>
            </div>
        </div>
    );
}

export default function RegularBankDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-slate-400" /></div>}>
            <RegularBankDetailContent />
        </Suspense>
    );
}
