"use client";

import { Bookmark, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  summarizeReactionsForWashLog,
} from "@/features/community/community-service";
import type { CommunityReactionRow, CommunityReactionType } from "@/features/community/types";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ReactionButtonsProps = {
  washLogId: string;
  currentUserId: string;
  initialLikeCount: number;
  initialBookmarkCount: number;
  initiallyLiked: boolean;
  initiallyBookmarked: boolean;
};

type ReactionState = {
  likeCount: number;
  bookmarkCount: number;
  likedByCurrentUser: boolean;
  bookmarkedByCurrentUser: boolean;
};

export function ReactionButtons({
  washLogId,
  currentUserId,
  initialLikeCount,
  initialBookmarkCount,
  initiallyLiked,
  initiallyBookmarked,
}: ReactionButtonsProps) {
  const router = useRouter();
  const [state, setState] = useState<ReactionState>({
    likeCount: initialLikeCount,
    bookmarkCount: initialBookmarkCount,
    likedByCurrentUser: initiallyLiked,
    bookmarkedByCurrentUser: initiallyBookmarked,
  });
  const [pendingType, setPendingType] = useState<CommunityReactionType | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function refreshReactionState() {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      setErrorMessage("Supabase 환경 변수를 먼저 설정해 주세요.");
      return;
    }

    const { data, error } = await supabase
      .from("reactions")
      .select("id,user_id,wash_log_id,type,created_at")
      .eq("wash_log_id", washLogId);

    if (error) {
      setErrorMessage(`반응 상태를 다시 불러오지 못했습니다. ${error.message}`);
      return;
    }

    setState(summarizeReactionsForWashLog(
      (data ?? []) as CommunityReactionRow[],
      washLogId,
      currentUserId,
    ));
    router.refresh();
  }

  async function toggleReaction(type: CommunityReactionType) {
    const supabase = createBrowserSupabaseClient();

    setErrorMessage("");

    if (!supabase) {
      setErrorMessage("Supabase 환경 변수를 먼저 설정해 주세요.");
      return;
    }

    setPendingType(type);

    const isActive =
      type === "like" ? state.likedByCurrentUser : state.bookmarkedByCurrentUser;

    if (isActive) {
      const { error } = await supabase
        .from("reactions")
        .delete()
        .match({
          user_id: currentUserId,
          wash_log_id: washLogId,
          type,
        });

      if (error) {
        setErrorMessage(`반응을 취소하지 못했습니다. ${error.message}`);
        setPendingType(null);
        return;
      }

      await refreshReactionState();
      setPendingType(null);
      return;
    }

    const { data: publicWashLog, error: visibilityError } = await supabase
      .from("wash_logs")
      .select("id")
      .eq("id", washLogId)
      .eq("visibility", "public")
      .maybeSingle();

    if (visibilityError || !publicWashLog) {
      setErrorMessage(
        visibilityError
          ? `공개 기록 여부를 확인하지 못했습니다. ${visibilityError.message}`
          : "공개 세차 기록에만 반응할 수 있습니다.",
      );
      setPendingType(null);
      return;
    }

    const { error } = await supabase.from("reactions").insert({
      user_id: currentUserId,
      wash_log_id: washLogId,
      type,
    });

    if (error && error.code !== "23505") {
      setErrorMessage(`반응을 저장하지 못했습니다. ${error.message}`);
      setPendingType(null);
      return;
    }

    await refreshReactionState();
    setPendingType(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <ReactionButton
          active={state.likedByCurrentUser}
          count={state.likeCount}
          disabled={pendingType !== null}
          icon="like"
          label={state.likedByCurrentUser ? "좋아요 취소" : "좋아요"}
          loading={pendingType === "like"}
          onClick={() => toggleReaction("like")}
        />
        <ReactionButton
          active={state.bookmarkedByCurrentUser}
          count={state.bookmarkCount}
          disabled={pendingType !== null}
          icon="bookmark"
          label={state.bookmarkedByCurrentUser ? "북마크 제거" : "북마크"}
          loading={pendingType === "bookmark"}
          onClick={() => toggleReaction("bookmark")}
        />
      </div>
      {errorMessage ? (
        <p className="text-xs leading-5 text-red-600" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

type ReactionButtonProps = {
  active: boolean;
  count: number;
  disabled: boolean;
  icon: "like" | "bookmark";
  label: string;
  loading: boolean;
  onClick: () => void;
};

function ReactionButton({
  active,
  count,
  disabled,
  icon,
  label,
  loading,
  onClick,
}: ReactionButtonProps) {
  const Icon = icon === "like" ? Heart : Bookmark;

  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-white text-muted-foreground hover:border-primary hover:text-foreground",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon
        className={cn("h-4 w-4", active ? "fill-current" : "")}
        aria-hidden="true"
      />
      <span>{loading ? "처리 중" : label}</span>
      <span>{count}</span>
    </button>
  );
}
