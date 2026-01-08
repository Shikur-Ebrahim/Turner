"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // Force refresh token to get latest claims
                    const idTokenResult = await user.getIdTokenResult(true);

                    if (idTokenResult.claims.admin) {
                        setIsAuthorized(true);
                    } else {
                        console.warn("⚠️ Unauthorized access attempt to Admin Area.");
                        router.push("/"); // Kick back to login
                    }
                } else {
                    router.push("/"); // No user, kick back
                }
            } catch (error) {
                console.error("Admin Auth Check Error:", error);
                router.push("/");
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-purple-600" size={32} />
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Verifying Privileges...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Don't render anything if not authorized (will redirect)
    }

    return (
        <div className="admin-layout">
            {children}
        </div>
    );
}
