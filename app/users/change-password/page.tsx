"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { ChevronLeft, Lock, Eye, EyeOff, Shield, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ChangePasswordPage() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [language, setLanguage] = useState<"english" | "amharic">("english");

    useEffect(() => {
        const savedLang = localStorage.getItem("appLanguage") as "english" | "amharic";
        if (savedLang && (savedLang === "english" || savedLang === "amharic")) {
            setLanguage(savedLang);
        }
    }, []);

    const translations = {
        english: {
            changePassword: "Change Password",
            securityActive: "Security Active!",
            passwordChangedSuccess: "Password Changed Successfully",
            returningMessage: "Your account is now protected with your new password. Returning to profile in a moment...",
            securityNotice: "Security Notice",
            securityNoticeDesc: "Choose a strong password with at least 6 characters. Never share your password with anyone.",
            currentPassword: "Current Password",
            newPassword: "New Password",
            confirmNewPassword: "Confirm New Password",
            enterCurrentPassword: "Enter current password",
            enterNewPassword: "Enter new password",
            confirmNewPasswordPlaceholder: "Confirm new password",
            passwordRequirements: "Password Requirements:",
            atLeast6Chars: "At least 6 characters",
            passwordsMatch: "Passwords match",
            differentFromCurrent: "Different from current password",
            changingPassword: "Changing Password...",
            changePasswordBtn: "Change Password",
            allFieldsRequired: "All fields are required",
            passwordTooShort: "New password must be at least 6 characters",
            passwordsNoMatch: "New passwords do not match",
            passwordMustDiffer: "New password must be different from current password",
            pleaseLoginFirst: "Please login first",
            currentPasswordIncorrect: "Current password is incorrect",
            passwordTooWeak: "Password is too weak",
            changeFailed: "Failed to change password. Please try again.",
            passwordChangeSuccess: "Password changed successfully!"
        },
        amharic: {
            changePassword: "የይለፍ ቃል ይቀይሩ",
            securityActive: "ደህንነት ንቁ ነው!",
            passwordChangedSuccess: "የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል",
            returningMessage: "መለያዎ አሁን በአዲሱ የይለፍ ቃልዎ የተጠበቀ ነው። በቅርቡ ወደ መገለጫ እንመለሳለን...",
            securityNotice: "የደህንነት ማስታወቂያ",
            securityNoticeDesc: "ቢያንስ 6 ቁምፊዎች ያለው ጠንካራ የይለፍ ቃል ይምረጡ። የይለፍ ቃልዎን ለማንም አያጋሩ።",
            currentPassword: "የአሁኑ የይለፍ ቃል",
            newPassword: "አዲስ የይለፍ ቃል",
            confirmNewPassword: "አዲሱን የይለፍ ቃል ያረጋግጡ",
            enterCurrentPassword: "የአሁኑን የይለፍ ቃል ያስገቡ",
            enterNewPassword: "አዲስ የይለፍ ቃል ያስገቡ",
            confirmNewPasswordPlaceholder: "አዲሱን የይለፍ ቃል ያረጋግጡ",
            passwordRequirements: "የይለፍ ቃል መስፈርቶች:",
            atLeast6Chars: "ቢያንስ 6 ቁምፊዎች",
            passwordsMatch: "የይለፍ ቃሎች ይዛመዳሉ",
            differentFromCurrent: "ከአሁኑ የይለፍ ቃል የተለየ",
            changingPassword: "የይለፍ ቃል በመቀየር ላይ...",
            changePasswordBtn: "የይለፍ ቃል ይቀይሩ",
            allFieldsRequired: "ሁሉም መስኮች ያስፈልጋሉ",
            passwordTooShort: "አዲሱ የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት",
            passwordsNoMatch: "አዲሱ የይለፍ ቃሎች አይዛመዱም",
            passwordMustDiffer: "አዲሱ የይለፍ ቃል ከአሁኑ የይለፍ ቃል የተለየ መሆን አለበት",
            pleaseLoginFirst: "እባክዎ መጀመሪያ ይግቡ",
            currentPasswordIncorrect: "የአሁኑ የይለፍ ቃል የተሳሳተ ነው",
            passwordTooWeak: "የይለፍ ቃሉ በጣም ደካማ ነው",
            changeFailed: "የይለፍ ቃል መቀየር አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
            passwordChangeSuccess: "የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል!"
        }
    };

    const t = (key: keyof typeof translations.english) => {
        return translations[language][key] || translations.english[key];
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                toast.error(t("allFieldsRequired"));
                setLoading(false);
                return;
            }

            if (newPassword.length < 6) {
                toast.error(t("passwordTooShort"));
                setLoading(false);
                return;
            }

            if (newPassword !== confirmPassword) {
                toast.error(t("passwordsNoMatch"));
                setLoading(false);
                return;
            }

            if (currentPassword === newPassword) {
                toast.error(t("passwordMustDiffer"));
                setLoading(false);
                return;
            }

            const user = auth.currentUser;
            if (!user || !user.email) {
                toast.error(t("pleaseLoginFirst"));
                router.push("/");
                return;
            }

            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            // Create notification for password change
            await addDoc(collection(db, "UserNotifications"), {
                userId: user.uid,
                type: "password_change",
                message: "Password changed successfully",
                createdAt: new Date(),
                read: false
            });

            setSuccess(true);
            toast.success(t("passwordChangeSuccess"));

            // Clear form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Redirect to profile after 3 seconds to let them see the success message
            setTimeout(() => {
                router.push("/users/profile");
            }, 3000);

        } catch (error: any) {
            console.error("Password change error:", error);

            if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
                toast.error(t("currentPasswordIncorrect"));
            } else if (error.code === "auth/weak-password") {
                toast.error(t("passwordTooWeak"));
            } else {
                toast.error(t("changeFailed"));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
            {/* Success Overlay */}
            {success && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.2)] border border-blue-50 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

                        {/* Success Icon */}
                        <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
                            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 relative z-10">
                                <Shield className="text-white" size={40} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-md">
                                <CheckCircle2 size={20} className="text-white" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t("securityActive")}</h2>
                            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{t("passwordChangedSuccess")}</p>
                        </div>

                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                            {t("returningMessage")}
                        </p>

                        <div className="pt-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="px-6 py-6 flex items-center gap-4 bg-white border-b border-gray-100">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                    <ChevronLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t("changePassword")}</h1>
            </header>

            <main className="px-6 py-8 pb-32 max-w-md mx-auto">
                {/* Info Card */}
                <div className="mb-8 bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <Shield className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-blue-900 mb-1">{t("securityNotice")}</h3>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                {t("securityNoticeDesc")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Password Change Form */}
                <form onSubmit={handleChangePassword} className="space-y-5">
                    {/* Current Password */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 uppercase tracking-wider pl-2">
                            {t("currentPassword")}
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Lock size={18} className="text-gray-400" />
                            </div>
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder={t("enterCurrentPassword")}
                                className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm font-medium transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 uppercase tracking-wider pl-2">
                            {t("newPassword")}
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Lock size={18} className="text-gray-400" />
                            </div>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder={t("enterNewPassword")}
                                className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm font-medium transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 uppercase tracking-wider pl-2">
                            {t("confirmNewPassword")}
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <Lock size={18} className="text-gray-400" />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t("confirmNewPasswordPlaceholder")}
                                className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm font-medium transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs font-black text-gray-700 mb-2 uppercase tracking-wider">{t("passwordRequirements")}</p>
                        <ul className="space-y-1">
                            <li className={`text-xs flex items-center gap-2 ${newPassword.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                                <CheckCircle2 size={14} />
                                {t("atLeast6Chars")}
                            </li>
                            <li className={`text-xs flex items-center gap-2 ${newPassword && confirmPassword && newPassword === confirmPassword ? 'text-green-600' : 'text-gray-500'}`}>
                                <CheckCircle2 size={14} />
                                {t("passwordsMatch")}
                            </li>
                            <li className={`text-xs flex items-center gap-2 ${newPassword && currentPassword && newPassword !== currentPassword ? 'text-green-600' : 'text-gray-500'}`}>
                                <CheckCircle2 size={14} />
                                {t("differentFromCurrent")}
                            </li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black rounded-2xl uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {t("changingPassword")}
                            </>
                        ) : (
                            <>
                                <Lock size={18} />
                                {t("changePasswordBtn")}
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}
