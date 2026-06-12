import Link from "next/link";
import { redirect } from "next/navigation";

import { AppNavigation } from "@/components/ui/app-navigation";
import { LogoutButton } from "@/features/auth/logout-button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur">
        <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-5 py-3 sm:px-8">
          <Link className="mr-auto text-lg font-black tracking-tight" href="/dashboard">
            Detailog
          </Link>
          <AppNavigation />
          <div className="flex items-center gap-3">
            <span className="hidden max-w-40 truncate text-xs text-muted-foreground xl:inline">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
