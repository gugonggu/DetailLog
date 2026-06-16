import { Bookmark, Droplets } from "lucide-react";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { CommunityFeedCard } from "@/features/community/community-feed-card";
import {
  communityFeedSelect,
  mapCommunityFeedRows,
  signCommunityWashLogRows,
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

  const bookmarkedIds = (bookmarkReactions ?? []).map((reaction) => reaction.wash_log_id);

  const { data: washLogData, error: washLogError } =
    bookmarkedIds.length > 0
      ? await supabase
          .from("wash_logs")
          .select(communityFeedSelect)
          .in("id", bookmarkedIds)
          .eq("visibility", "public")
      : { data: [], error: null };

  const signedRows = await signCommunityWashLogRows(
    supabase,
    (washLogData ?? []) as CommunityWashLogRow[],
  );
  const rows = [...signedRows].sort(
    (left, right) => bookmarkedIds.indexOf(left.id) - bookmarkedIds.indexOf(right.id),
  );
  const washLogIds = rows.map((row) => row.id);
  const authorIds = Array.from(new Set(rows.map((row) => row.user_id)));

  const { data: profiles, error: profileError } =
    authorIds.length > 0
      ? await supabase.from("community_profiles").select("id,nickname,avatar_url").in("id", authorIds)
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
    <main className="page-shell">
      <PageHeader
        eyebrow="Bookmarks"
        title="북마크한 세차 기록"
        description="내가 저장한 공개 세차 기록을 모아봅니다. 비공개로 전환된 기록은 목록에서 제외됩니다."
        action={
          <div className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-muted-foreground">
            <Bookmark className="h-4 w-4 text-primary" aria-hidden="true" />
            저장한 공개 기록
          </div>
        }
      />

      {pageError ? (
        <ErrorState
          className="mt-8"
          title="북마크 목록을 불러오지 못했습니다"
          description={pageError.message}
        />
      ) : null}

      {!pageError && feedItems.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Droplets className="h-7 w-7" aria-hidden="true" />}
          title="아직 북마크한 기록이 없습니다"
          description="커뮤니티에서 마음에 드는 공개 세차 기록을 북마크하면 이곳에 표시됩니다."
        />
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
