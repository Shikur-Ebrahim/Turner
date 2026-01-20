"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, Copy, Loader2, ShieldCheck, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function SecureContent() {
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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
        toast.success("Copied secure data");

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
            setSubmitting(true);

            // Fetch phone number from users collection
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userPhone = userDocSnap.exists() ? userDocSnap.data()?.phoneNumber : "";

            await addDoc(collection(db, "RechargeReview"), {
                paymentMethod: "secure",
                bankName: method?.bankName || "",
                phoneNumber: userPhone || user.phoneNumber || "",
                amount: Number(amount),
                FTcode: smsContent,
                accountHolderName: method?.holderName || "",
                accountNumber: method?.accountNumber || "",
                status: "Under Review",
                userId: user.uid,
                timestamp: serverTimestamp()
            });

            // ADD NOTIFICATION
            await addDoc(collection(db, "UserNotifications"), {
                userId: user.uid,
                type: "recharge",
                amount: Number(amount),
                status: "Under Review",
                read: false,
                createdAt: serverTimestamp()
            });

            setShowSuccessModal(true);
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-900" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-44">
            {/* Premium Golden Success Modal Overlay */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-[#1a1a1a] w-full max-w-sm rounded-[3rem] p-10 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-500 shadow-amber-500/10 text-center">
                        {/* Premium Golden Glows */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center gap-8">
                            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-amber-400 via-amber-200 to-amber-600 p-[1px] shadow-2xl shadow-amber-500/20">
                                <div className="w-full h-full rounded-[1.95rem] bg-[#1a1a1a] flex items-center justify-center text-amber-500 relative">
                                    <div className="absolute inset-0 bg-amber-500/10 rounded-[1.95rem] animate-ping"></div>
                                    <CheckCircle2 size={48} strokeWidth={1.5} className="relative z-10" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 uppercase tracking-tight">Recharge Submitted</h3>
                                <p className="text-amber-100/60 text-sm font-bold leading-relaxed px-2">
                                    Your secure deposit request for <span className="text-amber-400 font-black">{Number(amount).toLocaleString()} ETB</span> is currently under review.
                                </p>
                            </div>

                            <div className="w-full pt-4">
                                <button
                                    onClick={() => router.push("/users/welcome")}
                                    className="w-full py-5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                    Proceed to Home
                                </button>
                                <p className="mt-6 text-[8px] font-black text-amber-500/30 uppercase tracking-[0.4em]">Transaction Secured by Turner</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <header className="bg-blue-900 text-white px-6 pt-6 pb-12 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={140} />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => router.back()} className="bg-blue-800/50 p-2 rounded-lg hover:bg-blue-800 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2 bg-blue-800/50 px-3 py-1 rounded-full text-xs font-medium">
                            <Lock size={12} />
                            Encrypted 256-bit
                        </div>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">Session Expires</p>
                            <h2 className="text-3xl font-mono font-bold tracking-tight">{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">Total</p>
                            <h2 className="text-2xl font-bold tracking-tight">ETB {Number(amount).toLocaleString()}</h2>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-5 -mt-8 relative z-20 space-y-6 max-w-md mx-auto">
                <div>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <h3 className="font-bold text-xs text-blue-200 uppercase tracking-wider">Step 1 Copy account for payment</h3>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-700">
                                {method?.bankLogoUrl ? <img src={method.bankLogoUrl} className="w-6 h-6 object-contain" /> : <ShieldCheck size={20} />}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900">{method?.bankName}</div>
                                <div className="text-xs text-slate-500">Verified Institution</div>
                            </div>
                            <CheckCircle2 size={16} className="text-green-500 ml-auto" />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1 group cursor-pointer">
                                <label className="text-xs text-slate-500 uppercase font-semibold">Account Number</label>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 group-hover:border-blue-500 transition-colors gap-3">
                                    <span className="font-mono text-lg font-bold text-slate-800 tracking-wider">{method?.accountNumber}</span>
                                    <button
                                        onClick={() => handleCopy(method?.accountNumber, 'account')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${copiedAccount
                                            ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                            : 'bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-200'
                                            }`}
                                    >
                                        {copiedAccount ? 'Copied!' : 'copy'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 group cursor-pointer">
                                <label className="text-xs text-slate-500 uppercase font-semibold">Beneficiary Name</label>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 group-hover:border-blue-500 transition-colors gap-3">
                                    <span className="font-medium text-slate-800 flex-1">{method?.holderName}</span>
                                    <button
                                        onClick={() => handleCopy(method?.holderName, 'name')}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${copiedName
                                            ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                            : 'bg-blue-100 text-blue-600 border border-blue-200 hover:bg-blue-200'
                                            }`}
                                    >
                                        {copiedName ? 'Copied!' : 'copy'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 text-center">
                            <p className="text-xs text-slate-400">
                                Please ensure exact amount transfer to avoid delays.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Paste payment sms Or enter TID: FT*****</h3>
                        </div>
                        <Lock size={12} className="text-slate-400" />
                    </div>

                    <div className="p-1">
                        <textarea
                            value={smsContent}
                            onChange={(e) => setSmsContent(e.target.value)}
                            className="w-full h-28 p-4 text-sm focus:outline-none transition-all placeholder:text-slate-300 text-slate-700 resize-none font-mono"
                            placeholder="// Paste transaction ID or SMS confirmation here..."
                        />
                    </div>

                    <div className="bg-slate-50 border-t border-slate-100 p-2 text-right">
                        <span className="text-[10px] text-slate-400 font-mono">ENCRYPTED INPUT ZONE</span>
                    </div>
                </div>
            </main>

            <div className="bg-white border-t border-slate-100 p-4">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!smsContent.trim() || submitting}
                        className={`w-full font-bold h-12 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${!smsContent.trim() || submitting
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                            : 'bg-blue-900 hover:bg-blue-800 text-white shadow-md'
                            }`}
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : <><Lock size={16} /> Confirm Secure Transaction</>}
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
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-900/50 via-slate-900/50 to-teal-900/50 backdrop-blur-xl transition-opacity duration-300 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-3xl border border-white/30 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] max-w-sm w-full shadow-2xl shadow-blue-500/30 text-center space-y-6 sm:space-y-8 transform transition-all duration-300 overflow-hidden ${animateOut ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0'} animate-in zoom-in-95`}>
                {/* Animated Background Blobs */}
                <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] bg-blue-500/30 rounded-full blur-[60px] pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-[-30%] right-[-30%] w-[60%] h-[60%] bg-teal-500/30 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[50px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

                {/* Security Badge with Animation */}
                <div className="relative z-10">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/40 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent"></div>
                        <div className="absolute inset-0 border-4 border-blue-300/30 rounded-2xl sm:rounded-3xl animate-[spin_3s_linear_infinite]"></div>
                        <div className="absolute inset-0 bg-blue-400/20 animate-pulse"></div>
                        <Lock size={36} className="text-white relative z-10" />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3 sm:space-y-4 relative z-10">
                    <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-200 to-teal-200 tracking-tight leading-tight">Verified Access</h3>

                    <div className="space-y-2 text-left bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                        <p className="text-blue-200 text-xs sm:text-sm leading-relaxed font-medium">
                            <span className="text-cyan-400 font-mono">{`> `}</span>
                            Welcome to <span className="font-bold text-white">Secure Turner</span>
                        </p>
                        <p className="text-blue-200 text-xs sm:text-sm leading-relaxed font-medium">
                            <span className="text-cyan-400 font-mono">{`> `}</span>
                            Profitable Construction Company
                        </p>
                        <p className="text-blue-200 text-xs sm:text-sm leading-relaxed font-medium">
                            <span className="text-cyan-400 font-mono">{`> `}</span>
                            Thank you for selecting the <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-teal-300">Secure Payment Method</span>
                        </p>
                    </div>

                    <p className="text-blue-100/80 text-xs sm:text-sm leading-relaxed font-light px-2">
                        You are entering the <span className="font-bold text-white">{method?.bankDetailType || "Secure"} Portal</span>.
                        <br />
                        All transaction data is encrypted with 256-bit security.
                    </p>
                </div>

                {/* Enhanced Secure Button */}
                <button
                    onClick={handleDismiss}
                    className="relative z-10 w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white font-bold h-14 sm:h-16 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.6)] transition-all active:scale-95 flex items-center justify-center gap-2 overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <ShieldCheck size={20} className="relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="relative z-10 text-base sm:text-lg tracking-wide uppercase font-black">Enter Secure Zone</span>
                </button>
            </div>
        </div>
    );
}

export default function SecureBankDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-900" /></div>}>
            <SecureContent />
        </Suspense>
    );
}
