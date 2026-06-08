import { Bookmark, Droplets } from "lucide-react";
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

export default async function BookmarksPage() {
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

  const { data: bookmarkReactions, error: bookmarkError } = await supabase
    .from("reactions")
    .select("id,user_id,wash_log_id,type,created_at")
    .eq("user_id", user.id)
    .eq("type", "bookmark")
    .order("created_at", { ascending: false });

  const bookmarkedIds = (bookmarkReactions ?? []).map(
    (reaction) => reaction.wash_log_id,
  );

  const { data: washLogData, error: washLogError } =
    bookmarkedIds.length > 0
      ? await supabase
          .from("wash_logs")
          .select(communityFeedSelect)
          .in("id", bookmarkedIds)
          .eq("visibility", "public")
      : { data: [], error: null };

  const rows = [...((washLogData ?? []) as CommunityWashLogRow[])].sort(
    (left, right) =>
      bookmarkedIds.indexOf(left.id) - bookmarkedIds.indexOf(right.id),
  );
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
  const pageError = bookmarkError ?? washLogError ?? profileError ?? reactionError;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Bookmarks</p>
          <h1 className="mt-3 text-3xl font-bold">북마크한 세차 기록</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            내가 저장한 공개 세차 기록을 모아봅니다. 비공개로 전환된 기록은 목록에서 제외됩니다.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm">
          <Bookmark className="h-4 w-4 text-primary" aria-hidden="true" />
          Saved public logs
        </div>
      </section>

      {pageError ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          북마크 목록을 불러오지 못했습니다. {pageError.message}
        </section>
      ) : null}

      {!pageError && feedItems.length === 0 ? (
        <section className="mt-8 rounded-md border border-border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <Droplets className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">아직 북마크한 기록이 없습니다.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            커뮤니티에서 마음에 드는 공개 세차 기록을 북마크하면 이곳에 표시됩니다.
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
