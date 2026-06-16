import type { WashImage, WashImageRow } from "../wash-images/types";
import type { WashLog, WashLogRow } from "../wash-logs/types";

export type CommunityAuthor = {
  id: string;
  nickname: string;
  avatarUrl: string | null;
};

export type CommunityProfileRow = {
  id: string;
  nickname: string;
  avatar_url?: string | null;
};

export type CommunityReactionType = "like" | "bookmark";

export type CommunityReactionRow = {
  id: string;
  user_id: string;
  wash_log_id: string;
  type: CommunityReactionType;
  created_at: string;
};

export type CommunityWashLogRow = WashLogRow & {
  wash_images?: WashImageRow[] | null;
};

export type CommunityFeedItem = WashLog & {
  author: CommunityAuthor;
  representativeImage: WashImage | null;
  likeCount: number;
  bookmarkCount: number;
  likedByCurrentUser: boolean;
  bookmarkedByCurrentUser: boolean;
};

export type CommunityWashLogDetail = CommunityFeedItem;
