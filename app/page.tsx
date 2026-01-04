"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthForm from "@/components/AuthForm";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/users/welcome");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          <p className="text-zinc-500 font-medium animate-pulse">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 font-sans">
      <main className="flex flex-col items-center justify-center w-full max-w-7xl px-4 py-12">

        {/* Auth Form with Tabs */}
        <div className="w-full max-w-md">
          <AuthForm />
        </div>

      </main>

      <footer className="w-full py-6 text-center text-sm text-zinc-400">
        &copy; {new Date().getFullYear()} Turner Construction. All rights reserved.
      </footer>
    </div>
  );
}
