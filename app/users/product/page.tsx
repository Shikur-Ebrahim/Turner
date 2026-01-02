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

        // Fetch Products - Original sorting
        const qProducts = query(collection(db, "Products"), orderBy("createdAt", "desc"));
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
                        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Marketplace</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Investment Plans</p>
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
                            { id: "ALL", label: "ALL" },
                            { id: "Level 1", label: "Lev 1" },
                            { id: "Level 2", label: "Lev 2" },
                            { id: "Level 3", label: "Lev 3" },
                            { id: "VIP", label: "VIP" }
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all whitespace-nowrap border flex items-center justify-center ${activeCategory === cat.id
                                    ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/20"
                                    : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    {fetchingProducts ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Market...</p>
                        </div>
                    ) : (products.filter(p => activeCategory === "ALL" || (p.category || "Level 1") === activeCategory).length === 0) ? (
                        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 italic text-gray-400">
                            <Ship size={48} className="mb-4 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No plans in {activeCategory} yet</p>
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
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Price</span>
                                                    <span className="text-xl font-black text-white">{product.price?.toLocaleString()} <span className="text-xs font-bold text-slate-400">ETB</span></span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Daily Income</span>
                                                    <span className="text-xl font-black text-emerald-400">{product.dailyIncome?.toLocaleString()} <span className="text-xs font-bold text-emerald-600/50">ETB</span></span>
                                                </div>
                                                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contract Period</span>
                                                    <span className="text-xl font-black text-blue-400">{product.contractPeriod} <span className="text-xs font-bold text-blue-600/50">DAYS</span></span>
                                                </div>
                                            </div>

                                            <button className="w-full py-5 bg-white text-[#0f172a] text-[11px] font-black uppercase tracking-[0.3em] rounded-[1.8rem] shadow-xl shadow-white/5 active:scale-95 transition-all mt-2">
                                                Buy
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
