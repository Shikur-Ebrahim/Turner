"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, Copy, Loader2, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [language, setLanguage] = useState<"english" | "amharic">("english");

    const translations = {
        english: {
            expressPay: "Express Pay",
            step1: "Step 1",
            step1Desc: "Copy account for payment",
            bank: "Bank",
            accountNumber: "Account Number",
            accountName: "Account Name",
            copied: "Copied!",
            copy: "copy",
            totalPayment: "Total Payment",
            step2: "Step 2",
            pasteSMS: "Paste payment SMS",
            orEnterTID: "or enter TID: FT*****",
            smsPlaceholder: "Dear Mr your Account 1*********1122 has been debited wth ETB 200.00. Your Current Balance is ETB 44.76 Thank you for Banking with CBE! etc...",
            iHaveTransferred: "I Have Transferred",
            initializing: "Initializing...",
            rechargeSubmitted: "Recharge Submitted",
            underReview: "Your express deposit request for",
            underReviewEnd: "is currently under review.",
            proceedToHome: "Proceed to Home",
            securedBy: "Transaction Secured by Turner",
            expressEntry: "Express Entry",
            welcomeToTurner: "Welcome to",
            partner: "Turner Profitable Construction Partner",
            paymentGatewaySelected: "Payment gateway selected.",
            fastTrackReady: "Your fast-track to profitability is ready.",
            thankYouSelected: "Thank you for selecting the Express Payment Method.",
            enterNow: "ENTER NOW",
            failedLoad: "Failed to load",
            loginFirst: "Please login first",
            enterSmsErr: "Please enter SMS content or FT code",
            etb: "ETB"
        },
        amharic: {
            expressPay: "ኤክስፕረስ ክፍያ",
            step1: "ደረጃ 1",
            step1Desc: "ለክፍያ ሂሳቡን ይቅዱ",
            bank: "ባንክ",
            accountNumber: "የአካውንት ቁጥር",
            accountName: "የአካውንት ስም",
            copied: "ተገልብጧል!",
            copy: "ቅዳ",
            totalPayment: "ጠቅላላ ክፍያ",
            step2: "ደረጃ 2",
            pasteSMS: "የክፍያ SMS ይለጥፉ",
            orEnterTID: "ወይም FT ኮድ ያስገቡ",
            smsPlaceholder: "ውድ ደንበኛ ሂሳብ ቁጥር 1*********1122 በ 200.00 ብር ቀንሷል... ወዘተ",
            iHaveTransferred: "ክፍያ ፈጽሜያለሁ",
            initializing: "በመጀመር ላይ...",
            rechargeSubmitted: "ክፍያዎ ገብቷል",
            underReview: "የኤክስፕረስ መሙያ ጥያቄዎ",
            underReviewEnd: "በአሁኑ ጊዜ በመገምገም ላይ ነው።",
            proceedToHome: "ወደ መነሻ ገጽ ተመለስ",
            securedBy: "ግብይቱ በ Turner የተጠበቀ ነው",
            expressEntry: "ኤክስፕረስ መግቢያ",
            welcomeToTurner: "እንኳን ወደ",
            partner: "ቱርነር ትርፋማ የኮንስትራክሽን አጋር በደህና መጡ",
            paymentGatewaySelected: "የክፍያ ጌትዌይ ተመርጧል።",
            fastTrackReady: "ወደ ትርፋማነት የሚያደርሱዎት ፈጣን መንገድ ዝግጁ ነው።",
            thankYouSelected: "ኤክስፕረስ የክፍያ ዘዴን ስለመረጡ እናመሰግናለን።",
            enterNow: "አሁን ይግቡ",
            failedLoad: "መጫን አልተቻለም",
            loginFirst: "እባክዎ መጀመሪያ ይግቡ",
            enterSmsErr: "እባክዎ የSMS ይዘትን ወይም FT ኮዱን ያስገቡ",
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

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchMethod = async () => {
            if (!methodId) return;
            try {
                const docRef = doc(db, "paymentMethods", methodId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setMethod(docSnap.data());
            } catch (error) { toast.error(t('failedLoad')); }
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
        toast.success(t('copied'));

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
            toast.error(t('enterSmsErr'));
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error(t('loginFirst'));
                return;
            }
            setSubmitting(true);

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
            toast.error(t('failedLoad'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-black" /></div>;

    return (
        <div className="min-h-screen bg-white text-black font-sans pb-44">
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
                                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 uppercase tracking-tight">{t('rechargeSubmitted')}</h3>
                                <p className="text-amber-100/60 text-sm font-bold leading-relaxed px-2">
                                    {t('underReview')} <span className="text-amber-400 font-black">{Number(amount).toLocaleString()} {t('etb')}</span> {t('underReviewEnd')}
                                </p>
                            </div>

                            <div className="w-full pt-4">
                                <button
                                    onClick={() => router.push("/users/welcome")}
                                    className="w-full py-5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                    {t('proceedToHome')}
                                </button>
                                <p className="mt-6 text-[8px] font-black text-amber-500/30 uppercase tracking-[0.4em]">{t('securedBy')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Minimal Header */}
            <header className="px-4 sm:px-6 py-5 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-slate-100">
                <button onClick={() => router.back()} className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all">
                    <ChevronLeft size={22} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t('expressPay')}</span>
                    <span className="font-mono font-bold tabular-nums text-xl text-emerald-600 mt-0.5">
                        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                    </span>
                </div>
                <div className="w-11"></div>
            </header>

            <main className="px-4 sm:px-6 pt-6 max-w-md mx-auto space-y-6">
                {/* Big Amount - High Visibility */}
                <div className="bg-black text-white p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-2">
                    <span className="text-slate-400 text-xs uppercase tracking-wider">{t('totalPayment')}</span>
                    <span className="text-5xl font-bold tracking-tight">{t('etb')} {Number(amount).toLocaleString()}</span>
                </div>

                <div className="space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">1</div>
                        <h2 className="font-bold text-base sm:text-lg leading-tight">{t('step1')} <span className="font-normal text-slate-500 text-sm sm:text-base">{t('step1Desc')}</span></h2>
                    </div>

                    <div className="bg-slate-50 border-l-4 border-black p-5 space-y-5 rounded-r-2xl shadow-sm">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                            <span className="text-slate-500 text-sm font-medium">{t('bank')}</span>
                            <span className="font-bold text-slate-900">{method?.bankName}</span>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{t('accountNumber')}</label>
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 gap-3">
                                <span className="font-mono text-lg sm:text-xl font-bold tracking-wide text-slate-900">{method?.accountNumber}</span>
                                <button
                                    onClick={() => handleCopy(method?.accountNumber, 'account')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 ${copiedAccount
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                        }`}
                                >
                                    {copiedAccount ? t('copied') : t('copy')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{t('accountName')}</label>
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 gap-3">
                                <span className="font-semibold text-slate-900 flex-1">{method?.holderName}</span>
                                <button
                                    onClick={() => handleCopy(method?.holderName, 'name')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 ${copiedName
                                        ? 'bg-emerald-100 text-emerald-600'
                                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                        }`}
                                >
                                    {copiedName ? t('copied') : t('copy')}
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
                            <span className="text-red-500">{t('pasteSMS')}</span> <span className="text-slate-500 font-normal text-sm">{t('orEnterTID')}</span>
                        </h2>
                    </div>

                    <div className="relative">
                        <textarea
                            value={smsContent}
                            onChange={(e) => setSmsContent(e.target.value)}
                            placeholder={t('smsPlaceholder')}
                            className="w-full h-36 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl p-4 resize-none transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400 text-sm leading-relaxed shadow-sm"
                        />
                    </div>
                </div>
            </main>

            {/* Action Button */}
            <div className="p-6 bg-white border-t border-slate-100">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!smsContent.trim() || submitting}
                        className={`w-full h-14 rounded-full font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!smsContent.trim() || submitting
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70 shadow-none'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-lg shadow-emerald-200'
                            }`}
                    >
                        <span>{submitting ? <Loader2 className="animate-spin" /> : t('iHaveTransferred')}</span>
                        {!submitting && <ArrowRight size={18} />}
                    </button>
                </div>
            </div>

            <WelcomeNotification t={t} method={method} />
        </div>
    );
}

function WelcomeNotification({ t, method }: { t: any, method: any }) {
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
                    <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{t('expressEntry')}</h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                        {t('welcomeToTurner')} <span className="font-bold text-emerald-600">{t('partner')}</span>.
                        <br /><br />
                        <span className="font-bold text-emerald-600 uppercase">{method?.bankDetailType || "Express"} {t('expressPay')}</span> {t('paymentGatewaySelected')}
                        <br />
                        {t('fastTrackReady')}
                        <br /><br />
                        {t('thankYouSelected')}
                    </p>
                </div>

                <button
                    onClick={handleDismiss}
                    className="w-full bg-slate-900 hover:bg-black text-white font-black h-16 rounded-2xl transition-all active:scale-95 shadow-xl shadow-slate-300 flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative z-10 text-lg tracking-widest uppercase">{t('enterNow')}</span>
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
