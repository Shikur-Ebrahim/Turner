"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { ChevronLeft, Copy, Loader2, Zap, Wifi } from "lucide-react";
import { toast } from "sonner";

function DigitalContent() {
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
        toast.success("Copied!");

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
                paymentMethod: "digital",
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
            router.push("/users/transaction-pending?theme=digital");
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Failed to submit. Please try again.");
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>;

    return (
        <div className="min-h-screen bg-black text-cyan-50 font-mono pb-32 selection:bg-cyan-500/30">
            {/* Grid Background */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            <header className="relative z-10 flex items-center justify-between px-4 py-6 border-b border-cyan-500/30 bg-black/80 backdrop-blur-sm">
                <button onClick={() => router.back()} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    <ChevronLeft size={28} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                    <span className="text-cyan-500 font-bold tracking-widest uppercase text-sm">System Active</span>
                </div>
                <Wifi size={20} className="text-cyan-500/50" />
            </header>

            <main className="relative z-10 px-6 pt-10 max-w-lg mx-auto space-y-8">
                {/* Timer Glitch Effect */}
                <div className="text-center space-y-2">
                    <div className="inline-block border border-cyan-500/30 px-6 py-2 rounded-none bg-cyan-950/20 backdrop-blur-md">
                        <span className="text-4xl font-bold text-cyan-400 tracking-[0.2em] font-mono drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                {/* Digital Card */}
                <div>
                    <div className="mb-3">
                        <label className="text-xs text-cyan-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                            Step 1 Copy account for payment
                        </label>
                    </div>
                    <div className="bg-slate-900 border border-cyan-500/30 p-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>

                        <div className="bg-black/50 p-6 space-y-6">
                            <div className="flex justify-between items-center text-xs text-cyan-500/50 uppercase tracking-widest">
                                <span>Payment Protocol</span>
                                <span>Secure // {methodId?.substring(0, 6)}</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-cyan-600 block mb-1">Target Bank</label>
                                    <div className="flex items-center gap-3 text-lg font-bold text-white">
                                        <div className="w-2 h-full bg-cyan-500/50"></div>
                                        {method?.bankName}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-cyan-600 block mb-1">Account Name</label>
                                    <div className="flex justify-between items-center bg-cyan-950/30 p-3 border border-cyan-500/20 hover:border-cyan-500/50 transition-colors gap-3">
                                        <span className="text-cyan-100 flex-1">{method?.holderName}</span>
                                        <button
                                            onClick={() => handleCopy(method?.holderName, 'name')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${copiedName
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                                                }`}
                                        >
                                            {copiedName ? 'Copied!' : 'copy'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-cyan-600 block mb-1">Account Number</label>
                                    <div className="flex justify-between items-center bg-cyan-950/30 p-3 border border-cyan-500/20 hover:border-cyan-500/50 transition-colors gap-3">
                                        <span className="text-xl tracking-widest text-cyan-400 font-bold">{method?.accountNumber}</span>
                                        <button
                                            onClick={() => handleCopy(method?.accountNumber, 'account')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${copiedAccount
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                                                }`}
                                        >
                                            {copiedAccount ? 'Copied!' : 'copy'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                    <span className="text-cyan-600 uppercase text-xs">Processing Amount</span>
                    <span className="text-2xl font-bold text-white">ETB {Number(amount).toLocaleString()}</span>
                </div>

                {/* Input Console */}
                <div className="space-y-3">
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                        PASTE PAYMENT SMS OR ENTER TID: FT*****
                    </label>
                    <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <textarea
                            value={smsContent}
                            onChange={(e) => setSmsContent(e.target.value)}
                            className="relative w-full bg-slate-900/90 border border-cyan-500/50 text-cyan-300 p-5 h-36 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all font-mono text-xs rounded-lg"
                            placeholder="> PASTE TRANSACTION SMS OR TID HERE...
> EXAMPLE: FT123456789...
> WAITING FOR DATA SIGNAL..."
                        />
                        <div className="absolute bottom-2 right-2 text-[10px] text-cyan-700 animate-pulse">
                            _CURSOR_ACTIVE
                        </div>
                    </div>
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 border-t border-cyan-500/30 backdrop-blur-sm z-50">
                <button
                    onClick={handleSubmit}
                    disabled={!smsContent.trim()}
                    className={`w-full font-bold h-12 uppercase tracking-widest clip-path-polygon transition-all flex items-center justify-center gap-3 ${!smsContent.trim()
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-black hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                        }`}
                >
                    <Zap size={18} fill="currentColor" />
                    Initialize Transfer
                </button>
            </footer>

            <WelcomeNotification method={method} />
        </div>
    );
}

function WelcomeNotification({ method }: { method: any }) {
    const [show, setShow] = useState(true);
    const [animateOut, setAnimateOut] = useState(false);

    const handleDismiss = () => {
        setAnimateOut(true);
        setTimeout(() => setShow(false), 200);
    };

    if (!show) return null;

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm transition-opacity duration-200 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-black border-2 border-cyan-500 p-1 max-w-sm w-full relative group transform transition-all duration-200 ${animateOut ? 'scale-y-0 opacity-0' : 'scale-100 opacity-100'}`}>
                {/* Glitch Corners */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400"></div>

                <div className="bg-slate-900 p-8 text-center space-y-8 relative overflow-hidden">
                    {/* Scanline */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(6,182,212,0.05)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan pointer-events-none"></div>

                    <div className="flex justify-center">
                        <div className="relative">
                            <Wifi size={48} className="text-cyan-400 animate-pulse relative z-10" />
                            <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-40 animate-pulse"></div>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <h3 className="text-2xl font-black text-white uppercase tracking-widest glitch-text" data-text="SYSTEM READY">
                            SYSTEM READY
                        </h3>
                        <div className="h-[1px] w-full bg-cyan-900"></div>
                        <p className="text-cyan-400 text-xs font-mono leading-relaxed tracking-wide">
                            {`> `}Welcome to <span className="text-white font-bold">Digital Turner</span>
                            <br />
                            {`> `}Profitable Construction Company
                            <br />
                            {`> `}Thank you for selecting the <span className="text-cyan-300 font-bold">Digital Payment Method</span>
                            <br />
                            <br />
                            {`> `}GATEWAY: <span className="text-white font-bold">{method?.bankDetailType?.toUpperCase() || "DIGITAL"}</span>
                            <br />
                            {`> `}STATUS: <span className="text-green-400 animate-pulse">ONLINE</span>
                            <br />
                            {`> `}READY FOR EXECUTION...
                        </p>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="w-full bg-cyan-500 text-black font-black h-14 uppercase tracking-widest text-sm transition-all hover:bg-white hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] active:scale-95 flex items-center justify-center gap-2 group relative z-10 hover:skew-x-[-10deg]"
                    >
                        <span>[ EXECUTE PROTOCOL ]</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DigitalBankDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>}>
            <DigitalContent />
        </Suspense>
    );
}
