import AuthGuard from "@/components/auth/AuthGuard";
import AppShell from "@/components/layout/AppShell";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}