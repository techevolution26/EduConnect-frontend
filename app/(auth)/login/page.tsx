import Link from "next/link";

import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
    title: "Login",
};

export default function LoginPage() {
    return (
        <main className="min-h-dvh bg-ink px-6 py-10 text-fg">
            <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md items-center">
                <section className="w-full overflow-hidden rounded-[2rem] border border-border bg-surface text-fg shadow-2xl backdrop-blur">
                    <div className="kanga" />

                    <div className="p-6">
                        <p className="text-xs uppercase tracking-[0.28em] text-accent">
                            Welcome back
                        </p>

                        <h1 className="font-display mt-4 font-display text-3xl tracking-tight text-fg">
                            Sign in
                        </h1>

                        <p className="mt-3 text-sm leading-6 text-fg-dim">
                            Continue reading, following writers, joining hubs, and managing your
                            partnership.
                        </p>

                        <div className="mt-8">
                            <LoginForm />
                        </div>

                        <p className="mt-6 text-center text-sm text-fg-dim">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="font-medium text-fg underline-offset-4 hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}