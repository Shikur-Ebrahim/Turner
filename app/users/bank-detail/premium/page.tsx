"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { ChevronLeft, Copy, Loader2, Crown, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";

function PremiumContent() {
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

    useEffect(() => {
        if (timeLeft <= 0) return;
        const intervalId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft]);

    const { m, s } = { m: Math.floor(timeLeft / 60), s: timeLeft % 60 };

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
                paymentMethod: "premium",
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
            router.push("/users/transaction-pending?theme=premium");
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Failed to submit. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-44">
            {/* Elegant Header */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-amber-500/20">
                <header className="flex items-center justify-between px-6 py-6 max-w-lg mx-auto">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/5 transition-colors text-amber-500">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Crown size={20} className="text-amber-500" />
                        <h1 className="text-lg font-bold tracking-widest text-amber-500 uppercase">Premium Pay</h1>
                    </div>
                    <div className="w-10" />
                </header>

                {/* Golden Timer */}
                <div className="flex flex-col items-center justify-center pb-8 gap-2">
                    <span className="text-slate-400 text-xs uppercase tracking-widest">Time Remaining</span>
                    <div className="flex items-baseline gap-1 text-4xl font-light text-white font-mono">
                        <span>{String(m).padStart(2, '0')}</span>
                        <span className="text-amber-500 animate-pulse">:</span>
                        <span>{String(s).padStart(2, '0')}</span>
                    </div>
                </div>
            </div>

            <main className="px-6 pt-8 space-y-8 max-w-lg mx-auto relative z-10">
                {/* Visual Flair */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

                {/* Amount Display */}
                <section className="text-center space-y-2">
                    <p className="text-slate-400 text-sm uppercase tracking-wider">Total Amount</p>
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                        ETB {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </section>

                {/* Bank Card Info */}
                <section>
                    <div className="flex items-center gap-3 text-amber-500/80 mb-4">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full"></div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-amber-100">Step 1 Copy account for payment</h2>
                    </div>
                    <div className="bg-slate-900/50 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Crown size={120} className="text-amber-500" />
                        </div>

                        <div className="space-y-4 relative">
                            {/* Bank */}
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <span className="text-slate-400 text-sm">Bank Instance</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-slate-200">{method?.bankName}</span>
                                    {method?.bankLogoUrl && (
                                        <img src={method.bankLogoUrl} alt="Bank" className="w-6 h-6 object-contain grayscale hover:grayscale-0 transition-all" />
                                    )}
                                </div>
                            </div>

                            {/* Name */}
                            <div className="space-y-1">
                                <span className="text-slate-500 text-xs uppercase">Beneficiary Name</span>
                                <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5 group hover:border-amber-500/30 transition-colors gap-3">
                                    <span className="font-mono text-slate-200 flex-1">{method?.holderName}</span>
                                    <button
                                        onClick={() => handleCopy(method?.holderName, 'name')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${copiedName
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                                            }`}
                                    >
                                        {copiedName ? 'Copied!' : 'copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Number */}
                            <div className="space-y-1">
                                <span className="text-slate-500 text-xs uppercase">Account Number</span>
                                <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5 group hover:border-amber-500/30 transition-colors gap-3">
                                    <span className="font-mono text-xl tracking-wider text-amber-500">{method?.accountNumber}</span>
                                    <button
                                        onClick={() => handleCopy(method?.accountNumber, 'account')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${copiedAccount
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                                            }`}
                                    >
                                        {copiedAccount ? 'Copied!' : 'copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Confirmation Input */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3 text-amber-500/80 mb-2">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full"></div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-amber-100">
                            Paste payment sms Or enter TID: FT*****
                        </h2>
                    </div>

                    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-amber-500/50 to-amber-900/10">
                        <div className="bg-slate-900 rounded-2xl p-1">
                            <textarea
                                value={smsContent}
                                onChange={(e) => setSmsContent(e.target.value)}
                                placeholder="Paste your official transaction confirmation message or TID (FT...) here for priority processing..."
                                className="w-full h-36 p-5 rounded-xl bg-slate-950/50 border border-amber-500/10 text-amber-100 placeholder:text-amber-500/30 focus:outline-none focus:bg-slate-900 focus:border-amber-500/30 transition-all resize-none text-sm font-serif leading-relaxed"
                            />
                        </div>
                        <div className="absolute -top-3 left-4 bg-slate-950 px-2 text-[10px] text-amber-500 border border-amber-500/20 rounded uppercase tracking-wider">
                            Secure Input
                        </div>
                    </div>
                    <p className="text-[10px] text-amber-500/40 text-center uppercase tracking-widest">
                        Only verified details will be processed
                    </p>
                </section>
            </main>

            {/* Action Button */}
            <div className="p-6 bg-slate-950">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!smsContent.trim()}
                        className={`w-full h-14 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!smsContent.trim()
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-lg shadow-amber-900/20 hover:shadow-amber-500/20 active:scale-[0.98]'
                            }`}
                    >
                        <span>Confirm Payment</span>
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
        setTimeout(() => setShow(false), 500);
    };

    if (!show) return null;

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md transition-opacity duration-500 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-slate-950 border border-amber-500/40 rounded-2xl p-10 max-w-sm w-full shadow-[0_0_100px_rgba(245,158,11,0.15)] space-y-8 text-center transform transition-all duration-500 ${animateOut ? 'scale-90 opacity-0' : 'scale-100 opacity-100'} animate-in zoom-in-95 relative`}>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

                <div className="space-y-4 pt-4">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse"></div>
                        <Crown size={56} className="text-amber-400 relative z-10 fill-amber-500/10" />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-3xl font-serif text-amber-50 tracking-widest">VIP ACCESS</h3>
                        <p className="text-amber-500/60 text-sm leading-relaxed font-light px-4">
                            Welcome to <span className="text-amber-200 font-semibold">Turner Profitable Construction Partner</span>.
                            <br /><br />
                            Thank you for selecting the <span className="text-amber-200 font-semibold">Premium Payment Method</span>.
                            <br /><br />
                            <span className="text-xs uppercase tracking-[0.2em] opacity-80 border-t border-b border-amber-900/50 py-2 inline-block">Excellence Awaits</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleDismiss}
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 font-bold h-14 rounded-lg uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12"></div>
                    <span className="relative z-10">Enter Lounge</span>
                </button>
            </div>
        </div>
    );
}

export default function PremiumBankDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>}>
            <PremiumContent />
        </Suspense>
    );
}
