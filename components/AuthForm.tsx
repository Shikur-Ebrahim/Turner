"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, Eye, EyeOff, ChevronDown, AlertCircle, Send, UserX, ShieldAlert } from "lucide-react";
import { countries, phoneValidationRules } from "@/lib/constants";

export default function AuthForm() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"login" | "register">("register");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
        country: "Ethiopia",
        phonePrefix: "+251",
        phoneNumber: "",
    });

    const [supportLink, setSupportLink] = useState<string | null>(null);
    const [isAccountBlocked, setIsAccountBlocked] = useState(false);

    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === "phoneNumber") {
            // LOGIN MODE: Allow any input (Email or Phone)
            if (activeTab === "login") {
                setFormData((prev) => ({ ...prev, [name]: value }));
                return;
            }

            // REGISTER MODE: Strict Phone Validation
            const numericValue = value.replace(/\D/g, "");
            const rules = phoneValidationRules[formData.country];

            if (!rules) {
                setFormData((prev) => ({ ...prev, [name]: numericValue }));
                return;
            }

            if (numericValue.length === 0) {
                setFormData((prev) => ({ ...prev, [name]: "" }));
                return;
            }

            if (rules.startsWith && !rules.startsWith.includes(numericValue[0])) {
                return;
            }

            const maxLength = Array.isArray(rules.length) ? rules.length[1] : rules.length;

            if (numericValue.length <= maxLength) {
                setFormData((prev) => ({ ...prev, [name]: numericValue }));
            }
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === "country") {
            const selectedCountry = countries.find((c) => c.name === value);
            if (selectedCountry) {
                setFormData((prev) => ({ ...prev, country: value, phonePrefix: selectedCountry.prefix, phoneNumber: "" }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (activeTab === "register") {
                // ... (Keep existing registration logic separate or mostly unchanged, but since we are replacing the whole block, I need to include it or be careful with lines)
                // RE-IMPLEMENTING REGISTER LOGIC TO ENSURE INTEGRITY
                const phoneNumber = formData.phoneNumber.replace(/\D/g, "");
                const rules = phoneValidationRules[formData.country];

                if (rules) {
                    if (Array.isArray(rules.length)) {
                        if (phoneNumber.length < rules.length[0] || phoneNumber.length > rules.length[1]) {
                            throw new Error(rules.errorMsg);
                        }
                    } else {
                        if (phoneNumber.length !== rules.length) {
                            throw new Error(rules.errorMsg);
                        }
                    }

                    if (rules.startsWith && !rules.startsWith.includes(phoneNumber[0])) {
                        throw new Error(rules.errorMsg);
                    }
                }

                const fullPhoneNumber = `${formData.phonePrefix}${formData.phoneNumber}`;
                const sanitizedPhone = fullPhoneNumber.replace(/\+/g, "").replace(/\s/g, "");
                const generatedEmail = `${sanitizedPhone}@turner.app`;

                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, formData.password);
                const user = userCredential.user;

                let inviterData = {
                    inviterA: "",
                    inviterB: "",
                    inviterC: ""
                };

                const searchParams = new URLSearchParams(window.location.search);
                const refParam = searchParams.get("ref");
                let refCode = refParam || localStorage.getItem("turner_ref");

                if (refParam) {
                    localStorage.setItem("turner_ref", refParam);
                }

                if (refCode) {
                    let normalizedRef = refCode.trim();
                    let foundInviter: any = null;

                    const uidDocSnap = await getDoc(doc(db, "users", normalizedRef));
                    if (uidDocSnap.exists()) {
                        foundInviter = uidDocSnap.data();
                    } else {
                        let phoneSearch = normalizedRef;
                        if (/^\d+$/.test(phoneSearch)) {
                            phoneSearch = "+" + phoneSearch;
                        }

                        const q = query(collection(db, "users"), where("phoneNumber", "==", phoneSearch));
                        const querySnapshot = await getDocs(q);
                        if (!querySnapshot.empty) {
                            foundInviter = querySnapshot.docs[0].data();
                        }
                    }

                    if (foundInviter) {
                        inviterData.inviterA = foundInviter.uid;
                        inviterData.inviterB = foundInviter.inviterA || "";
                        inviterData.inviterC = foundInviter.inviterB || "";
                    }
                }

                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: generatedEmail,
                    country: formData.country,
                    phoneNumber: fullPhoneNumber,
                    vip: 0,
                    balance: 0,
                    Recharge: 0,
                    totalRecharge: 0,
                    totalWithdrawal: 0,
                    teamIncome: 0,
                    taskIncome: 0,
                    teamSize: 0,
                    investedTeamSize: 0,
                    teamAssets: 0,
                    totalIncome: 0,
                    dailyIncome: 0,
                    inviterA: inviterData.inviterA,
                    inviterB: inviterData.inviterB,
                    inviterC: inviterData.inviterC,
                    createdAt: new Date().toISOString(),
                });

                const invitersToUpdate = [
                    { uid: inviterData.inviterA, level: "Level A" },
                    { uid: inviterData.inviterB, level: "Level B" },
                    { uid: inviterData.inviterC, level: "Level C" }
                ].filter(i => i.uid);

                for (const inviter of invitersToUpdate) {
                    const inviterRef = doc(db, "users", inviter.uid);
                    await updateDoc(inviterRef, {
                        teamSize: increment(1)
                    });

                    const notifRef = doc(collection(db, "UserNotifications"));
                    await setDoc(notifRef, {
                        userId: inviter.uid,
                        type: "registration",
                        level: inviter.level,
                        message: `New user registered successfully in your ${inviter.level}.`,
                        fromUser: fullPhoneNumber || "A new member",
                        createdAt: Timestamp.now(),
                        read: false
                    });
                }

                setActiveTab("login");
                setFormData({ ...formData, password: "", confirmPassword: "" });

            } else {
                // =============== UNIFIED LOGIN LOGIC ===============
                const input = formData.phoneNumber.trim();
                let userCredential;

                if (input.includes("@")) {
                    // EMAIL LOGIN (ADMIN)
                    userCredential = await signInWithEmailAndPassword(auth, input, formData.password);
                } else {
                    // PHONE LOGIN (USER)
                    const fullPhoneNumber = `${formData.phonePrefix}${input}`;
                    const sanitizedPhone = fullPhoneNumber.replace(/\+/g, "").replace(/\s/g, "");
                    const generatedEmail = `${sanitizedPhone}@turner.app`;

                    userCredential = await signInWithEmailAndPassword(auth, generatedEmail, formData.password);
                }

                const user = userCredential.user;

                // CHECK FOR ADMIN CLAIM
                const idTokenResult = await user.getIdTokenResult(true);
                const isAdmin = !!idTokenResult.claims.admin;

                // LOGIC: Email login MUST be admin OR normal user? Prompt says: "If an email-login user does not have admin claim: Immediately sign them out"
                if (input.includes("@") && !isAdmin) {
                    await auth.signOut();
                    throw new Error("Unauthorized access.");
                }

                if (isAdmin) {
                    // Set a simple cookie for middleware to see (optional but helpful for route protection)
                    document.cookie = "is_admin=true; path=/; max-age=86400; SameSite=Strict";
                    router.push("/admin");
                    return;
                }

                // Normal User Checks
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().isBlocked) {
                    await auth.signOut();
                    const tgSnap = await getDoc(doc(db, "telegram_links", "active"));
                    if (tgSnap.exists()) {
                        setSupportLink(tgSnap.data().teamLink || null);
                    }
                    setIsAccountBlocked(true);
                    setError("Your account has been restricted. Please contact support.");
                    setLoading(false);
                    return;
                }

                document.cookie = "is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"; // Clear admin cookie if normal user
                router.push("/users/welcome");
            }
        } catch (err: any) {
            console.error(err);

            // 1. Network / Connection Errors
            if (err.code === 'auth/network-request-failed' || err.message?.includes('network')) {
                setError("Connection lost. Please check your internet.");
                return;
            }

            // 2. Account Restriction (Custom Logic)
            if (!err.message?.includes("restricted") && !error?.includes("restricted")) {
                setSupportLink(null);
            }

            // 3. Credential Errors (Unified for security)
            if (
                err.code === 'auth/invalid-credential' ||
                err.code === 'auth/user-not-found' ||
                err.code === 'auth/wrong-password' ||
                err.code === 'auth/invalid-email'
            ) {
                setError("Incorrect email or password.");
            }
            // 4. Registration Errors
            else if (err.code === 'auth/email-already-in-use') {
                setError("This phone number is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            }
            // 5. Fallback
            else {
                setError(err.message || "An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative mx-auto">


            <div className="pt-8 pb-4 px-8 text-center relative z-10 bg-white">
                <div
                    className="flex justify-center -ml-12 mb-4"
                >
                    <div className="w-32 h-32 md:w-40 md:h-40">
                        <img src="/logo.png" alt="Turner Logo" className="w-full h-full object-contain" />
                    </div>
                </div>

                <h1 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-900 via-purple-600 to-blue-700 animate-gradient-x text-shadow-sm">
                        Welcome to Turner
                    </span>
                </h1>

                <div className="flex justify-center gap-8 mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("register");
                            setError("");
                            setIsAccountBlocked(false);
                        }}
                        className={`text-lg font-semibold pb-2 transition-all ${activeTab === "register" ? "text-purple-700 border-b-2 border-purple-700" : "text-gray-400 hover:text-purple-600"}`}
                    >
                        Register
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("login");
                            setError("");
                        }}
                        className={`text-lg font-semibold pb-2 transition-all ${activeTab === "login" ? "text-purple-700 border-b-2 border-purple-700" : "text-gray-400 hover:text-purple-600"}`}
                    >
                        Log in
                    </button>
                </div>
            </div>

            {activeTab === "login" && (
                <div className="px-8 pb-12 animate-in fade-in slide-in-from-top-4 duration-300 bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 rounded-t-[3rem]">
                    <h2 className="text-3xl font-bold text-white text-center mb-8 pt-12">Log in</h2>

                    {isAccountBlocked ? (
                        <div className="space-y-8 animate-in zoom-in-95 duration-500 pb-12">
                            <div className="p-[2px] bg-gradient-to-br from-rose-400 via-rose-600 to-rose-400 rounded-[2.5rem] shadow-2xl shadow-rose-500/20">
                                <div className="bg-slate-900 rounded-[2.4rem] p-8 space-y-6 text-center border border-white/5">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 ring-1 ring-rose-500/20">
                                            <ShieldAlert size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]">Account Suspended</p>
                                            <h3 className="text-white font-black text-lg tracking-tight leading-none uppercase">RESTRICTED ACCESS</h3>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <p className="text-rose-200/80 text-[11px] font-medium leading-relaxed">
                                            This account has been flagged for investigation. Please contact the administrator to resolve this restriction.
                                        </p>
                                    </div>

                                    {supportLink && (
                                        <div className="space-y-4">
                                            <div className="flex flex-col items-center">
                                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Official Support</p>
                                                <p className="text-white font-bold text-sm">@{supportLink.replace('@', '')}</p>
                                            </div>

                                            <a
                                                href={supportLink.startsWith('http') ? supportLink : `https://t.me/${supportLink.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.4rem] font-black text-xs uppercase tracking-[0.1em] transition-all shadow-xl shadow-blue-600/20 active:scale-95 group relative overflow-hidden"
                                            >
                                                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                Connect on Telegram
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setIsAccountBlocked(false);
                                    setError("");
                                }}
                                className="w-full py-4 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                Try another account
                            </button>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-6 flex items-center gap-3 p-4 text-sm text-red-100 bg-red-900/30 border border-red-700/50 rounded-2xl">
                                    <AlertCircle size={18} className="flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2 relative">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                            className="w-full px-4 py-3.5 rounded-xl border-0 bg-white/90 flex items-center justify-between hover:bg-white transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                {formData.country && (
                                                    <div className="relative w-6 h-4 rounded overflow-hidden shadow-sm">
                                                        <Image
                                                            src={countries.find(c => c.name === formData.country)?.flag || ""}
                                                            alt={formData.country}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <span className="text-gray-700">{formData.country}</span>
                                            </div>
                                            <ChevronDown size={18} className={`text-gray-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isCountryDropdownOpen && (
                                            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                {countries.map((c) => (
                                                    <button
                                                        key={c.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, country: c.name, phonePrefix: c.prefix }));
                                                            setIsCountryDropdownOpen(false);
                                                        }}
                                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors text-left"
                                                    >
                                                        <div className="relative w-8 h-5 rounded overflow-hidden shadow-sm border border-gray-100">
                                                            <Image src={c.flag} alt={c.name} fill className="object-cover" />
                                                        </div>
                                                        <span className="text-gray-700 font-medium">{c.name}</span>
                                                        <span className="ml-auto text-sm text-gray-400">{c.prefix}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex">
                                        <span className="inline-flex items-center px-4 py-3.5 rounded-l-xl bg-white/90 text-gray-600 font-medium border-r border-gray-200">
                                            {formData.phonePrefix}
                                        </span>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            required
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3.5 rounded-r-xl border-0 bg-white/90 outline-none transition-all placeholder:text-gray-400 text-gray-700"
                                            placeholder="912345678"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            required
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3.5 rounded-xl border-0 bg-white/90 outline-none transition-all placeholder:text-gray-400 text-gray-700 pr-12"
                                            placeholder="Password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 mt-6 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl font-bold shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Log in"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}

            {activeTab === "register" && (
                <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-t-[3rem] px-8 pt-12 pb-10 relative animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl opacity-40"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-3xl opacity-40"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-center mb-2 text-white">Create Account</h2>
                        <p className="text-purple-200 text-center text-sm mb-8">Join us and start your journey</p>

                        {error && (
                            <div className="mb-6 flex items-center gap-3 p-4 text-sm text-red-100 bg-red-900/30 border-l-4 border-red-500 rounded-xl shadow-sm animate-in slide-in-from-top-2 duration-300">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2 relative group">
                                <label className="text-xs font-semibold text-purple-200 ml-1 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1 h-4 bg-gradient-to-b from-white to-purple-200 rounded-full"></span>
                                    Country
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 bg-white flex items-center justify-between hover:border-purple-300 hover:shadow-md transition-all text-left group-hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            {formData.country && (
                                                <div className="relative w-7 h-5 rounded-md overflow-hidden shadow-md ring-2 ring-gray-100">
                                                    <Image
                                                        src={countries.find(c => c.name === formData.country)?.flag || ""}
                                                        alt={formData.country}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <span className="text-gray-800 font-medium">{formData.country}</span>
                                        </div>
                                        <ChevronDown size={20} className={`text-gray-400 group-hover:text-purple-600 transition-all duration-300 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isCountryDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                                            {countries.map((c) => (
                                                <button
                                                    key={c.code}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, country: c.name, phonePrefix: c.prefix }));
                                                        setIsCountryDropdownOpen(false);
                                                    }}
                                                    className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all text-left border-b border-gray-100 last:border-0 group"
                                                >
                                                    <div className="relative w-8 h-5 rounded overflow-hidden shadow-sm border border-gray-200 group-hover:scale-110 transition-transform">
                                                        <Image src={c.flag} alt={c.name} fill className="object-cover" />
                                                    </div>
                                                    <span className="text-gray-800 font-medium group-hover:text-purple-700">{c.name}</span>
                                                    <span className="ml-auto text-sm text-gray-500 font-mono">{c.prefix}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-xs font-semibold text-purple-200 ml-1 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-1 h-4 bg-gradient-to-b from-white to-purple-200 rounded-full"></span>
                                    Phone Number
                                </label>
                                <div className="flex rounded-2xl overflow-hidden border-2 border-gray-200 bg-white hover:border-purple-300 hover:shadow-md transition-all group-hover:bg-gray-50">
                                    <span className="inline-flex items-center px-5 py-4 bg-gradient-to-br from-gray-100 to-gray-50 text-purple-700 font-bold border-r-2 border-gray-200">
                                        {formData.phonePrefix}
                                    </span>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        required
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border-0 bg-transparent outline-none transition-all placeholder:text-gray-400 text-gray-800 font-medium"
                                        placeholder="912345678"
                                    />
                                </div>
                            </div>

                            <div className="space-y-5 pt-2">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-semibold text-purple-200 ml-1 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1 h-4 bg-gradient-to-b from-white to-purple-200 rounded-full"></span>
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            required
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-4 pr-12 rounded-2xl border-2 border-gray-200 bg-white outline-none transition-all placeholder:text-gray-400 text-gray-800 font-medium hover:border-purple-300 hover:shadow-md focus:border-purple-500 focus:ring-4 focus:ring-purple-100 group-hover:bg-gray-50"
                                            placeholder="Create a strong password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors p-1 hover:bg-purple-50 rounded-lg"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-xs font-semibold text-purple-200 ml-1 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1 h-4 bg-gradient-to-b from-white to-purple-200 rounded-full"></span>
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-4 pr-12 rounded-2xl border-2 border-gray-200 bg-white outline-none transition-all placeholder:text-gray-400 text-gray-800 font-medium hover:border-purple-300 hover:shadow-md focus:border-purple-500 focus:ring-4 focus:ring-purple-100 group-hover:bg-gray-50"
                                            placeholder="Confirm your password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors p-1 hover:bg-purple-50 rounded-lg"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 mt-8 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transform hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 relative overflow-hidden group"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={22} />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <span className="relative">Create Account</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
