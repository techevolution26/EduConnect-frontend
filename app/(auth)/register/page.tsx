import Link from "next/link";

import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-ink px-6 py-10 text-fg">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md items-center">
        <section className="w-full overflow-hidden rounded-[2rem] border border-border bg-surface text-fg shadow-2xl backdrop-blur">
          <div className="kanga" />

          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-accent">
              Join the ecosystem
            </p>

            <h1 className="font-display mt-4 font-display text-3xl tracking-tight text-fg">
              Create your account
            </h1>

            <p className="mt-3 text-sm leading-6 text-fg-dim">
              Read, publish, learn, join hubs, and support creators through partnership.
            </p>

            <div className="mt-8">
              <RegisterForm />
            </div>

            <p className="mt-6 text-center text-sm text-fg-dim">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-fg underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}