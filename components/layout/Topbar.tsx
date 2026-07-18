"use client";

import { Bell, LogOut, Menu, Search, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useRef, useState } from "react";

import { MobileSheet } from "@/components/layout/MobileSheet";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { useAuthSession } from "@/hooks/useAuthSession";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthSession();

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

  function handleLogout() {
    logout();
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
    <header className="sticky top-0 z-40 border-b border-border bg-ink/90 backdrop-blur">
      <div className="relative px-4 py-3 lg:px-8">
        <div className="hidden items-center gap-4 md:flex">
          <form
            onSubmit={handleSearch}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5"
          >
            <Search className="h-4 w-4 shrink-0 text-fg-dim" />

            <input
              ref={searchInputRef}
              key={`${pathname}-${initialQuery}`}
              defaultValue={initialQuery}
              placeholder={
                isSearchPage
                  ? "Search again..."
                  : "Search stories, lessons, faith, writers, hubs..."
              }
              className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-dim/70"
            />

            <button
              type="submit"
              className="rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent transition hover:opacity-90"
            >
              Search
            </button>
          </form>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/notifications"
              className="rounded-2xl border border-border bg-surface p-3 text-fg-dim transition hover:bg-surface-2 hover:text-fg"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>

            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2 transition hover:bg-surface-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-sm font-semibold text-fg">
                    {userInitial}
                  </div>

                  <div className="text-right">
                    <p className="max-w-40 truncate text-sm font-medium text-fg">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-fg-dim">{user.role}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-border bg-surface p-3 text-fg-dim transition hover:bg-surface-2 hover:text-fg"
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
                  className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-fg-dim transition hover:bg-surface-2"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:opacity-90"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:hidden">
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-fg">GateWays</p>
            <p className="truncate text-md font-bold text-fg">
              {currentPageLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface text-fg-dim transition hover:bg-surface-2 hover:text-fg"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Link>

            <Link
              href="/notifications"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface text-fg-dim transition hover:bg-surface-2 hover:text-fg"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface text-fg-dim transition hover:bg-surface-2 hover:text-fg"
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
      </div>

      <MobileSheet
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Account"
        description="Quick access and profile actions"
      >
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
          <p className="text-sm text-fg-dim">Appearance</p>
          <ThemeToggle />
        </div>

        {user ? (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-base font-semibold text-fg">
                {userInitial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">
                  {user.full_name}
                </p>
                <p className="text-xs text-fg-dim">{user.role}</p>
              </div>
            </div>

            <nav className="space-y-2">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-fg-dim transition hover:bg-surface-2 hover:text-fg"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>

              <Link
                href="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-fg-dim transition hover:bg-surface-2 hover:text-fg"
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-danger transition hover:bg-danger-soft"
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
              className="block rounded-2xl border border-border bg-surface px-4 py-3 text-center text-fg transition hover:bg-surface-2"
            >
              Login
            </Link>

            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-2xl bg-accent px-4 py-3 text-center font-semibold text-on-accent transition hover:opacity-90"
            >
              Create account
            </Link>
          </div>
        )}
      </MobileSheet>
    </header>
  );
}
