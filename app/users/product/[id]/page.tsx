"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    getDoc,
    runTransaction,
    collection,
    serverTimestamp,
    increment,
    setDoc,
    query,
    where,
    getDocs,
    Timestamp
} from "firebase/firestore";
import {
    ChevronLeft,
    Clock,
    TrendingUp,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Zap,
    Anchor,
    Award,
    X
} from "lucide-react";

export default function UserProductDetailPage() {
    const router = useRouter();
    const { id } = useParams();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isBuying, setIsBuying] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [language, setLanguage] = useState<"english" | "amharic">("english");

    const translations = {
        english: {
            loadingSync: "Syncing Secure Node...",
            planDecoupled: "Plan Decoupled",
            reconnect: "Reconnect Market",
            nodeError: "The requested investment node could not be retrieved from the mainnet.",
            premiumInfra: "Premium Infrastructure",
            productPrice: "Product Price",
            dailyRate: "Daily Rate",
            dailyIncome: "Daily Income",
            contractPeriod: "Contract Period",
            totalProfit: "Total Profit",
            principalIncome: "Principal+Income",
            totalWithdrawal: "Total Withdrawal",
            buyPrincipal: "Buy Principal",
            productIncome: "Product Income",
            details: "Details",
            detailsDesc1: "Details: This product is designed as a stable and high-yield investment opportunity, offering reliable daily income throughout the contract period. Investors can withdraw their daily earnings at any time and receive their full principal together with accumulated profit upon completion of the contract cycle.",
            detailsDesc2: "【Product Information】 Price:",
            purchaseLimit: "Purchase quantity limit",
            times: "times",
            buy: "BUY",
            confirm: "CONFIRM",
            confirmOrder: "Confirm Order",
            systemAlert: "System Alert",
            insufficientFunds: "Insufficient balance! Please recharge. 💳",
            congrats: "Congratulations!",
            partnerMsg: "Now you are a partner of",
            turner: "Turner Construction Company",
            inviteMsg: "Invite users and get more rewards!",
            ok: "OK",
            transactionFailed: "Transaction Failed",
            limitReached: "Limit reached",
            itemsMax: "items max",
            operationSecured: "Operation secured by Turner Construction End-to-End Encryption",
            br: "Br",
            etb: "ETB",
            day: "Day",
            days: "Days"
        },
        amharic: {
            loadingSync: "ደህንነቱ የተጠበቀ ኖድ በማመሳሰል ላይ...",
            planDecoupled: "ዕቅድ ተቋርጧል",
            reconnect: "ገበያውን እንደገና ያገናኙ",
            nodeError: "የተጠየቀው የኢንቨስትመንት ኖድ ከዋናው አውታረ መረብ ማግኘት አልተቻለም።",
            premiumInfra: "ፕሪሚየም መሠረተ ልማት",
            productPrice: "የምርት ዋጋ",
            dailyRate: "ዕለታዊ ተመን",
            dailyIncome: "ዕለታዊ ገቢ",
            contractPeriod: "የኮንትራት ጊዜ",
            totalProfit: "ጠቅላላ ትርፍ",
            principalIncome: "ዋና ገንዘብ + ገቢ",
            totalWithdrawal: "ጠቅላላ ወጪ",
            buyPrincipal: "የግዢ ዋጋ",
            productIncome: "የምርት ገቢ",
            details: "ዝርዝሮች",
            detailsDesc1: "ዝርዝሮች፡ ይህ ምርት የተረጋጋ እና ከፍተኛ ትርፍ የሚያስገኝ የኢንቨስትመንት ዕድል ሆኖ የተነደፈ ሲሆን በኮንትራቱ ጊዜ ውስጥ አስተማማኝ የቀን ገቢ ይሰጣል። ባለሀብቶች የቀን ገቢያቸውን በማንኛውም ጊዜ ማውጣት የሚችሉ ሲሆን ከኮንትራቱ ማብቂያ በኋላ ዋና ገንዘባቸውን ከተጠራቀመ ትርፍ ጋር ይቀበላሉ።",
            detailsDesc2: "【የምርት መረጃ】 ዋጋ፡",
            purchaseLimit: "የግዢ መጠን ገደብ",
            times: "ጊዜ",
            buy: "ግዛ",
            confirm: "አረጋግጥ",
            confirmOrder: "ትዕዛዝ ያረጋግጡ",
            systemAlert: "የስርዓት ማስጠንቀቂያ",
            insufficientFunds: "በቂ ያልሆነ ቀሪ ሂሳብ! እባክዎ ይሙሉ 💳",
            congrats: "እንኳን ደስ አለዎት!",
            partnerMsg: "አሁን እርስዎ የሚከተለው አጋር ነዎት",
            turner: "ተርነር ኮንስትራክሽን ኩባንያ",
            inviteMsg: "ተጠቃሚዎችን ይጋብዙ እና ተጨማሪ ሽልማቶችን ያግኙ!",
            ok: "እሺ",
            transactionFailed: "ግብይቱ አልተሳካም",
            limitReached: "ገደቡ ላይ ደርሷል",
            itemsMax: "ንጥሎች ቢበዛ",
            operationSecured: "ክዋኔው በ Turner Construction End-to-End Encryption የተጠበቀ ነው",
            br: "ብር",
            etb: "ብር",
            day: "ቀን",
            days: "ቀናት"
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
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) setUserId(user.uid);
            else setUserId(null);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, "Products", id as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handlePurchase = async () => {
        if (!userId) {
            router.push("/");
            return;
        }

        if (isBuying) return;
        setIsBuying(true);
        setStatusMsg(null);

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Get User Data
                const userRef = doc(db, "users", userId);
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw new Error("User profile error");

                const userData = userSnap.data();
                // Use "Recharge" field as requested by the user
                const rechargeBalance = Number(userData.Recharge || 0);

                // 2. Validate Funds
                if (rechargeBalance < product.price) {
                    throw new Error("INSUFFICIENT_FUNDS");
                }

                // 3. Purchase Limit Check
                const ordersRef = collection(db, "UserOrders");
                const q = query(ordersRef, where("userId", "==", userId), where("productId", "==", product.id));
                const existingOrdersSnap = await getDocs(q);
                if (existingOrdersSnap.size >= (product.purchaseLimit || 1)) {
                    throw new Error("PURCHASE_LIMIT_REACHED");
                }

                // 4. Record Investment
                const orderRef = doc(collection(db, "UserOrders"));
                transaction.set(orderRef, {
                    userId,
                    productId: product.id,
                    productName: product.name,
                    price: product.price,
                    dailyIncome: product.dailyIncome,
                    contractPeriod: product.contractPeriod,
                    remainingDays: product.contractPeriod,
                    totalProfit: product.totalProfit,
                    principalIncome: product.principalIncome,
                    status: "active",
                    purchaseDate: serverTimestamp(),
                    lastSync: serverTimestamp()
                });

                // 5. Deduct Balance from "Recharge" field and Update Daily Income Rate
                transaction.update(userRef, {
                    Recharge: rechargeBalance - product.price,
                    dailyIncome: increment(product.dailyIncome)
                });
            });

            setStatusMsg({ type: "success", text: "SUCCESS_PARTNER" });
            // Automatic timeout removed - will use manual "OK" button
        } catch (error: any) {
            // Only log unexpected system errors; operational errors like "INSUFFICIENT_FUNDS" are handled silently.
            if (!["INSUFFICIENT_FUNDS", "PURCHASE_LIMIT_REACHED", "User profile error"].includes(error.message)) {
                console.error("System Purchase error:", error);
            }
            if (error.message === "INSUFFICIENT_FUNDS") {
                setStatusMsg({ type: "error", text: "INSUFFICIENT_FUNDS_SPECIAL" });

                try {
                    const rechargeReviewRef = collection(db, "RechargeReview");
                    const q = query(
                        rechargeReviewRef,
                        where("userId", "==", userId),
                        where("status", "==", "Under Review")
                    );
                    const snap = await getDocs(q);
                    const targetPath = !snap.empty
                        ? "/users/transaction-pending"
                        : `/users/recharge?amount=${product.price}`;
                    setTimeout(() => router.push(targetPath), 3000);
                } catch (queryError) {
                    console.error("Redirection query failed:", queryError);
                    setTimeout(() => router.push(`/users/recharge?amount=${product.price}`), 3000);
                }
                return;
            }

            let msg = t("transactionFailed");
            if (error.message === "PURCHASE_LIMIT_REACHED") msg = `${t("limitReached")}: ${product.purchaseLimit} ${t("itemsMax")}.`;
            setStatusMsg({ type: "error", text: msg });
        } finally {
            setIsBuying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-indigo-600/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">{t("loadingSync")}</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle size={64} className="text-slate-200 mb-6" />
                <h1 className="text-2xl font-black text-slate-900 mb-2">{t("planDecoupled")}</h1>
                <p className="text-slate-500 max-w-xs mb-8">{t("nodeError")}</p>
                <button
                    onClick={() => router.back()}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                >
                    {t("reconnect")}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-44">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 active:scale-90 transition-transform"
                >
                    <ChevronLeft size={24} strokeWidth={3} />
                </button>
                <h1 className="text-xl font-black tracking-tight flex-1 truncate">{product.name}</h1>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Zap size={20} strokeWidth={2.5} />
                </div>
            </header>

            <main className="pt-28 px-6 max-w-xl mx-auto space-y-10">
                {/* Hero Card */}
                <div className="relative group">
                    <div className="aspect-[16/10] rounded-[3rem] overflow-hidden bg-slate-100 shadow-2xl shadow-indigo-600/10 border border-slate-200">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                <Award size={64} strokeWidth={1} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t("premiumInfra")}</span>
                            </div>
                        )}

                        {/* Overlay Badge */}
                        <div className="absolute top-6 left-6">
                            <div className="px-5 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl">
                                {product.category || "Active Node"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unified Metrics Block */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 space-y-8">
                    {/* Row 1: Primary Metrics */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t("productPrice")}</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{product.price?.toLocaleString()} <span className="text-sm font-bold opacity-40">{t("br")}</span></p>
                        </div>
                        <div className="space-y-1.5 border-x border-slate-100 px-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t("dailyRate")}</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{product.dailyRate}%</p>
                        </div>
                        <div className="space-y-1.5 text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t("dailyIncome")}</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{product.dailyIncome?.toLocaleString()} <span className="text-sm font-bold opacity-40">{t("br")}</span></p>
                        </div>
                    </div>

                    <div className="h-px bg-slate-50"></div>

                    {/* Row 2: Financial Forecast */}
                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t("contractPeriod")}</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{product.contractPeriod} <span className="text-sm font-bold opacity-40">{t("day")}</span></p>
                        </div>
                        <div className="space-y-1.5 border-x border-slate-100 px-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t("totalProfit")}</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{product.totalProfit?.toLocaleString()} <span className="text-sm font-bold opacity-40">{t("br")}</span></p>
                        </div>
                        <div className="space-y-1.5 text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{t("principalIncome")}</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{product.principalIncome?.toLocaleString()} <span className="text-sm font-bold opacity-40">{t("br")}</span></p>
                        </div>
                    </div>
                </div>

                {/* Total Withdrawal Summary (New) */}
                <div className="bg-white rounded-[2rem] p-8 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.05)] border border-slate-100">
                    <p className="text-slate-600 text-sm font-bold leading-relaxed">
                        {t("totalWithdrawal")}: {t("buyPrincipal")} {product.price?.toLocaleString()} + {t("productIncome")} {product.totalProfit?.toLocaleString()} = <span className="text-indigo-600 font-black text-xl">{product.principalIncome?.toLocaleString()} {t("br")}.</span>
                    </p>
                </div>

                {/* Details Section */}
                <div className="space-y-6 pt-4">
                    <div className="relative inline-block">
                        <h2 className="text-2xl font-black text-slate-900">{t("details")}:</h2>
                        <div className="absolute -bottom-1.5 left-0 w-full h-1 bg-indigo-600/20 rounded-full"></div>
                    </div>

                    <div className="text-slate-500 text-[13px] leading-relaxed space-y-4 font-medium">
                        <p>
                            {t("detailsDesc1")}
                        </p>

                        <p>
                            {t("detailsDesc2")} {product.price?.toLocaleString()} {t("etb")} {t("dailyIncome")}: {product.dailyIncome?.toLocaleString()} {t("etb")} {t("contractPeriod")}: {product.contractPeriod} {t("days")} {t("dailyRate")}: {product.dailyRate}% {t("totalProfit")}: {product.totalProfit?.toLocaleString()} {t("etb")} {t("totalWithdrawal")}: {t("buyPrincipal")}: {product.price?.toLocaleString()} {t("etb")} {t("productIncome")}: {product.totalProfit?.toLocaleString()} {t("etb")} Total: {product.principalIncome?.toLocaleString()} {t("etb")} {t("purchaseLimit")}: {t("itemsMax")}
                        </p>
                    </div>
                </div>

                {/* Purchase Quantity Limit Footer (Moved below Details) */}
                <div className="bg-slate-50/50 rounded-3xl p-6 flex items-center justify-between border border-slate-100">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{t("purchaseLimit")}</span>
                    <div className="px-5 py-2.5 bg-white border border-blue-100 text-blue-600 text-sm font-black rounded-xl shadow-sm">
                        {product.purchaseLimit || 1} {t("times")}
                    </div>
                </div>
            </main>

            {/* Bottom Interaction Area */}
            <div className="p-6 bg-white border-t border-slate-100">
                <div className="max-w-xl mx-auto">

                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={isBuying}
                        className={`w-full py-5 rounded-[2rem] font-black text-lg tracking-[0.1em] uppercase shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 ${isBuying
                            ? "bg-slate-200 text-slate-400 shadow-none cursor-wait"
                            : "bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-600/40"
                            }`}
                    >
                        {isBuying ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>
                                <Zap size={22} fill="currentColor" />
                                {t("buy")}
                            </>
                        )}
                    </button>
                    <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest mt-4">
                        {t("operationSecured")}
                    </p>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setShowConfirmModal(false)}
                    ></div>

                    <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl p-8 space-y-8 animate-in slide-in-from-bottom-10 duration-500 overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900">{t("confirmOrder")}</h2>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Middle Section: Either Summary or Status Message */}
                        <div className="flex-1 min-h-[300px] flex flex-col justify-center">
                            {statusMsg ? (
                                <div className="animate-in fade-in zoom-in-95 duration-500">
                                    {statusMsg.text === "INSUFFICIENT_FUNDS_SPECIAL" ? (
                                        <div className="bg-[#fe395d] rounded-[2rem] p-6 flex flex-col gap-4 shadow-xl shadow-rose-500/10 border border-rose-400/20">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                                                    <X className="text-white" size={24} strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-80">{t("systemAlert")}</h3>
                                                    <p className="text-white text-sm font-bold leading-tight">
                                                        {t("insufficientFunds")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-white w-full animate-progress-shrink origin-left"></div>
                                            </div>
                                        </div>
                                    ) : statusMsg.text === "SUCCESS_PARTNER" ? (
                                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl shadow-indigo-600/30 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                            <div className="relative z-10 flex flex-col items-center">
                                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                                    <Award className="text-white" size={32} strokeWidth={2.5} />
                                                </div>
                                                <h3 className="text-white text-lg font-black uppercase tracking-tight mb-2">{t("congrats")}</h3>
                                                <p className="text-indigo-50 text-xs font-bold leading-relaxed">
                                                    {t("partnerMsg")} <span className="text-white font-black">{t("turner")}</span>.
                                                </p>
                                                <div className="mt-6 pt-5 border-t border-white/10 w-full flex flex-col items-center gap-6">
                                                    <p className="text-indigo-200 text-[9px] font-black uppercase tracking-[0.2em]">{t("inviteMsg")}</p>

                                                    <button
                                                        onClick={() => router.push("/users/welcome")}
                                                        className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:bg-indigo-50 active:scale-95 transition-all"
                                                    >
                                                        {t("ok")}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`p-5 rounded-[1.5rem] flex items-center gap-3 font-bold text-sm ${statusMsg.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                                            }`}>
                                            {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                            {statusMsg.text}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    {/* Order Summary Grid */}
                                    <div className="space-y-4">
                                        {[
                                            { label: "PRODUCT NAME", value: product.name, bold: true },
                                            { label: "PRODUCT PRICE", value: `${product.price?.toLocaleString()} ${t("br")}`, bold: true },
                                            { label: "DAILY INCOME", value: `${product.dailyIncome?.toLocaleString()} ${t("br")}`, color: "text-emerald-500" },
                                            { label: "CONTRACT PERIOD", value: `${product.contractPeriod} ${t("day")}` },
                                            { label: "TOTAL PROFIT", value: `${product.totalProfit?.toLocaleString()} ${t("br")}`, bold: true },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-[11px]">
                                                {/* @ts-ignore */}
                                                <span className="font-black text-slate-400 uppercase tracking-wider">{t(item.label) || item.label}</span>
                                                <span className={`font-black ${item.color || "text-slate-900"} ${item.bold ? "text-sm" : ""}`}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="h-px bg-slate-100"></div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="font-black text-slate-400 uppercase tracking-wider">DISCOUNT</span>
                                            <span className="font-black text-slate-900">-0.00 {t("br")}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-black text-slate-900">Pay Amount</span>
                                            <span className="text-xl font-black text-indigo-600">{product.price?.toLocaleString()} {t("br")}</span>
                                        </div>

                                        <p className="text-blue-500 text-[11px] font-bold">
                                            The upper limit is {product.purchaseLimit || 1} times
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Area */}
                        {!statusMsg && (
                            <button
                                onClick={handlePurchase}
                                disabled={isBuying}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-lg uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isBuying ? <Loader2 className="animate-spin" size={24} /> : t("confirm")}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Add local animation for progress bar
const style = `
@keyframes progress-shrink {
    0% { transform: scaleX(1); }
    100% { transform: scaleX(0); }
}
.animate-progress-shrink {
    animation: progress-shrink 3s linear forwards;
}
`;

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = style;
    document.head.appendChild(styleSheet);
}
