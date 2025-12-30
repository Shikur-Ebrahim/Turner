"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, AlertCircle, ChevronDown } from "lucide-react";

export default function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        country: "Ethiopia",
        phonePrefix: "+251",
        phoneNumber: "",
        password: "",
    });

    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

    const countries = [
        { name: "Argentina", code: "AR", prefix: "+54", flag: "/Argentina.webp" },
        { name: "Australia", code: "AU", prefix: "+61", flag: "/Australia.webp" },
        { name: "Belarus", code: "BY", prefix: "+375", flag: "/Belarus.jpg" },
        { name: "Belgium", code: "BE", prefix: "+32", flag: "/Belgium.png" },
        { name: "Canada", code: "CA", prefix: "+1", flag: "/Canada.png" },
        { name: "China", code: "CN", prefix: "+86", flag: "/China.png" },
        { name: "Colombia", code: "CO", prefix: "+57", flag: "/Colombia.jpg" },
        { name: "Egypt", code: "EG", prefix: "+20", flag: "/Egypt.png" },
        { name: "Eritrea", code: "ER", prefix: "+291", flag: "/Eritrea.png" },
        { name: "Ethiopia", code: "ET", prefix: "+251", flag: "/Ethiopia.png" },
        { name: "France", code: "FR", prefix: "+33", flag: "/France.png" },
        { name: "Jordan", code: "JO", prefix: "+962", flag: "/Jordan.webp" },
        { name: "Kazakhstan", code: "KZ", prefix: "+7", flag: "/Kazakhstan.png" },
        { name: "Mexico", code: "MX", prefix: "+52", flag: "/Mexico.png" },
        { name: "Morocco", code: "MA", prefix: "+212", flag: "/Morocco.png" },
        { name: "New Zealand", code: "NZ", prefix: "+64", flag: "/Flag_of_New_Zealand.svg.png" },
        { name: "Russia", code: "RU", prefix: "+7", flag: "/Russia.png" },
        { name: "Saudi Arabia", code: "SA", prefix: "+966", flag: "/Saudi Arabia.png" },
        { name: "Senegal", code: "SN", prefix: "+221", flag: "/Senegal.webp" },
        { name: "Singapore", code: "SG", prefix: "+65", flag: "/Singapore.webp" },
        { name: "Spain", code: "ES", prefix: "+34", flag: "/Spain.png" },
        { name: "Taiwan", code: "TW", prefix: "+886", flag: "/Taiwan.png" },
        { name: "United Arab Emirates", code: "AE", prefix: "+971", flag: "/United Arab Emirates.png" },
        { name: "United Kingdom", code: "GB", prefix: "+44", flag: "/United Kingdom.webp" },
        { name: "United States", code: "US", prefix: "+1", flag: "/Flag_of_the_United_States.png" },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === "country") {
            const selectedCountry = countries.find((c) => c.name === value);
            if (selectedCountry) {
                setFormData((prev) => ({ ...prev, country: value, phonePrefix: selectedCountry.prefix }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Construct full phone number
            const fullPhoneNumber = `${formData.phonePrefix}${formData.phoneNumber}`;

            // 2. Generate Email from Phone (Same logic as Registration)
            const sanitizedPhone = fullPhoneNumber.replace(/\+/g, "").replace(/\s/g, "");
            const generatedEmail = `${sanitizedPhone}@turner.app`;

            // 3. Sign in with Generated Email & Password
            await signInWithEmailAndPassword(auth, generatedEmail, formData.password);

            // 4. Redirect to Welcome Page
            router.push("/users");

        } catch (err: any) {
            console.error(err);
            setError("Invalid phone number or password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Top Section - Purple */}
            <div className="pt-12 pb-8 px-8 text-center relative z-10">
                <h2 className="text-4xl font-bold text-white tracking-tight">Log in</h2>
                <p className="text-purple-200 text-sm mt-2">Sign in to your account</p>
            </div>

            {/* Curved White Section */}
            <div className="bg-white rounded-t-[3rem] px-8 pt-10 pb-8 relative">
                {error && (
                    <div className="mb-6 flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Country Dropdown */}
                    <div className="space-y-2 relative">
                        <label className="text-sm font-medium text-gray-600 ml-1">Country</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                className="w-full px-4 py-3.5 rounded-xl border-0 bg-gray-100 flex items-center justify-between hover:bg-gray-150 transition-all text-left"
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
                        <label className="text-sm font-medium text-gray-600 ml-1">Phone Number</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-4 py-3.5 rounded-l-xl bg-gray-100 text-gray-600 font-medium border-r border-gray-200">
                                {formData.phonePrefix}
                            </span>
                            <input
                                type="tel"
                                name="phoneNumber"
                                required
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 rounded-r-xl border-0 bg-gray-100 outline-none transition-all placeholder:text-gray-400 text-gray-700"
                                placeholder="912345678"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600 ml-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3.5 rounded-xl border-0 bg-gray-100 outline-none transition-all placeholder:text-gray-400 text-gray-700"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold shadow-lg hover:from-purple-700 hover:to-purple-800 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
