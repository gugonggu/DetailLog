import { Droplets, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { CommunityFeedCard } from "@/features/community/community-feed-card";
import {
  communityFeedSelect,
  mapCommunityFeedRows,
} from "@/features/community/community-service";
import type {
  CommunityProfileRow,
  CommunityReactionRow,
  CommunityWashLogRow,
} from "@/features/community/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function CommunityPage() {
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

  const { data, error } = await supabase
    .from("wash_logs")
    .select(communityFeedSelect)
    .eq("visibility", "public")
    .order("wash_date", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as CommunityWashLogRow[];
  const washLogIds = rows.map((row) => row.id);
  const authorIds = Array.from(new Set(rows.map((row) => row.user_id)));

  const { data: profiles, error: profileError } =
    authorIds.length > 0
      ? await supabase.from("profiles").select("id,nickname").in("id", authorIds)
      : { data: [], error: null };

  const { data: reactions, error: reactionError } =
    washLogIds.length > 0
      ? await supabase
          .from("reactions")
          .select("id,user_id,wash_log_id,type,created_at")
          .in("wash_log_id", washLogIds)
      : { data: [], error: null };

  const feedItems = mapCommunityFeedRows(
    rows,
    (profiles ?? []) as CommunityProfileRow[],
    (reactions ?? []) as CommunityReactionRow[],
    user.id,
  );
  const pageError = error ?? profileError ?? reactionError;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Community</p>
          <h1 className="mt-3 text-3xl font-bold">공개 세차 기록</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            공개로 설정된 세차 기록만 모아봅니다. 비공개 기록은 커뮤니티에 표시되지 않습니다.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm">
          <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          Public feed
        </div>
      </section>

      {pageError ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          커뮤니티 기록을 불러오지 못했습니다. {pageError.message}
        </section>
      ) : null}

      {!pageError && feedItems.length === 0 ? (
        <section className="mt-8 rounded-md border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <Droplets className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">아직 공개된 세차 기록이 없습니다.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            세차 기록을 공개로 저장하면 이곳에서 다른 사용자가 함께 볼 수 있습니다.
          </p>
        </section>
      ) : null}

      {!pageError && feedItems.length > 0 ? (
        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {feedItems.map((item) => (
            <CommunityFeedCard item={item} currentUserId={user.id} key={item.id} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
