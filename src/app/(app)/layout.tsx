import Link from "next/link";
import { redirect } from "next/navigation";

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
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link className="text-lg font-bold" href="/dashboard">
            Detailog
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-semibold text-muted-foreground sm:flex">
            <Link className="transition hover:text-foreground" href="/dashboard">
              Dashboard
            </Link>
            <Link className="transition hover:text-foreground" href="/cars">
              Cars
            </Link>
            <Link className="transition hover:text-foreground" href="/wash">
              Wash
            </Link>
            <Link className="transition hover:text-foreground" href="/routine/new">
              Routine
            </Link>
            <Link className="transition hover:text-foreground" href="/community">
              Community
            </Link>
            <Link className="transition hover:text-foreground" href="/bookmarks">
              Bookmarks
            </Link>
            <Link className="transition hover:text-foreground" href="/profile">
              Profile
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
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
