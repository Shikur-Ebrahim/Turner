"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    orderBy
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
    ChevronLeft,
    Plus,
    Building2,
    User,
    Hash,
    ShieldCheck,
    Loader2,
    ChevronDown,
    Lock,
    History,
    X,
    CreditCard
} from "lucide-react";
import { toast } from "sonner";

export default function UserBankPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"list" | "connect" | "notification">("list");
    const [linkedBank, setLinkedBank] = useState<any>(null);
    const [availableBanks, setAvailableBanks] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [showBankDropdown, setShowBankDropdown] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        bankName: "",
        holderName: "",
        accountNumber: "",
        bankLogoUrl: ""
    });

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    useEffect(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    }, []);

    const translations = {
        english: {
            myBankAccounts: "My Bank Accounts",
            connectAccount: "Connect Account",
            verifiedAccounts: "Verified Accounts",
            addBank: "Add Bank",
            activeConnection: "Active Connection",
            accountNumber: "Account Number",
            accountType: "Account Type",
            personal: "Personal",
            holderName: "Holder Name",
            status: "Status",
            verified: "Verified",
            linkBankAccount: "Link Bank Account",
            connectDesc: "Connect your bank account securely to enable fast withdrawals.",
            connectNow: "Connect Now",
            alreadyConnected: "Already Connected",
            alreadyConnectedDesc: "This bank name is already connected. If you want to unlink and connect another account, please contact the Turner Team via Telegram.",
            ok: "OK",
            secureLink: "Secure Link",
            encryptedGateway: "Encrypted Banking Gateway",
            selectPartnerBank: "Select Partner Bank",
            chooseBank: "Choose Supported Bank",
            accountHolderName: "Account Holder Name",
            asPerBank: "AS PER BANK RECORDS",
            verifyLink: "Verify & Link",
            bankSecurity: "Bank Grade Security",
            fillAll: "Please fill all fields",
            linkSuccess: "Bank account linked successfully!",
            linkFail: "Failed to link bank account"
        },
        amharic: {
            myBankAccounts: "የባንክ ሂሳቦቼ",
            connectAccount: "ሂሳብ ያገናኙ",
            verifiedAccounts: "የተረጋገጡ ሂሳቦች",
            addBank: "ባንክ ጨምር",
            activeConnection: "ንቁ ግንኙነት",
            accountNumber: "የሂሳብ ቁጥር",
            accountType: "የሂሳብ አይነት",
            personal: "የግል",
            holderName: "የባለቤቱ ስም",
            status: "ሁኔታ",
            verified: "የተረጋገጠ",
            linkBankAccount: "የባንክ ሂሳብ ያገናኙ",
            connectDesc: "ፈጣን ወጪ ለማድረግ የባንክ ሂሳብዎን ደህንነቱ በተጠበቀ ሁኔታ ያገናኙ።",
            connectNow: "አሁን አገናኝ",
            alreadyConnected: "ቀድሞውኑ ተገናኝቷል",
            alreadyConnectedDesc: "ይህ ባንክ ቀድሞውኑ ተገናኝቷል። ይህን ለማቋረጥ እና ሌላ ሂሳብ ለማገናኘት ከፈለጉ እባክዎን የ Turner ቡድንን በቴሌግራም ያግኙ።",
            ok: "እሺ",
            secureLink: "ደህንነቱ የተጠበቀ ግንኙነት",
            encryptedGateway: "የተመሰጠረ የባንክ መግቢያ",
            selectPartnerBank: "አጋር ባንክ ይምረጡ",
            chooseBank: "የሚደገፍ ባንክ ይምረጡ",
            accountHolderName: "የሂሳብ ባለቤቱ ስም",
            asPerBank: "በባንኩ መዛግብት መሰረት",
            verifyLink: "አረጋግጥ እና አገናኝ",
            bankSecurity: "የባንክ ደረጃ ደህንነት",
            fillAll: "እባክዎ ሁሉንም ቦታዎች ይሙሉ።",
            linkSuccess: "የባንክ ሂሳቡ በተሳካ ሁኔታ ተገናኝቷል!",
            linkFail: "የባንክ ሂሳብ ማገናኘት አልተቻለም"
        }
    };

    const t = (key: keyof typeof translations.english) => {
        return translations[language][key] || translations.english[key];
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            // Fetch linked bank
            const bankRef = doc(db, "Bank", currentUser.uid);
            const unsubscribeBank = onSnapshot(bankRef, (doc) => {
                setLinkedBank(doc.exists() ? doc.data() : null);
                setLoading(false);
            });

            // Fetch available withdrawal banks
            const banksQuery = query(collection(db, "withdrawalBanks"), orderBy("createdAt", "desc"));
            const unsubscribeAvailable = onSnapshot(banksQuery, (snapshot) => {
                const banks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAvailableBanks(banks);
            });

            // Fetch user data for phone number
            const userRef = doc(db, "users", currentUser.uid);
            const unsubscribeUser = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setUserData(doc.data());
                }
            });

            return () => {
                unsubscribeBank();
                unsubscribeAvailable();
                unsubscribeUser();
            };
        });

        return () => unsubscribeAuth();
    }, [router]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.bankName || !formData.holderName || !formData.accountNumber) {
            toast.error(t("fillAll"));
            return;
        }

        // Check if bank is already linked logic
        if (linkedBank) {
            setView("notification");
            return;
        }

        setSubmitting(true);
        try {
            await setDoc(doc(db, "Bank", user.uid), {
                ...formData,
                uid: user.uid,
                phoneNumber: userData?.phoneNumber || "",
                status: "verified",
                linkedAt: new Date().toISOString()
            });
            toast.success(t("linkSuccess"));
            setView("list");
        } catch (error) {
            console.error(error);
            toast.error(t("linkFail"));
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-slate-800 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans selection:bg-indigo-100">
            {/* Dynamic Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-100/60 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-blue-100/60 blur-[80px] rounded-full"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.4] mix-blend-multiply"></div>
            </div>

            <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col">
                {/* Header */}
                <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-[#F8F9FB]/80 backdrop-blur-xl z-50">
                    <button
                        onClick={() => view === "connect" ? setView("list") : router.back()}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all text-slate-700 active:scale-95"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    <h1 className="text-lg font-black tracking-wider uppercase text-slate-900">
                        {view === "list" ? t("myBankAccounts") : t("connectAccount")}
                    </h1>
                </header>

                <main className="flex-1 px-6 py-4 pb-44">
                    {view === "list" ? (
                        linkedBank ? (
                            /* Linked State */
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t("verifiedAccounts")} (1)</h3>
                                    <button
                                        onClick={() => setView("connect")}
                                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full"
                                    >
                                        <Plus size={12} /> {t("addBank")}
                                    </button>
                                </div>

                                {/* Premium Bank Card - Light Theme */}
                                <div className="relative group">
                                    <div className="absolute -inset-1.5 bg-gradient-to-br from-slate-200 to-slate-100 rounded-[2.5rem] blur opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative bg-white border border-white/50 rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                                        {/* Abstract Card Texture */}
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-80"></div>

                                        <div className="flex items-start gap-5 mb-8">
                                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-3 shadow-lg shadow-slate-200/50">
                                                {linkedBank.bankLogoUrl ? (
                                                    <img src={linkedBank.bankLogoUrl} className="w-full h-full object-contain" alt="Bank" />
                                                ) : (
                                                    <Building2 className="text-slate-400" size={30} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xl font-black tracking-tight leading-tight text-slate-900 mb-1.5 truncate">{linkedBank.bankName}</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse"></div>
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t("activeConnection")}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-8 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("accountNumber")}</p>
                                                <p className="text-lg font-black tracking-[0.1em] text-slate-800 font-mono">
                                                    {linkedBank.accountNumber}
                                                </p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("accountType")}</p>
                                                <p className="text-sm font-black uppercase tracking-widest text-slate-700">{t("personal")}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("holderName")}</p>
                                                <p className="text-sm font-black uppercase tracking-widest text-slate-800 truncate">{linkedBank.holderName}</p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("status")}</p>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <ShieldCheck size={12} className="text-emerald-500" />
                                                    <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">{t("verified")}</p>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Empty State - Light Theme */
                            <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in zoom-in-95 duration-700">
                                <div className="relative group p-10">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full blur-[40px] opacity-80 group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="relative w-48 h-48 bg-white rounded-[3rem] border border-slate-100 flex items-center justify-center p-8 shadow-[0_20px_50px_-10px_rgba(99,102,241,0.15)] group-hover:shadow-[0_30px_60px_-10px_rgba(99,102,241,0.25)] transition-shadow duration-500">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-indigo-100 rounded-full blur-2xl opacity-40"></div>
                                            <CreditCard size={72} className="text-slate-900 relative z-10 stroke-[1.5]" />
                                            <div className="absolute -bottom-4 -right-4 bg-slate-900 p-3 rounded-2xl border-4 border-white shadow-lg">
                                                <Plus size={20} className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 max-w-xs mx-auto">
                                    <h2 className="text-3xl font-black tracking-tight uppercase text-slate-900">{t("linkBankAccount")}</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{t("connectDesc")}</p>
                                </div>

                                <button
                                    onClick={() => setView("connect")}
                                    className="w-full max-w-xs py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <ShieldCheck size={18} className="text-slate-400" />
                                    {t("connectNow")}
                                </button>
                            </div>
                        )
                    ) : view === "notification" ? (
                        /* Warning Notification State */
                        <div className="h-full flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
                            <div className="p-8 rounded-full bg-red-50 border border-red-100 shadow-[0_10px_30px_-10px_rgba(239,68,68,0.2)]">
                                <ShieldCheck size={48} className="text-red-500" />
                            </div>

                            <div className="space-y-4 max-w-xs mx-auto">
                                <h3 className="text-2xl font-black uppercase text-slate-900 leading-none">{t("alreadyConnected")}</h3>
                                <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                                    {t("alreadyConnectedDesc")}
                                </p>
                            </div>

                            <button
                                onClick={() => router.push("/users/service")}
                                className="w-full max-w-xs py-5 bg-red-500 text-white rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 active:scale-95 transition-all hover:bg-red-600"
                            >
                                {t("ok")}
                            </button>
                        </div>
                    ) : (
                        /* Connect Form State - Light Theme */
                        <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500 max-w-sm mx-auto w-full">
                            <div className="text-center space-y-2 pb-4">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 mb-4 shadow-sm border border-indigo-100">
                                    <Lock size={24} />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">{t("secureLink")}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t("encryptedGateway")}</p>
                            </div>

                            <form onSubmit={handleConnect} className="space-y-6">
                                <div className="space-y-5">
                                    {/* Bank Selector - Custom Dropdown */}
                                    <div className="space-y-2.5 relative">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t("selectPartnerBank")}</label>

                                        <div
                                            onClick={() => setShowBankDropdown(!showBankDropdown)}
                                            className="relative w-full h-[4.5rem] rounded-[2rem] bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-sm cursor-pointer flex items-center px-6 gap-4 group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                                                {formData.bankLogoUrl ? (
                                                    <img src={formData.bankLogoUrl} className="w-full h-full object-contain p-2" alt="Selected" />
                                                ) : (
                                                    <Building2 size={20} />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                {formData.bankName ? (
                                                    <p className="font-black text-sm text-slate-800 uppercase tracking-wider">{formData.bankName}</p>
                                                ) : (
                                                    <p className="font-bold text-sm text-slate-300 uppercase tracking-wider">{t("chooseBank")}</p>
                                                )}
                                            </div>

                                            <ChevronDown className={`text-slate-300 transition-transform duration-300 ${showBankDropdown ? "rotate-180" : ""}`} size={20} />
                                        </div>

                                        {/* Dropdown List */}
                                        {showBankDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-3 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 z-50 max-h-64 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 fade-in duration-200">
                                                {availableBanks.map((bank) => (
                                                    <button
                                                        key={bank.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({
                                                                ...formData,
                                                                bankName: bank.name,
                                                                bankLogoUrl: bank.logoUrl || ""
                                                            });
                                                            setShowBankDropdown(false);
                                                        }}
                                                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-colors">
                                                            {bank.logoUrl ? (
                                                                <img src={bank.logoUrl} className="w-full h-full object-contain" alt={bank.name} />
                                                            ) : (
                                                                <Building2 size={16} className="text-slate-300" />
                                                            )}
                                                        </div>
                                                        <span className={`text-xs font-black uppercase tracking-wider text-left ${formData.bankName === bank.name ? "text-indigo-600" : "text-slate-600"}`}>
                                                            {bank.name}
                                                        </span>
                                                        {formData.bankName === bank.name && (
                                                            <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500"></div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Holder Name */}
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t("accountHolderName")}</label>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-xl text-slate-400 group-focus-within:text-slate-900 group-focus-within:bg-white transition-all shadow-sm">
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                placeholder={t("asPerBank")}
                                                value={formData.holderName}
                                                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                                                className="w-full h-[4.5rem] pl-[4.5rem] pr-6 rounded-[2rem] bg-white border border-slate-100 focus:border-slate-300 focus:ring-4 focus:ring-slate-100 outline-none font-bold text-sm text-slate-800 uppercase tracking-wider placeholder:text-slate-300 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Account Number */}
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{t("accountNumber")}</label>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-xl text-slate-400 group-focus-within:text-slate-900 group-focus-within:bg-white transition-all shadow-sm">
                                                <Hash size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="0000 0000 0000"
                                                value={formData.accountNumber}
                                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                                className="w-full h-[4.5rem] pl-[4.5rem] pr-6 rounded-[2rem] bg-white border border-slate-100 focus:border-slate-300 focus:ring-4 focus:ring-slate-100 outline-none font-bold text-sm text-slate-800 uppercase tracking-wider placeholder:text-slate-300 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full h-[4.5rem] bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-6"
                                >
                                    {submitting ? (
                                        <Loader2 className="animate-spin text-slate-400" size={24} />
                                    ) : (
                                        <>
                                            <span>{t("verifyLink")}</span>
                                            <ShieldCheck size={20} className="text-emerald-400" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </main>

                {/* Footer Security Badge */}
                <footer className="p-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/50 border border-slate-200/50">
                        <Lock size={10} className="text-slate-400" />
                        <span className="text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase">{t("bankSecurity")}</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
