"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    Home,
    Wallet,
    Ship,
    Users,
    Bell,
    TrendingUp,
    Loader2,
    Shield,
    Package,
    ChevronLeft
} from "lucide-react";

export default function UserProductsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Product State
    const [products, setProducts] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [fetchingProducts, setFetchingProducts] = useState(true);

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    const translations = {
        english: {
            marketplace: "Marketplace",
            investmentPlans: "Investment Plans",
            all: "ALL",
            lev1: "Level 1",
            lev2: "Level 2",
            lev3: "Level 3",
            vip: "VIP",
            loading: "Loading Market...",
            noPlans: "No plans in",
            yet: "yet",
            price: "Price",
            dailyIncome: "Daily Income",
            contractPeriod: "Contract Period",
            days: "DAYS",
            salesTracked: "Sales Tracked",
            buy: "Buy",
            etb: "ETB"
        },
        amharic: {
            marketplace: "የገበያ ቦታ",
            investmentPlans: "የኢንቨስትመንት ዕቅዶች",
            all: "ሁሉም",
            lev1: "ደረጃ 1",
            lev2: "ደረጃ 2",
            lev3: "ደረጃ 3",
            vip: "ቪ.አይ.ፒ",
            loading: "ገበያውን በመጫን ላይ...",
            noPlans: "በዚህ ምድብ ውስጥ ምንም ዕቅዶች የሉም",
            yet: "",
            price: "ዋጋ",
            dailyIncome: "ዕለታዊ ገቢ",
            contractPeriod: "የኮንትራት ጊዜ",
            days: "ቀናት",
            salesTracked: "የተሸጠው መጠን",
            buy: "ግዛ",
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

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/");
                return;
            }
            setUser(currentUser);

            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
            }
        });

        // Fetch Products - Smaller price at the top
        const qProducts = query(collection(db, "Products"), orderBy("price", "asc"));
        const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);
            setFetchingProducts(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeProducts();
        };
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-44 relative">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl z-40 px-6 py-4 flex items-center justify-between border-b border-gray-100/50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/users/welcome")}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 active:scale-90 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t("marketplace")}</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">{t("investmentPlans")}</p>
                    </div>
                </div>
                <div className="w-10 h-10 p-1 rounded-full border border-gray-100 overflow-hidden">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
            </header>

            <main className="pt-24 px-6 space-y-8 pb-10">
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Category Selector */}
                    <div className="grid grid-cols-5 gap-1.5 w-full">
                        {[
                            { id: "ALL", label: "all" },
                            { id: "Level 1", label: "lev1" },
                            { id: "Level 2", label: "lev2" },
                            { id: "Level 3", label: "lev3" },
                            { id: "VIP", label: "vip" }
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all whitespace-nowrap border flex items-center justify-center ${activeCategory === cat.id
                                    ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/20"
                                    : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                                    }`}
                            >
                                {/* @ts-ignore */}
                                {t(cat.label)}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    {fetchingProducts ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("loading")}</p>
                        </div>
                    ) : (products.filter(p => activeCategory === "ALL" || (p.category || "Level 1") === activeCategory).length === 0) ? (
                        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 italic text-gray-400">
                            <Ship size={48} className="mb-4 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">{t("noPlans")} {activeCategory} {t("yet")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 pb-10">
                            {products
                                .filter(p => activeCategory === "ALL" || (p.category || "Level 1") === activeCategory)
                                .map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => router.push(`/users/product/${product.id}`)}
                                        className="group bg-[#0f172a] rounded-[2.5rem] p-6 shadow-2xl shadow-indigo-900/10 border border-white/5 flex flex-col gap-6 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        {/* Glow Effect */}
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[100px] pointer-events-none"></div>

                                        <div className="aspect-[16/8] w-full rounded-[2.2rem] overflow-hidden bg-slate-800 relative shadow-inner">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                    <Package size={48} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{product.name}</h3>
                                                <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg">
                                                    {product.category || "Level 1"}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t("price")}</span>
                                                    <span className="text-xl font-black text-white">{product.price?.toLocaleString()} <span className="text-xs font-bold text-slate-400">{t("etb")}</span></span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t("dailyIncome")}</span>
                                                    <span className="text-xl font-black text-emerald-400">{product.dailyIncome?.toLocaleString()} <span className="text-xs font-bold text-emerald-600/50">{t("etb")}</span></span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t("contractPeriod")}</span>
                                                    <span className="text-xl font-black text-blue-400">{product.contractPeriod} <span className="text-xs font-bold text-blue-600/50">{t("days")}</span></span>
                                                </div>
                                            </div>

                                            {/* Sales Tracking Progress Bar - Enhanced */}
                                            <div className="space-y-3 mt-6">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></span>
                                                        {t("salesTracked")}
                                                    </span>
                                                    <span className="text-base font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                                                        {product.salesTracked || 0}%
                                                    </span>
                                                </div>
                                                <div className="relative">
                                                    {/* Background track with glow */}
                                                    <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm relative">
                                                        {/* Animated gradient fill */}
                                                        <div
                                                            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                                            style={{ width: `${product.salesTracked || 0}%` }}
                                                        >
                                                            {/* Shimmer effect */}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                                        </div>
                                                    </div>
                                                    {/* Glow effect */}
                                                    {(product.salesTracked || 0) > 0 && (
                                                        <div
                                                            className="absolute top-0 left-0 h-3 bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-purple-600/40 rounded-full blur-md transition-all duration-1000 ease-out"
                                                            style={{ width: `${product.salesTracked || 0}%` }}
                                                        ></div>
                                                    )}
                                                </div>
                                            </div>

                                            <button className="w-full py-5 bg-white text-[#0f172a] text-[11px] font-black uppercase tracking-[0.3em] rounded-[1.8rem] shadow-xl shadow-white/5 active:scale-95 transition-all mt-2">
                                                {t("buy")}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </main>

        </div>
    );
}
