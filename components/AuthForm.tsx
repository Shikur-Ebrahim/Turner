"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, Eye, EyeOff, ChevronDown, AlertCircle, Globe } from "lucide-react";
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

    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const languages = [
        { name: "English", label: "English" },
        { name: "Arabic", label: "العربية" },
        { name: "Amharic", label: "አማርኛ" },
        { name: "Oromiffa", label: "Afaan Oromoo" },
        { name: "Tigiriygna", label: "ትግርኛ" },
        { name: "Dobub Sidama", label: "Sidaamu Afoo" }
    ];

    const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;


        // Phone number validation for all countries
        if (name === "phoneNumber") {
            // Remove any non-numeric characters
            const numericValue = value.replace(/\D/g, "");

            // Get validation rules for the selected country
            const rules = phoneValidationRules[formData.country];

            if (!rules) {
                // No specific rules, just allow numeric input
                setFormData((prev) => ({ ...prev, [name]: numericValue }));
                return;
            }

            // Allow empty value
            if (numericValue.length === 0) {
                setFormData((prev) => ({ ...prev, [name]: "" }));
                return;
            }

            // Check if first digit matches allowed starting digits
            if (rules.startsWith && !rules.startsWith.includes(numericValue[0])) {
                // Don't update if first digit is invalid
                return;
            }

            // Determine max length
            const maxLength = Array.isArray(rules.length) ? rules.length[1] : rules.length;

            // Limit to max length
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
            // Validate phone numbers for all countries
            const phoneNumber = formData.phoneNumber.replace(/\D/g, "");
            const rules = phoneValidationRules[formData.country];

            if (rules) {
                // Check length
                if (Array.isArray(rules.length)) {
                    // Range validation
                    if (phoneNumber.length < rules.length[0] || phoneNumber.length > rules.length[1]) {
                        throw new Error(rules.errorMsg);
                    }
                } else {
                    // Exact length validation
                    if (phoneNumber.length !== rules.length) {
                        throw new Error(rules.errorMsg);
                    }
                }

                // Check starting digit
                if (rules.startsWith && !rules.startsWith.includes(phoneNumber[0])) {
                    throw new Error(rules.errorMsg);
                }
            }


            const fullPhoneNumber = `${formData.phonePrefix}${formData.phoneNumber}`;
            const sanitizedPhone = fullPhoneNumber.replace(/\+/g, "").replace(/\s/g, "");
            const generatedEmail = `${sanitizedPhone}@turner.app`;

            if (activeTab === "register") {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, formData.password);
                const user = userCredential.user;

                // Referral Tracking Logic
                let inviterData = {
                    inviterA: "",
                    inviterB: "",
                    inviterC: "",
                    inviterD: ""
                };

                // Try to get ref from URL or LocalStorage
                const searchParams = new URLSearchParams(window.location.search);
                const refParam = searchParams.get("ref");
                let refCode = refParam || localStorage.getItem("turner_ref");

                if (refParam) {
                    localStorage.setItem("turner_ref", refParam);
                }

                if (refCode) {
                    let normalizedRef = refCode.trim();
                    let foundInviter: any = null;

                    // 1. Try Direct UID Lookup (Primary Method)
                    const uidDocSnap = await getDoc(doc(db, "users", normalizedRef));
                    if (uidDocSnap.exists()) {
                        foundInviter = uidDocSnap.data();
                    } else {
                        // 2. Fallback: Phone Number Lookup (Legacy Support)
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
                        inviterData.inviterD = foundInviter.inviterC || "";
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
                    totalIncome: 0,
                    dailyIncome: 0,
                    inviterA: inviterData.inviterA,
                    inviterB: inviterData.inviterB,
                    inviterC: inviterData.inviterC,
                    inviterD: inviterData.inviterD,
                    createdAt: new Date().toISOString(),
                });

                // Update Team Size and Notify Inviters (A-D)
                const levelLabels = ["Level A", "Level B", "Level C", "Level D"];
                const invitersToUpdate = [
                    { uid: inviterData.inviterA, level: "Level A" },
                    { uid: inviterData.inviterB, level: "Level B" },
                    { uid: inviterData.inviterC, level: "Level C" },
                    { uid: inviterData.inviterD, level: "Level D" }
                ].filter(i => i.uid);

                for (const inviter of invitersToUpdate) {
                    const inviterRef = doc(db, "users", inviter.uid);
                    await updateDoc(inviterRef, {
                        teamSize: increment(1)
                    });

                    // Create Registration Notification
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
                await signInWithEmailAndPassword(auth, generatedEmail, formData.password);
                router.push("/users/welcome");
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("This phone number is already registered.");
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
                setError("Invalid phone number or password.");
            } else {
                setError(err.message || "Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Language Selector - Top Right */}
            <div className="absolute top-10 right-4 z-50">
                <div className="relative min-w-[120px]">
                    {!isLanguageDropdownOpen && (
                        <button
                            type="button"
                            onClick={() => setIsLanguageDropdownOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 shadow-sm w-full"
                        >
                            <Globe size={18} className="text-gray-500" />
                            <span>{selectedLanguage.label}</span>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
                    )}

                    {isLanguageDropdownOpen && (
                        <div className="absolute right-0 top-0 w-40 bg-white border border-gray-100 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-200">
                            {/* Active Language / Close Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsLanguageDropdownOpen(false)}
                                className="w-full px-3 py-1.5 border-b border-gray-50 flex items-center gap-2 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors rounded-t-xl"
                            >
                                <Globe size={18} className="text-purple-600" />
                                <span>{selectedLanguage.label}</span>
                                <ChevronDown size={14} className="rotate-180 text-purple-600" />
                            </button>

                            <div className="py-1">
                                {languages.filter(lang => lang.name !== selectedLanguage.name).map((lang) => (
                                    <button
                                        key={lang.name}
                                        type="button"
                                        onClick={() => {
                                            setSelectedLanguage(lang);
                                            setIsLanguageDropdownOpen(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-purple-700 transition-colors"
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Section - White with Logo, Welcome Message and Tabs */}
            <div className="pt-8 pb-4 px-8 text-center relative z-10 bg-white">
                {/* Logo */}
                <div
                    className="flex justify-center -ml-12 mb-4 cursor-pointer"
                    onDoubleClick={() => router.push("/admin")}
                >
                    <div className="w-32 h-32 md:w-40 md:h-40">
                        <img
                            src="/logo.png"
                            alt="Turner Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Welcome Message */}
                <h1 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-900 via-purple-600 to-blue-700 animate-gradient-x text-shadow-sm">
                        Welcome to Turner
                    </span>
                </h1>

                {/* Tabs */}
                <div className="flex justify-center gap-8 mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("register");
                            setError("");
                        }}
                        className={`text-lg font-semibold pb-2 transition-all ${activeTab === "register"
                            ? "text-purple-700 border-b-2 border-purple-700"
                            : "text-gray-400 hover:text-purple-600"
                            }`}
                    >
                        Register
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("login");
                            setError("");
                        }}
                        className={`text-lg font-semibold pb-2 transition-all ${activeTab === "login"
                            ? "text-purple-700 border-b-2 border-purple-700"
                            : "text-gray-400 hover:text-purple-600"
                            }`}
                    >
                        Log in
                    </button>
                </div>
            </div>

            {/* Login Form - Inside Purple Section */}
            {activeTab === "login" && (
                <div className="px-8 pb-12 animate-in fade-in slide-in-from-top-4 duration-300 bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 rounded-t-[3rem]">
                    <h2 className="text-3xl font-bold text-white text-center mb-8">Log in</h2>

                    {error && (
                        <div className="mb-6 flex items-center gap-2 p-3 text-sm text-red-100 bg-red-900/30 border border-red-700/50 rounded-lg">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Country Dropdown */}
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
                                                    <Image
                                                        src={c.flag}
                                                        alt={c.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <span className="text-gray-700 font-medium">{c.name}</span>
                                                <span className="ml-auto text-sm text-gray-400">{c.prefix}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                            <div className="flex">
                                <span className="inline-flex items-center px-4 py-3.5 rounded-l-xl bg-white/90 text-gray-600 font-medium border-r border-gray-200">
                                    {formData.phonePrefix}
                                </span>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3.5 rounded-r-xl border-0 bg-white/90 outline-none transition-all placeholder:text-gray-400 text-gray-700"
                                    placeholder="912345678"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 rounded-xl border-0 bg-white/90 outline-none transition-all placeholder:text-gray-400 text-gray-700"
                                placeholder="Password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-6 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl font-bold shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Log in"}
                        </button>
                    </form>
                </div>
            )}

            {/* Register Form - Enhanced Purple Section with Advanced Design */}
            {activeTab === "register" && (
                <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-t-[3rem] px-8 pt-12 pb-10 relative animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
                    {/* Decorative Elements */}
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
                            {/* Country Dropdown */}
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
                                                        <Image
                                                            src={c.flag}
                                                            alt={c.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <span className="text-gray-800 font-medium group-hover:text-purple-700">{c.name}</span>
                                                    <span className="ml-auto text-sm text-gray-500 font-mono">{c.prefix}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Phone Number */}
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

                            {/* Password Fields */}
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
