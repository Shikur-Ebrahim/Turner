"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, Copy, Loader2, Crown, ShieldCheck, Clock, CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";

function PremiumContent() {
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
            premiumPay: "Premium Pay",
            timeRemaining: "Time Remaining",
            totalAmount: "Total Amount",
            step1: "Step 1",
            step1Desc: "Copy account for payment",
            bankInstance: "Bank Instance",
            beneficiaryName: "Beneficiary Name",
            accountNumber: "Account Number",
            copied: "Copied to clipboard",
            copy: "copy",
            pasteSMS: "Upload payment screenshot",
            pastePlaceholder: "Waiting for screenshot upload...",
            uploading: "Processing Upload...",
            uploadSuccess: "Upload Verified!",
            uploadErr: "Please upload premium payment proof",
            secureInput: "Secure Input",
            verifiedDetails: "Only verified details will be processed",
            confirmPayment: "Confirm Payment",
            vipAccess: "VIP ACCESS",
            welcomeTo: "Welcome to",
            partner: "Turner Profitable Construction Partner",
            selectMsg: "Thank you for selecting the",
            premiumMethod: "Premium Payment Method",
            excellenceAwaits: "Excellence Awaits",
            enterLounge: "Enter Lounge",
            rechargeSubmitted: "Recharge Submitted",
            underReview: "Your premium deposit request for",
            underReviewEnd: "is currently under review.",
            proceedToHome: "Proceed to Home",
            securedBy: "Transaction Secured by Turner",
            failedLoad: "Failed to load payment details",
            loginFirst: "Please login first",
            enterSmsErr: "Please upload a payment screenshot",
            etb: "ETB"
        },
        amharic: {
            premiumPay: "ፕሪሚየም ክፍያ",
            timeRemaining: "ቀሪ ጊዜ",
            totalAmount: "ጠቅላላ ክፍያ",
            step1: "ደረጃ 1",
            step1Desc: "ለክፍያ ሂሳቡን ይቅዱ",
            bankInstance: "የባንክ መረጃ",
            beneficiaryName: "የሂሳብ ስም",
            accountNumber: "የሂሳብ ቁጥር",
            copied: "ተገልብጧል",
            copy: "ቅዳ",
            pasteSMS: "የክፍያ ቅጽበታዊ ገጽ እይታ ይስቀሉ (Screen Shot)",
            pastePlaceholder: "የቅጽበታዊ ገጽ እይታ ስቀላን በመጠባበቅ ላይ...",
            uploading: "በመጫን ላይ...",
            uploadSuccess: "ተሳክቷል!",
            uploadErr: "እባክዎ የክፍያዎን ቅጽበታዊ ገጽ እይታ ይስቀሉ",
            secureInput: "ደህንነቱ የተጠበቀ ማስገቢያ",
            verifiedDetails: "የተረጋገጡ ዝርዝሮች ብቻ ይስተናገዳሉ",
            confirmPayment: "ክፍያውን ያረጋግጡ",
            vipAccess: "ቪ.አይ.ፒ መግቢያ",
            welcomeTo: "እንኳን ወደ",
            partner: "ቱርነር ትርፋማ የኮንስትራክሽን አጋር በደህና መጡ",
            selectMsg: "የፕሪሚየም ክፍያ ዘዴን ስለመረጡ እናመሰግናለን",
            premiumMethod: " ",
            excellenceAwaits: "ምርጥ አገልግሎት ይጠብቅዎታል",
            enterLounge: "ወደ ላውንጅ ይግቡ",
            rechargeSubmitted: "ክፍያዎ ገብቷል",
            underReview: "የፕሪሚየም መሙያ ጥያቄዎ",
            underReviewEnd: "በአሁኑ ጊዜ በመገምገም ላይ ነው።",
            proceedToHome: "ወደ መነሻ ገጽ ተመለስ",
            securedBy: "ግብይቱ በ Turner የተጠበቀ ነው",
            failedLoad: "የክፍያ ዝርዝሮችን መጫን አልተቻለም",
            loginFirst: "እባክዎ መጀመሪያ ይግቡ",
            enterSmsErr: "እባክዎ የክፍያ ቅጽበታዊ ገጽ እይታ ይስቀሉ",
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
                paymentMethod: "premium",
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-44">
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

            {/* Elegant Header */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-amber-500/20">
                <header className="flex items-center justify-between px-6 py-6 max-w-lg mx-auto">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/5 transition-colors text-amber-500">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Crown size={20} className="text-amber-500" />
                        <h1 className="text-lg font-bold tracking-widest text-amber-500 uppercase">{t('premiumPay')}</h1>
                    </div>
                    <div className="w-10" />
                </header>

                {/* Golden Timer */}
                <div className="flex flex-col items-center justify-center pb-8 gap-2">
                    <span className="text-slate-400 text-xs uppercase tracking-widest">{t('timeRemaining')}</span>
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
                    <p className="text-slate-400 text-sm uppercase tracking-wider">{t('totalAmount')}</p>
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                        {t('etb')} {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </section>

                {/* Bank Card Info */}
                <section>
                    <div className="flex items-center gap-3 text-amber-500/80 mb-4">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full"></div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-amber-100">{t('step1')} {t('step1Desc')}</h2>
                    </div>
                    <div className="bg-slate-900/50 backdrop-blur-md border border-amber-500/20 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Crown size={120} className="text-amber-500" />
                        </div>

                        <div className="space-y-4 relative">
                            {/* Bank */}
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <span className="text-slate-400 text-sm">{t('bankInstance')}</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-slate-200">{method?.bankName}</span>
                                    {method?.bankLogoUrl && (
                                        <img src={method.bankLogoUrl} alt="Bank" className="w-6 h-6 object-contain grayscale hover:grayscale-0 transition-all" />
                                    )}
                                </div>
                            </div>

                            {/* Name */}
                            <div className="space-y-1">
                                <span className="text-slate-500 text-xs uppercase">{t('beneficiaryName')}</span>
                                <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5 group hover:border-amber-500/30 transition-colors gap-3">
                                    <span className="font-mono text-slate-200 flex-1">{method?.holderName}</span>
                                    <button
                                        onClick={() => handleCopy(method?.holderName, 'name')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${copiedName
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                                            }`}
                                    >
                                        {copiedName ? t('copied') : t('copy')}
                                    </button>
                                </div>
                            </div>

                            {/* Number */}
                            <div className="space-y-1">
                                <span className="text-slate-500 text-xs uppercase">{t('accountNumber')}</span>
                                <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5 group hover:border-amber-500/30 transition-colors gap-3">
                                    <span className="font-mono text-xl tracking-wider text-amber-500">{method?.accountNumber}</span>
                                    <button
                                        onClick={() => handleCopy(method?.accountNumber, 'account')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${copiedAccount
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                                            }`}
                                    >
                                        {copiedAccount ? t('copied') : t('copy')}
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
                            {t('pasteSMS')}
                        </h2>
                    </div>

                    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-amber-500/50 to-amber-900/10 shadow-2xl overflow-hidden">
                        <div className="bg-slate-900 rounded-2xl p-4 min-h-[160px] flex flex-col items-center justify-center gap-4 relative">
                            {screenshotUrl ? (
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner border border-amber-500/10">
                                    <img src={screenshotUrl} alt="Payment Proof" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <label className="cursor-pointer bg-amber-500 text-slate-950 px-6 py-2 rounded-lg font-black text-[10px] tracking-widest uppercase">
                                            Change Proof
                                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer py-4 group/upload">
                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                    <div className={`w-16 h-16 rounded-full border border-amber-500/20 flex items-center justify-center transition-all ${isUploading ? 'bg-amber-500/10 animate-pulse' : 'bg-white/5 group-hover/upload:bg-amber-500/10'}`}>
                                        {isUploading ? <Loader2 className="animate-spin text-amber-500" /> : <UploadCloud size={32} className="text-amber-500/40 group-hover/upload:text-amber-500" />}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-amber-100 font-medium text-xs tracking-wide">{uploadStatus || t('pastePlaceholder')}</p>
                                        <p className="text-[10px] text-amber-500/30 font-black uppercase mt-1 tracking-widest">{t('secureInput')}</p>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-amber-500/40 text-center uppercase tracking-widest">
                        {t('verifiedDetails')}
                    </p>
                </section>
            </main>

            {/* Action Button */}
            <div className="p-6 bg-slate-950">
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={!screenshotUrl || submitting || isUploading}
                        className={`w-full h-14 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!screenshotUrl || submitting || isUploading
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-lg shadow-amber-900/20 hover:shadow-amber-500/20 active:scale-[0.98]'
                            }`}
                    >
                        {submitting ? <Loader2 className="animate-spin" /> : <span>{t('confirmPayment')}</span>}
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
        setTimeout(() => setShow(false), 500);
    };

    if (!show) return null;

    return (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md transition-opacity duration-500 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-slate-950 border border-amber-500/40 rounded-2xl p-10 max-w-sm w-full shadow-[0_0_100px_rgba(245,158,11,0.15)] space-y-8 text-center transform transition-all duration-500 ${animateOut ? 'scale-90 opacity-0' : 'scale-100 opacity-100'} animate-in zoom-in-95 relative`}>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

                <div className="space-y-4 pt-4">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse"></div>
                        <Crown size={56} className="text-amber-400 relative z-10 fill-amber-500/10" />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-3xl font-serif text-amber-50 tracking-widest">{t('vipAccess')}</h3>
                        <p className="text-amber-500/60 text-sm leading-relaxed font-light px-4">
                            {t('welcomeTo')} <span className="text-amber-200 font-semibold">{t('partner')}</span>.
                            <br /><br />
                            {t('selectMsg')} <span className="text-amber-200 font-semibold">{t('premiumMethod')}</span>.
                            <br /><br />
                            <span className="text-xs uppercase tracking-[0.2em] opacity-80 border-t border-b border-amber-900/50 py-2 inline-block">{t('excellenceAwaits')}</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleDismiss}
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 font-bold h-14 rounded-lg uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12"></div>
                    <span className="relative z-10">{t('enterLounge')}</span>
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
