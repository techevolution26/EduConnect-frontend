import ConditionalAuthGuard from "@/components/auth/ConditionalAuthGuard";
import AppShell from "@/components/layout/AppShell";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConditionalAuthGuard>
      <AppShell>{children}</AppShell>
    </ConditionalAuthGuard>
  );
}