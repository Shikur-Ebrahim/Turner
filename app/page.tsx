import Image from "next/image";
import AuthForm from "@/components/AuthForm";

export default function Home() {
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
