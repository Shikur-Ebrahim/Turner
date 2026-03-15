"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, Copy, Loader2, Sparkles, Wand2, CreditCard, Wallet, ArrowRightLeft, CheckCircle2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

function SmartContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0";
    const methodId = searchParams.get("methodId");

    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(600);
    const [screenshotUrl, setScreenshotUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [copiedName, setCopiedName] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [language, setLanguage] = useState<"english" | "amharic">("english");

    const translations = {
        english: {
            smartPay: "Smart Pay",
            transferAmount: "Transfer Amount",
            step1: "Step 1",
            step1Desc: "Copy account for payment",
            currentBank: "Current Bank",
            accountNumber: "Account Number",
            beneficiaryName: "Beneficiary Name",
            copied: "Copied!",
            copy: "copy",
            pasteSMSLabel: "Upload payment screenshot",
            consolePlaceholder: "Waiting for screenshot upload...",
            uploading: "Uploading...",
            uploadSuccess: "Upload Successful!",
            uploadErr: "Please upload payment proof",
            waitingInput: "WAITING FOR UPLOAD",
            confirmTransaction: "Confirm Transaction",
            processing: "Processing...",
            rechargeSubmitted: "Recharge Submitted",
            underReview: "Your smart deposit request for",
            underReviewEnd: "is currently under review.",
            proceedToHome: "Proceed to Home",
            securedBy: "Transaction Secured by Turner",
            welcomeTo: "Welcome to",
            smartTurner: "Smart Turner",
            profitableCo: "Profitable Construction Company",
            selectMsg: "Thank you for selecting the",
            smartMethod: "Smart Payment Method",
            protocolInit: "Protocol initialized.",
            welcomeFuture: "Welcome to the future of Turner Construction payments.",
            getStarted: "Get Started",
            failedLoad: "Failed to load",
            loginFirst: "Please login first",
            enterSmsErr: "Please upload a payment screenshot",
            etb: "ETB"
        },
        amharic: {
            smartPay: "ስማርት ክፍያ",
            transferAmount: "የዝውውር መጠን",
            step1: "ደረጃ 1",
            step1Desc: "ለክፍያ ሂሳቡን ይቅዱ",
            currentBank: "ወቅታዊ ባንክ",
            accountNumber: "የሂሳብ ቁጥር",
            beneficiaryName: "የሂሳብ ስም",
            copied: "ተገልብጧል!",
            copy: "ቅዳ",
            pasteSMSLabel: "የክፍያ ቅጽበታዊ ገጽ እይታ ይስቀሉ (Screen Shot)",
            consolePlaceholder: "የቅጽበታዊ ገጽ እይታ ስቀላን በመጠባበቅ ላይ...",
            waitingInput: "መጫን በመጠባበቅ ላይ",
            confirmTransaction: "ግብይቱን ያረጋግጡ",
            processing: "በማ ሂደት ላይ...",
            rechargeSubmitted: "ክፍያዎ ገብቷል",
            underReview: "የስማርት መሙያ ጥያቄዎ",
            underReviewEnd: "በአሁኑ ጊዜ በመገምገም ላይ ነው።",
            proceedToHome: "ወደ መነሻ ገጽ ተመለስ",
            securedBy: "ግብይቱ በ Turner የተጠበቀ ነው",
            welcomeTo: "እንኳን ወደ",
            smartTurner: "ስማርት ቱርነር በደህና መጡ",
            profitableCo: "ትርፋማ የኮንስትራክሽን ኩባንያ",
            selectMsg: "ስማርት የክፍያ ዘዴን ስለመረጡ እናመሰግናለን",
            smartMethod: " ",
            protocolInit: "ፕሮቶኮል ተጀምሯል።",
            welcomeFuture: "ወደ ቱርነር ኮንስትራክሽን ክፍያዎች የወደፊት ጊዜ እንኳን ደህና መጡ።",
            getStarted: "ይጀምሩ",
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setUploadStatus(t('uploading'));

        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default");

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: uploadData }
            );
            const data = await response.json();
            if (data.secure_url) {
                setScreenshotUrl(data.secure_url);
                setUploadStatus(t('uploadSuccess'));
                toast.success(t('uploadSuccess'));
            } else {
                setUploadStatus("Failed");
                toast.error("Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            setUploadStatus("Error");
            toast.error("Error occurred during upload");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!screenshotUrl) {
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

            await addDoc(collection(db, "RechargeReview"), {
                paymentMethod: "smart",
                bankName: method?.bankName || "",
                phoneNumber: userPhone || user.phoneNumber || "",
                amount: Number(amount),
                FTcode: "Screenshot Uploaded",
                screenshotUrl: screenshotUrl,
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><Loader2 className="animate-spin text-purple-500" /></div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white pb-48 font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
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
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[90px]"></div>
            </div>

            <header className="px-6 py-6 flex justify-between items-center relative z-10">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="glass-pill px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-xs font-bold tracking-widest uppercase text-purple-300">
                    {t('smartPay')}
                </div>
                <div className="w-10"></div>
            </header>

            <main className="px-6 relative z-10 max-w-md mx-auto space-y-8">

                {/* Timer & Amount */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-2 relative">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path
                                className="text-white/10"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                            <path
                                className="text-purple-500 transition-all duration-1000 ease-linear"
                                strokeDasharray={`${(timeLeft / 600) * 100}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono">
                            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                        </div>
                    </div>
                    <div>
                        <span className="text-slate-400 text-xs uppercase tracking-wider">{t('transferAmount')}</span>
                        <h1 className="text-4xl font-light text-white mt-1">
                            <span className="text-purple-400 font-bold">{t('etb')}</span> {Number(amount).toLocaleString()}
                        </h1>
                    </div>
                </div>

                {/* Step 1: Glass Credit Card */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-purple-300 uppercase tracking-widest pl-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
                        {t('step1')} {t('step1Desc')}
                    </label>

                    {/* The Card */}
                    <div className="relative aspect-[1.586] w-full rounded-3xl overflow-hidden group perspective-1000">
                        {/* Glass Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl"></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-50"></div>

                        {/* Card Content */}
                        <div className="relative h-full p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="text-xs text-white/50 uppercase tracking-wider">{t('currentBank')}</div>
                                    <div className="flex items-center gap-2 font-bold text-lg text-white">
                                        {method?.bankLogoUrl && <img src={method.bankLogoUrl} className="w-6 h-6 object-contain rounded-full bg-white/10 p-0.5" />}
                                        {method?.bankName}
                                    </div>
                                </div>
                                <Sparkles className="text-purple-300/50" />
                            </div>

                            <div className="space-y-1 my-2">
                                <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest">
                                    <CreditCard size={12} />
                                    <span>{t('accountNumber')}</span>
                                </div>
                                <div className="flex items-center gap-3 group/copy">
                                    <div
                                        onClick={() => handleCopy(method?.accountNumber, 'account')}
                                        className="font-mono text-2xl text-white tracking-widest drop-shadow-md cursor-pointer hover:scale-[1.02] transition-transform origin-left active:scale-95 flex-1"
                                    >
                                        {method?.accountNumber}
                                    </div>
                                    <button
                                        onClick={() => handleCopy(method?.accountNumber, 'account')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${copiedAccount
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                                            }`}
                                    >
                                        {copiedAccount ? t('copied') : t('copy')}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="space-y-1 flex-1">
                                    <div className="text-[10px] text-white/50 uppercase tracking-wider">{t('beneficiaryName')}</div>
                                    <div className="flex items-center gap-3">
                                        <div
                                            onClick={() => handleCopy(method?.holderName, 'name')}
                                            className="font-medium text-white cursor-pointer hover:text-purple-300 transition-colors flex-1"
                                        >
                                            {method?.holderName}
                                        </div>
                                        <button
                                            onClick={() => handleCopy(method?.holderName, 'name')}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${copiedName
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
                                                }`}
                                        >
                                            {copiedName ? 'Copied!' : 'copy'}
                                        </button>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                                    <div className="w-4 h-4 bg-yellow-400/80 rounded-full blur-[1px]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2: Advanced Input */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-purple-300 uppercase tracking-widest pl-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
                        {t('pasteSMSLabel')}
                    </label>

                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-40 transitionduration-500 blur"></div>
                        <div className="relative bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 min-h-[160px] flex flex-col items-center justify-center gap-4 transition-all overflow-hidden">
                            {screenshotUrl ? (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-white/5">
                                    <img src={screenshotUrl} alt="Payment Proof" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <label className="cursor-pointer bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-xl">
                                            Update Image
                                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer py-4">
                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isUploading ? 'bg-purple-500/20 text-purple-400 animate-spin' : 'bg-white/5 text-slate-500 group-hover:bg-purple-500/20 group-hover:text-purple-400'}`}>
                                        <UploadCloud size={28} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-purple-100 uppercase tracking-wider text-[10px]">{uploadStatus || t('consolePlaceholder')}</p>
                                        <p className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                                            {t('waitingInput')}
                                        </p>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>
                </div>

            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-24 left-6 right-6 z-[100] max-w-md mx-auto">
                <button
                    onClick={handleSubmit}
                    disabled={!screenshotUrl || submitting || isUploading}
                    className={`w-full h-16 rounded-[2rem] backdrop-blur-xl border flex items-center justify-between px-2 transition-all group overflow-hidden relative ${!screenshotUrl || submitting || isUploading
                        ? 'bg-white/5 border-white/5 cursor-not-allowed grayscale'
                        : 'bg-white/10 border-white/20 shadow-2xl hover:bg-white/15'
                        }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className={`pl-6 font-bold tracking-wider text-sm uppercase relative z-10 ${!smsContent.trim() || submitting ? 'text-white/40' : 'text-white'}`}>
                        {submitting ? t('processing') : t('confirmTransaction')}
                    </span>
                    <div className={`h-12 w-16 rounded-[1.5rem] flex items-center justify-center shadow-lg relative z-10 group-active:scale-95 transition-transform ${!smsContent.trim() || submitting ? 'bg-white/10 text-white/20' : 'bg-white text-purple-600'}`}>
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <ArrowRightLeft size={20} />}
                    </div>
                </button>
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
        setTimeout(() => setShow(false), 500);
    };

    if (!show) return null;

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-purple-900/50 via-indigo-900/50 to-slate-900/50 backdrop-blur-xl transition-opacity duration-500 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
            {/* Glass Modal */}
            <div className={`relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-3xl border border-white/30 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] max-w-sm w-full shadow-2xl shadow-purple-500/30 text-center space-y-6 sm:space-y-8 transform transition-all duration-500 overflow-hidden ${animateOut ? 'scale-110 opacity-0 blur-xl' : 'scale-100 opacity-100'}`}>
                {/* Animated Background Blobs */}
                <div className="absolute top-[-30%] left-[-30%] w-[60%] h-[60%] bg-purple-500/30 rounded-full blur-[60px] pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-[-30%] right-[-30%] w-[60%] h-[60%] bg-blue-500/30 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-pink-500/20 rounded-full blur-[50px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

                {/* Icon with Gradient */}
                <div className="relative z-10">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/40 transform hover:rotate-6 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent"></div>
                        <div className="absolute inset-0 bg-purple-400/20 animate-pulse"></div>
                        <Sparkles className="text-white relative z-10" size={36} />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-3 sm:space-y-4 relative z-10">
                    <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-indigo-200 to-blue-200 tracking-tight leading-tight">{t('smartPay')}</h3>

                    <div className="space-y-2 text-left bg-black/20 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                        <p className="text-purple-200 text-xs sm:text-sm leading-relaxed font-medium">
                            <span className="text-cyan-400 font-mono">{`> `}</span>
                            {t('welcomeTo')} <span className="font-bold text-white">{t('smartTurner')}</span>
                        </p>
                        <p className="text-purple-200 text-xs sm:text-sm leading-relaxed font-medium">
                            <span className="text-cyan-400 font-mono">{`> `}</span>
                            {t('profitableCo')}
                        </p>
                        <p className="text-purple-200 text-xs sm:text-sm leading-relaxed font-medium">
                            <span className="text-cyan-400 font-mono">{`> `}</span>
                            {t('selectMsg')} <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">{t('smartMethod')}</span>
                        </p>
                    </div>

                    <p className="text-purple-100/80 text-xs sm:text-sm leading-relaxed font-light px-2">
                        <span className="font-semibold text-white">{method?.bankDetailType || "Smart"} {t('protocolInit')}</span>
                        <br />
                        {t('welcomeFuture')}
                    </p>
                </div>

                {/* Enhanced Button */}
                <button
                    onClick={handleDismiss}
                    className="relative z-10 w-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white font-bold h-14 sm:h-16 rounded-full shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] transition-all active:scale-95 flex items-center justify-center gap-2 overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <Wand2 size={18} className="relative z-10 group-hover:rotate-12 transition-transform" />
                    <span className="relative z-10 text-base sm:text-lg tracking-wide">{t('getStarted')}</span>
                </button>
            </div>
        </div>
    );
}

export default function SmartBankDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><Loader2 className="animate-spin text-purple-500" /></div>}>
            <SmartContent />
        </Suspense>
    );
}
