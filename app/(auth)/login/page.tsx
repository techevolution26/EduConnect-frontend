// login server component

import Link from "next/link";

import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
    title: "Login",
};

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#27272a,transparent_35%),#09090b] px-6 py-10 text-white">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
                <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                        Welcome back
                    </p>
                    <LoginForm />
                    <p className="mt-6 text-center text-sm text-white/55">
                        Don't have an account?{" "}
                        <Link href="/register" className="font-medium text-white">
                            Sign up
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}