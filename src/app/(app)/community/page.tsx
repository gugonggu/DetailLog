import { Droplets, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { CommunityFilterForm } from "@/features/community/community-filter-form";
import { parseCommunityFilters } from "@/features/community/community-filters";
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
import {
  createWashLogKeywordFilter,
  type SearchParams,
} from "@/features/wash-logs/wash-log-filters";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CommunityPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const filters = parseCommunityFilters(await searchParams);
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

  let feedQuery = supabase
    .from("wash_logs")
    .select(communityFeedSelect)
    .eq("visibility", "public");

  const keywordFilter = createWashLogKeywordFilter(filters.keyword);

  if (keywordFilter) {
    feedQuery = feedQuery.or(keywordFilter);
  }
  if (filters.dirtLevel) {
    feedQuery = feedQuery.eq("dirt_level", filters.dirtLevel);
  }
  if (filters.satisfaction) {
    feedQuery = feedQuery.eq("satisfaction", filters.satisfaction);
  }

  const { data, error } = await feedQuery
    .order("wash_date", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = await signCommunityWashLogRows(supabase, (data ?? []) as CommunityWashLogRow[]);
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
  const pageError = error ?? profileError ?? reactionError;

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Community"
        title="공개 세차 기록"
        description="공개로 설정된 세차 기록을 모아봅니다. 비공개 기록은 커뮤니티에 표시되지 않습니다."
        action={
          <div className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-muted-foreground">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            Public feed
          </div>
        }
      />

      <CommunityFilterForm filters={filters} />

      {pageError ? (
        <ErrorState
          className="mt-8"
          title="커뮤니티 기록을 불러오지 못했습니다"
          description={pageError.message}
        />
      ) : null}

      {!pageError && feedItems.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Droplets className="h-7 w-7" aria-hidden="true" />}
          title={
            filters.hasActiveFilters
              ? "조건에 맞는 공개 세차 기록이 없습니다"
              : "아직 공개된 세차 기록이 없습니다"
          }
          description={
            filters.hasActiveFilters
              ? "필터 조건을 바꾸거나 초기화해서 다시 확인해 보세요."
              : "세차 기록을 공개로 저장하면 커뮤니티에서 다른 사용자가 함께 볼 수 있습니다."
          }
          action={
            filters.hasActiveFilters ? (
              <Link className="secondary-action" href="/community">
                필터 초기화
              </Link>
            ) : undefined
          }
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
