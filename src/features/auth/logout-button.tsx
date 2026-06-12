"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    const supabase = createBrowserSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={handleLogout}
      disabled={isPending}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      {isPending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
