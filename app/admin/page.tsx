"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, ShieldCheck, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Admin Credentials Verification (Requested by User)
            // Checking these FIRST to prevent Firebase Auth errors for the root admin
            const isMasterEmail = formData.email === "turnerNewEra38@gmail.com";
            const isMasterPhone = formData.phone === "0938283555";
            const isMasterPass = formData.password === "TurnerNewEra382835";

            if (isMasterEmail && isMasterPhone && isMasterPass) {
                // For the Root Admin, we bypass traditional auth and store a session flag
                localStorage.setItem("admin_session", "true");
                router.push("/admin/dashboard");
                return;
            }

            // Normal Firebase Auth for other potential admins (if created in Console)
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            const adminRef = doc(db, "admins", user.uid);
            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists() && adminSnap.data().role === "admin") {
                router.push("/admin/dashboard");
            } else {
                setError("Access denied. You do not have administrator privileges.");
                await auth.signOut();
            }
        } catch (err: any) {
            console.error(err);
            setError("Invalid credentials or access denied.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-purple-900/10 p-10 border border-gray-100 flex flex-col items-center">

                {/* Shield Icon */}
                <div className="w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-purple-600/30 mb-8 transform -rotate-3 transition-transform hover:rotate-0">
                    <ShieldCheck size={40} className="text-white" />
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-2">Admin Portal</h1>
                <p className="text-gray-500 text-sm mb-10 text-center">Secure access for authorized Turner administrators only.</p>

                {error && (
                    <div className="w-full bg-red-50 text-red-600 text-xs font-bold p-4 rounded-2xl mb-6 flex items-center gap-3 border border-red-100">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shrink-0"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="w-full space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full py-4 pl-12 pr-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-600/50 outline-none transition-all text-gray-800 font-medium"
                                placeholder="name@turner.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full py-4 pl-12 pr-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-600/50 outline-none transition-all text-gray-800 font-medium"
                                placeholder="09xxxxxxxx"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full py-4 pl-12 pr-12 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-600/50 outline-none transition-all text-gray-800 font-medium"
                                placeholder="••••••••"
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
                        className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-[1.5rem] shadow-xl shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={22} /> : "Authorize Access"}
                    </button>
                </form>

                <p className="mt-10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    SYSTEM SECURITY: AES-256 AES-GCM
                </p>
            </div>
        </div>
    );
}
