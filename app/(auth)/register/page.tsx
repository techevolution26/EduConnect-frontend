import Link from "next/link";

import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
    title: "Register",
};

export default function RegisterPage() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#27272a,transparent_35%),#09090b] px-6 py-10 text-white">
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
                <section className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                        Join the ecosystem
                    </p>

                    <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                        Create your account
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-white/60">
                        Read, publish, learn, join hubs, and support creators through
                        partnership.
                    </p>

                    <div className="mt-8">
                        <RegisterForm />
                    </div>

                    <p className="mt-6 text-center text-sm text-white/55">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-white">
                            Sign in
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}