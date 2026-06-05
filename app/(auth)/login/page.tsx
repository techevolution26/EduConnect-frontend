import Link from "next/link";

import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
    title: "Login",
};

export default function LoginPage() {
    return (
        <main className="min-h-dvh bg-[#09090b] px-6 py-10 text-white [color-scheme:dark]">
            <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md items-center">
                <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-white shadow-2xl backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                        Welcome back
                    </p>

                    <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                        Sign in
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-white/60">
                        Continue reading, following writers, joining hubs, and managing your
                        partnership.
                    </p>

                    <div className="mt-8">
                        <LoginForm />
                    </div>

                    <p className="mt-6 text-center text-sm text-white/55">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-medium text-white underline-offset-4 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}