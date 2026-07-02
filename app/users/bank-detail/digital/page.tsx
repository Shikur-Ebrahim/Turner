"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, Copy, Loader2, Zap, Wifi, CheckCircle2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

function DigitalContent() {
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
    const [submitting, setSubmitting] = useState(false);

    const translations = {
        english: {
            systemActive: "System Active",
            step1: "Step 1",
            step1Desc: "Copy account for payment",
            paymentProtocol: "Payment Protocol",
            secure: "Secure",
            targetBank: "Target Bank",
            accountName: "Account Name",
            accountNumber: "Account Number",
            copied: "Copied!",
            copy: "copy",
            processingAmount: "Processing Amount",
            etb: "ETB",
            step2: "Step 2",
            step2Desc: "UPLOAD PAYMENT SCREENSHOT",
            smsPlaceholder: "Waiting for screenshot upload...",
            uploadErr: "Please upload a screenshot of your payment",
            uploading: "Uploading...",
            uploadSuccess: "Success!",
            cursorActive: "_UPLOADER_READY",
            initializing: "Initializing...",
            initializeTransfer: "Initialize Transfer",
            rechargeSubmitted: "Recharge Submitted",
            underReview: "Your digital deposit request for",
            underReviewEnd: "is currently under review.",
            proceedToHome: "Proceed to Home",
            securedBy: "Transaction Secured by Turner",
            systemReady: "SYSTEM READY",
            welcomeToDigital: "Welcome to Digital Turner",
            profitableCompany: "Profitable Construction Company",
            digitalPaymentSelected: "Thank you for selecting the Digital Payment Method",
            gateway: "GATEWAY",
            status: "STATUS",
            online: "ONLINE",
            readyForExecution: "READY FOR EXECUTION...",
            executeProtocol: "[ EXECUTE PROTOCOL ]",
            loginFirst: "Please login first",
            enterSmsErr: "Please upload a payment screenshot",
            failedLoad: "Failed to load",
        },
        amharic: {
            systemActive: "ሲስተም ንቁ ነው",
            step1: "ደረጃ 1",
            step1Desc: "ለክፍያ ሂሳቡን ይቅዱ",
            paymentProtocol: "የክፍያ ፕሮቶኮል",
            secure: "ደህንነቱ የተጠበቀ",
            targetBank: "ተቀባይ ባንክ",
            accountName: "የአካውንት ስም",
            accountNumber: "የአካውንት ቁጥር",
            copied: "ተገልብጧል!",
            copy: "ቅዳ",
            processingAmount: "በሂደት ላይ ያለ መጠን",
            etb: "ብር",
            step2: "ደረጃ 2",
            step2Desc: "የክፍያ ቅጽበታዊ ገጽ እይታ ይስቀሉ (Screen Shot)",
            smsPlaceholder: "የቅጽበታዊ ገጽ እይታ ስቀላን በመጠባበቅ ላይ...",
            uploadErr: "እባክዎ የክፍያዎን ቅጽበታዊ ገጽ እይታ ይስቀሉ",
            uploading: "በመጫን ላይ...",
            uploadSuccess: "ተሳክቷል!",
            cursorActive: "_ለማንሳት_ዝግጁ",
            initializing: "በመጀመር ላይ...",
            initializeTransfer: "ክፍያውን ጀምር",
            rechargeSubmitted: "ክፍያዎ ገብቷል",
            underReview: "የዲጂታል መሙያ ጥያቄዎ",
            underReviewEnd: "በአሁኑ ጊዜ በመገምገም ላይ ነው።",
            proceedToHome: "ወደ መነሻ ገጽ ተመለስ",
            securedBy: "ግብይቱ በ Turner የተጠበቀ ነው",
            systemReady: "ሲስተም ዝግጁ ነው",
            welcomeToDigital: "ወደ Digital Turner እንኳን ደህና መጡ",
            profitableCompany: "ትርፋማ የኮንስትራክሽን ኩባንያ",
            digitalPaymentSelected: "ዲጂታል የክፍያ ዘዴን ስለመረጡ እናመሰግናለን",
            gateway: "ጌትዌይ",
            status: "ሁኔታ",
            online: "ኦንላይን",
            readyForExecution: "ለማስፈጸም ዝግጁ...",
            executeProtocol: "[ ፕሮቶኮሉን አስፈጽም ]",
            loginFirst: "እባክዎ መጀመሪያ ይግቡ",
            enterSmsErr: "እባክዎ የክፍያ ቅጽበታዊ ገጽ እይታ ይስቀሉ",
            failedLoad: "መጫን አልተቻለም",
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

            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userPhone = userDocSnap.exists() ? userDocSnap.data()?.phoneNumber : "";

            await addDoc(collection(db, "RechargeReview"), {
                paymentMethod: "digital",
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

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" /></div>;

    return (
        <div className="min-h-screen bg-black text-cyan-50 font-mono pb-44 selection:bg-cyan-500/30">
            {showSuccessModal && (
                <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="bg-[#1a1a1a] w-full max-sm rounded-[3rem] p-10 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-500 shadow-amber-500/10 text-center">
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
            <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            <header className="relative z-10 flex items-center justify-between px-4 py-6 border-b border-cyan-500/30 bg-black/80 backdrop-blur-sm">
                <button onClick={() => router.back()} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    <ChevronLeft size={28} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                    <span className="text-cyan-500 font-bold tracking-widest uppercase text-sm">{t('systemActive')}</span>
                </div>
                <Wifi size={20} className="text-cyan-500/50" />
            </header>

            <main className="relative z-10 px-6 pt-10 max-w-lg mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-block border border-cyan-500/30 px-6 py-2 rounded-none bg-cyan-950/20 backdrop-blur-md">
                        <span className="text-4xl font-bold text-cyan-400 tracking-[0.2em] font-mono drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                        </span>
                    </div>
                </div>

                <div>
                    <div className="mb-3">
                        <label className="text-xs text-cyan-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                            {t('step1')} {t('step1Desc')}
                        </label>
                    </div>
                    <div className="bg-slate-900 border border-cyan-500/30 p-1 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>

                        <div className="bg-black/50 p-6 space-y-6">
                            <div className="flex justify-between items-center text-xs text-cyan-500/50 uppercase tracking-widest">
                                <span>{t('paymentProtocol')}</span>
                                <span>{t('secure')} // {methodId?.substring(0, 6)}</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-cyan-600 block mb-1">{t('targetBank')}</label>
                                    <div className="flex items-center gap-3 text-lg font-bold text-white">
                                        <div className="w-2 h-full bg-cyan-500/50"></div>
                                        {method?.bankName}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-cyan-600 block mb-1">{t('accountName')}</label>
                                    <div className="flex justify-between items-center bg-cyan-950/30 p-3 border border-cyan-500/20 hover:border-cyan-500/50 transition-colors gap-3">
                                        <span className="text-cyan-100 flex-1">{method?.holderName}</span>
                                        <button
                                            onClick={() => handleCopy(method?.holderName, 'name')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${copiedName
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                                                }`}
                                        >
                                            {copiedName ? t('copied') : t('copy')}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-cyan-600 block mb-1">{t('accountNumber')}</label>
                                    <div className="flex justify-between items-center bg-cyan-950/30 p-3 border border-cyan-500/20 hover:border-cyan-500/50 transition-colors gap-3">
                                        <span className="text-xl tracking-widest text-cyan-400 font-bold">{method?.accountNumber}</span>
                                        <button
                                            onClick={() => handleCopy(method?.accountNumber, 'account')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${copiedAccount
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                                                }`}
                                        >
                                            {copiedAccount ? t('copied') : t('copy')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                    <span className="text-cyan-600 uppercase text-xs">{t('processingAmount')}</span>
                    <span className="text-2xl font-bold text-white">{t('etb')} {Number(amount).toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                    <label className="text-xs text-cyan-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                        {t('step2Desc')}
                    </label>
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative w-full bg-slate-900/90 border border-cyan-500/50 text-cyan-300 p-8 min-h-[160px] flex flex-col items-center justify-center gap-4 transition-all font-mono text-xs rounded-lg overflow-hidden">
                            {screenshotUrl ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-cyan-500/30">
                                    <img src={screenshotUrl} alt="Payment Screenshot" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <label className="cursor-pointer bg-cyan-500 text-black px-4 py-2 rounded-lg font-bold">
                                            Change Image
                                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center gap-4 cursor-pointer">
                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                    {isUploading ? (
                                        <Loader2 size={48} className="animate-spin text-cyan-500" />
                                    ) : (
                                        <UploadCloud size={48} className="text-cyan-500/50" />
                                    )}
                                    <span className="text-cyan-500 font-bold">{uploadStatus || t('smsPlaceholder')}</span>
                                </label>
                            )}
                            <div className="absolute bottom-2 right-2 text-[10px] text-cyan-700 animate-pulse">
                                {t('cursorActive')}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="p-4 bg-black border-t border-cyan-500/30 backdrop-blur-sm">
                <button
                    onClick={handleSubmit}
                    disabled={!screenshotUrl || submitting || isUploading}
                    className={`w-full font-bold h-12 uppercase tracking-widest clip-path-polygon transition-all flex items-center justify-center gap-3 ${!screenshotUrl || submitting || isUploading
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-black hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                        }`}
                >
                    {submitting ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                    {submitting ? t('initializing') : t('initializeTransfer')}
                </button>
            </footer>

            <WelcomeNotification t={t} method={method} />
        </div>
    );
}

function WelcomeNotification({ t, method }: { t: any, method: any }) {
    const [show, setShow] = useState(true);
    const [animateOut, setAnimateOut] = useState(false);

    const handleDismiss = () => {
        setAnimateOut(true);
        setTimeout(() => setShow(false), 200);
    };

    if (!show) return null;

    return (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm transition-opacity duration-200 ${animateOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-black border-2 border-cyan-500 p-1 max-w-sm w-full relative group transform transition-all duration-200 ${animateOut ? 'scale-y-0 opacity-0' : 'scale-100 opacity-100'}`}>
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400"></div>

                <div className="bg-slate-900 p-8 text-center space-y-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(6,182,212,0.05)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan pointer-events-none"></div>

                    <div className="flex justify-center">
                        <div className="relative">
                            <Wifi size={48} className="text-cyan-400 animate-pulse relative z-10" />
                            <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-40 animate-pulse"></div>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <h3 className="text-2xl font-black text-white uppercase tracking-widest glitch-text" data-text={t('systemReady')}>
                            {t('systemReady')}
                        </h3>
                        <div className="h-[1px] w-full bg-cyan-900"></div>
                        <p className="text-cyan-400 text-xs font-mono leading-relaxed tracking-wide">
                            {`> `}{t('welcomeToDigital')}
                            <br />
                            {`> `}{t('profitableCompany')}
                            <br />
                            {`> `}{t('digitalPaymentSelected')}
                            <br />
                            <br />
                            {`> `}{t('gateway')}: <span className="text-white font-bold">{method?.bankDetailType?.toUpperCase() || "DIGITAL"}</span>
                            <br />
                            {`> `}{t('status')}: <span className="text-green-400 animate-pulse">{t('online')}</span>
                            <br />
                            {`> `}{t('readyForExecution')}
                        </p>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="w-full bg-cyan-500 text-black font-black h-14 uppercase tracking-widest text-sm transition-all hover:bg-white hover:shadow-[0_0_30px_rgba(34,211,238,0.8)] active:scale-95 flex items-center justify-center gap-2 group relative z-10 hover:skew-x-[-10deg]"
                    >
                        <span>{t('executeProtocol')}</span>
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
