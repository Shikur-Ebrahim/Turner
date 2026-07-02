"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, Building2, Copy, Loader2, CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";

function RegularBankDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0";
    const methodId = searchParams.get("methodId");

    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [screenshotUrl, setScreenshotUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [copiedName, setCopiedName] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [language, setLanguage] = useState<"english" | "amharic">("english");

    const translations = {
        english: {
            rechargeTitle: "Recharge",
            orderRemaining: "Order Remaining",
            min: "Min",
            sec: "Sec",
            step1: "Step 1",
            step1Desc: "Copy account for payment",
            orderAmount: "Order Amount",
            etb: "ETB",
            paymentChannel: "Payment Channel",
            switch: "switch",
            accountName: "Account Name",
            accountNumber: "Account Number",
            copied: "Copied!",
            copy: "copy",
            step2: "Step 2",
            step2Desc: "Upload payment screenshot",
            smsPlaceholder: "Waiting for screenshot upload...",
            uploading: "Uploading...",
            uploadSuccess: "Upload Successful!",
            uploadErr: "Please upload payment proof",
            submitButton: "I HAVE TRANSFERRED",
            rechargeSubmitted: "Recharge Submitted",
            underReview: "Your deposit request for",
            underReviewEnd: "is currently under review.",
            proceedToHome: "Proceed to Home",
            securedBy: "Transaction Secured by Turner",
            welcomeToTurner: "Welcome to Turner",
            selectedPayment: "You have selected",
            selectedPaymentEnd: "Payment.",
            tapBelow: "Tap below to access your profitable partnership dashboard.",
            getStarted: "GET STARTED",
            loginFirst: "Please login first",
            enterSmsErr: "Please upload payment screenshot",
            failedLoad: "Failed to load payment details",
        },
        amharic: {
            rechargeTitle: "ገንዘብ ይሙሉ",
            orderRemaining: "የቀረው ጊዜ",
            min: "ደቂቃ",
            sec: "ሰከንድ",
            step1: "ደረጃ 1",
            step1Desc: "ለክፍያ ሂሳቡን ይቅዱ",
            orderAmount: "የትእዛዝ መጠን",
            etb: "ብር",
            paymentChannel: "የክፍያ መስመር",
            switch: "ቀይር",
            accountName: "የአካውንት ስም",
            accountNumber: "የአካውንት ቁጥር",
            copied: "ተገልብጧል!",
            copy: "ቅዳ",
            step2: "ደረጃ 2",
            step2Desc: "የክፍያ ቅጽበታዊ ገጽ እይታ ይስቀሉ (Screen Shot)",
            smsPlaceholder: "የቅጽበታዊ ገጽ እይታ ስቀላን በመጠባበቅ ላይ...",
            uploading: "በመጫን ላይ...",
            uploadSuccess: "በተሳካ ሁኔታ ተጭኗል!",
            uploadErr: "እባክዎ የክፍያ ማረጋገጫ ይስቀሉ",
            submitButton: "ገንዘቡን አስተላልፌያለሁ",
            rechargeSubmitted: "ክፍያዎ ገብቷል",
            underReview: "የመሙያ ጥያቄዎ",
            underReviewEnd: "በአሁኑ ጊዜ በመገምገም ላይ ነው።",
            proceedToHome: "ወደ መነሻ ገጽ ተመለስ",
            securedBy: "ግብይቱ በ Turner የተጠበቀ ነው",
            welcomeToTurner: "ወደ Turner እንኳን ደህና መጡ",
            selectedPayment: "የ",
            selectedPaymentEnd: "ክፍያን መርጠዋል በተጨማሪም",
            tapBelow: "ወደ ዳሽቦርድዎ ለመግባት ከታች ያለውን ይጫኑ።",
            getStarted: "ጀምር",
            loginFirst: "እባክዎ መጀመሪያ ይግቡ",
            enterSmsErr: "እባክዎ የክፍያ ቅጽበታዊ ገጽ እይታ ይስቀሉ",
            failedLoad: "የክፍያ መረጃን መጫን አልተቻለም",
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
                if (docSnap.exists()) {
                    setMethod(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching method:", error);
                toast.error(t('failedLoad'));
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
                paymentMethod: "regular",
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
            toast.error("Failed to submit. Please try again.");
        } finally {
            setSubmitting(false);
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
            {/* Premium Golden Success Modal Overlay */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-[#1a1a1a] w-full max-w-sm rounded-[3rem] p-10 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-500 shadow-amber-500/10">
                        {/* Premium Golden Glows */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-8">
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
                    <h1 className="text-lg font-bold">{t('rechargeTitle')}</h1>
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
                        <span className="font-medium text-lg">{t('orderRemaining')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 min-w-[3rem] text-center border border-white/30">
                            <span className="text-xl font-bold">{String(m).padStart(1, '0')}</span>
                            <span className="text-xs ml-1 opacity-80">{t('min')}</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-lg px-3 py-2 min-w-[3rem] text-center border border-white/30">
                            <span className="text-xl font-bold">{String(s).padStart(2, '0')}</span>
                            <span className="text-xs ml-1 opacity-80">{t('sec')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="px-5 pt-8 space-y-8 max-w-lg mx-auto">
                {/* Step 1 */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-6">
                        {t('step1')} <span className="text-slate-500 font-normal">{t('step1Desc')}</span>
                    </h2>

                    <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 space-y-6 shadow-xl shadow-purple-100/50">
                        {/* Order Amount */}
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-4">
                            <span className="text-slate-500 text-sm">{t('orderAmount')}</span>
                            <span className="text-xl font-bold text-purple-600">
                                {t('etb')} {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Payment Channel */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-sm">{t('paymentChannel')}</span>
                                <button className="text-xs px-3 py-1 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">{t('switch')}</button>
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
                            <span className="text-slate-500 text-sm">{t('accountName')}</span>
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-900 text-lg flex-1">{method?.holderName || "Account Name"}</span>
                                <button
                                    onClick={() => handleCopy(method?.holderName, 'name')}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${copiedName
                                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                        : 'bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-200 active:scale-95'
                                        }`}
                                >
                                    {copiedName ? t('copied') : t('copy')}
                                </button>
                            </div>
                        </div>

                        {/* Account Number */}
                        <div className="space-y-2">
                            <span className="text-slate-500 text-sm">{t('accountNumber')}</span>
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-bold text-slate-900 text-xl tracking-wide">{method?.accountNumber || "0000000000"}</span>
                                <button
                                    onClick={() => handleCopy(method?.accountNumber, 'account')}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${copiedAccount
                                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                        : 'bg-purple-100 text-purple-600 border border-purple-200 hover:bg-purple-200 active:scale-95'
                                        }`}
                                >
                                    {copiedAccount ? t('copied') : t('copy')}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step 2 */}
                <section>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex flex-wrap gap-1">
                        {t('step2')}
                        <span className="text-red-500">{t('step2Desc')}</span>
                    </h2>

                    <div className="relative group">
                        <div className="w-full min-h-[160px] p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-xl flex flex-col items-center justify-center gap-4 transition-all hover:border-purple-300 group-hover:bg-white/80 overflow-hidden shadow-lg shadow-purple-100/30">
                            {screenshotUrl ? (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md">
                                    <img src={screenshotUrl} alt="Payment Proof" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <label className="cursor-pointer bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm shadow-xl">
                                            Change Proof
                                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer py-4">
                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isUploading ? 'bg-purple-50 text-purple-600 animate-pulse' : 'bg-slate-50 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600'}`}>
                                        {isUploading ? (
                                            <Loader2 size={32} className="animate-spin" />
                                        ) : (
                                            <UploadCloud size={32} />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-700">{uploadStatus || t('smsPlaceholder')}</p>
                                        <p className="text-xs text-slate-400 mt-1">Tap to select image from your device</p>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Fixed Bottom Button */}
            <div className="p-6 bg-white border-t border-white/60">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!screenshotUrl || submitting || isUploading}
                        className={`w-full h-14 rounded-xl font-bold transition-all shadow-lg ${!screenshotUrl || submitting || isUploading
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70 shadow-none'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98] shadow-purple-300/50'
                            }`}
                    >
                        {submitting ? <Loader2 className="animate-spin mx-auto" /> : t('submitButton')}
                    </button>
                </div>
            </div>

            {/* Welcome Notification - Regular Theme */}
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
        <div className={`fixed inset-0 z-[110] flex items-center justify-center p-6 bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-slate-900/40 backdrop-blur-md transition-opacity duration-300 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
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
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900">{t('welcomeToTurner')}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed px-2 font-medium">
                        {t('selectedPayment')} <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{method?.bankDetailType || "Regular"} {t('selectedPaymentEnd')}</span>
                        <br />
                        {t('tapBelow')}
                    </p>
                </div>

                {/* Button */}
                <button
                    onClick={handleDismiss}
                    className="relative z-10 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 hover:bg-pos-100 text-white font-bold h-16 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-indigo-300/40 flex items-center justify-center gap-2 group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10 text-lg tracking-wide">{t('getStarted')}</span>
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
