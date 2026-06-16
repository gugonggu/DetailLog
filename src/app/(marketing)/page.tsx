import { LandingPage } from "@/features/landing/landing-page";
import {
  communityFeedSelect,
  mapLandingPreviewRows,
  signCommunityWashLogRows,
} from "@/features/community/community-service";
import type {
  CommunityProfileRow,
  CommunityWashLogRow,
} from "@/features/community/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return <LandingPage previewItems={[]} isAuthenticated={false} />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("wash_logs")
    .select(communityFeedSelect)
    .eq("visibility", "public")
    .order("wash_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  const rows = await signCommunityWashLogRows(supabase, (data ?? []) as CommunityWashLogRow[]);
  const authorIds = Array.from(new Set(rows.map((row) => row.user_id)));

  const { data: profiles, error: profileError } =
    authorIds.length > 0
      ? await supabase
          .from("community_profiles")
          .select("id,nickname,avatar_url")
          .in("id", authorIds)
      : { data: [], error: null };

  const previewItems = mapLandingPreviewRows(
    rows,
    (profiles ?? []) as CommunityProfileRow[],
  );
  const previewError = error?.message ?? profileError?.message ?? "";

  return (
    <LandingPage
      previewItems={previewItems}
      previewError={previewError}
      isAuthenticated={Boolean(user)}
    />
  );
}
