"use client";

import {
  Bell,
  LogOut,
  Menu,
  Search,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { clearAuthSession, getAccessToken } from "@/lib/auth";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const token = getAccessToken();
  const initialQuery = searchParams.get("q") ?? "";

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
    enabled: Boolean(token),
    retry: false,
  });

  const isSearchPage = pathname.startsWith("/search");

  const currentPageLabel = useMemo(() => {
    const segments = pathname
      .split("/")
      .filter((s) => s && s !== "platform")
      .slice(0, 1);
    if (segments.length === 0) return "Home";
    return segments[0]
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [pathname]);

  const userInitial = useMemo(() => {
    const name = user?.full_name?.trim();
    return name ? name.charAt(0).toUpperCase() : "U";
  }, [user?.full_name]);

  function logout() {
    clearAuthSession();
    queryClient.clear();
    setMobileMenuOpen(false);
    router.push("/login");
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const q = searchInputRef.current?.value.trim() ?? "";

    if (!q) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(q)}`);
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/90 backdrop-blur">
      <div className="relative px-4 py-3 lg:px-8">
        {/* Desktop row */}
        <div className="hidden items-center gap-4 md:flex">
          <form
            onSubmit={handleSearch}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5"
          >
            <Search className="h-4 w-4 shrink-0 text-white/40" />

            <input
              ref={searchInputRef}
              key={`${pathname}-${initialQuery}`}
              defaultValue={initialQuery}
              placeholder={
                isSearchPage
                  ? "Search again..."
                  : "Search stories, lessons, faith, writers, hubs..."
              }
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />

            <button
              type="submit"
              className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
            >
              Search
            </button>
          </form>

          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/notifications"
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
                    {userInitial}
                  </div>

                  <div className="text-right">
                    <p className="max-w-40 truncate text-sm font-medium text-white">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-white/45">{user.role}</p>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/70 transition hover:bg-white/10 hover:text-white"
                  type="button"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:bg-white/10"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-white">EduConnect</p>
            <p className="truncate text-md font-bold text-white">{currentPageLabel}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Link>

            <Link
              href="/notifications"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : user ? (
                <span className="text-sm font-semibold">{userInitial}</span>
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <div
          className={[
            "absolute left-0 right-0 top-full z-50 overflow-hidden border-b border-white/10 bg-[#09090b]/95 shadow-2xl backdrop-blur-xl transition-all duration-300 md:hidden",
            mobileMenuOpen
              ? "max-h-[520px] translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-2 opacity-0",
          ].join(" ")}
        >
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Account</p>
                <p className="text-xs text-white/45">
                  Quick access and profile actions
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {user ? (
              <>
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-base font-semibold text-white">
                    {userInitial}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-white/45">{user.role}</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-red-400 transition hover:bg-red-500/10"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </nav>
              </>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-white transition hover:bg-white/10"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-2xl bg-white px-4 py-3 text-center font-semibold text-black transition hover:bg-white/90"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close menu backdrop"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      ) : null}
    </header>
  );
}