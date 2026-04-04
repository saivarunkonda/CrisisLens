import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      }}
    >
      {children}
      <Analytics />
      <SpeedInsights />
    </AppShell>
  );
}
