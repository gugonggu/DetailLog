import { mapWashLogRowToWashLog } from "../wash-logs/wash-log-service";
import { signWashImageRows } from "../wash-images/wash-image-service";
import type { WashImage } from "../wash-images/types";
import type {
  CommunityAuthor,
  CommunityFeedItem,
  CommunityProfileRow,
  CommunityReactionRow,
  CommunityWashLogDetail,
  CommunityWashLogRow,
} from "./types";

export const communityFeedSelect =
  "id,user_id,car_id,title,wash_date,location,duration_minutes,cost,weather,dirt_level,satisfaction,memo,visibility,created_at,updated_at,cars(id,name,brand,model),wash_images(id,wash_log_id,image_url,image_type,is_representative,created_at)";

export const communityDetailSelect =
  "id,user_id,car_id,title,wash_date,location,duration_minutes,cost,weather,dirt_level,satisfaction,memo,visibility,created_at,updated_at,cars(id,name,brand,model),wash_steps(id,wash_log_id,step_type,product_name,memo,step_order,created_at),wash_images(id,wash_log_id,image_url,image_type,is_representative,created_at)";

export function createProfileMap(profiles: CommunityProfileRow[]) {
  return new Map(profiles.map((profile) => [profile.id, profile]));
}

export function getAuthorNickname(author: CommunityAuthor) {
  return author.nickname.trim() || "Detailog 사용자";
}

export function getCarSummary(car: CommunityFeedItem["car"]) {
  if (!car) {
    return "차량 정보 없음";
  }

  return `${car.name} · ${car.brand} ${car.model}`;
}

function findRepresentativeImage(images: WashImage[]) {
  return images.find((image) => image.isRepresentative) ?? images[0] ?? null;
}

export function summarizeReactionsForWashLog(
  reactionRows: CommunityReactionRow[],
  washLogId: string,
  currentUserId: string,
) {
  const reactions = reactionRows.filter((reaction) => reaction.wash_log_id === washLogId);

  return {
    likeCount: reactions.filter((reaction) => reaction.type === "like").length,
    bookmarkCount: reactions.filter((reaction) => reaction.type === "bookmark").length,
    likedByCurrentUser: reactions.some(
      (reaction) =>
        reaction.type === "like" && reaction.user_id === currentUserId,
    ),
    bookmarkedByCurrentUser: reactions.some(
      (reaction) =>
        reaction.type === "bookmark" && reaction.user_id === currentUserId,
    ),
  };
}

function createCommunityItem(
  row: CommunityWashLogRow,
  profileMap: Map<string, CommunityProfileRow>,
  reactionRows: CommunityReactionRow[],
  currentUserId: string,
): CommunityFeedItem | null {
  const washLog = mapWashLogRowToWashLog(row);

  if (washLog.visibility !== "public") {
    return null;
  }

  const profile = profileMap.get(washLog.userId);
  const author = {
    id: washLog.userId,
    nickname: profile?.nickname ?? "Detailog 사용자",
    avatarUrl: profile?.avatar_url ?? null,
  };

  return {
    ...washLog,
    author,
    representativeImage: findRepresentativeImage(washLog.images),
    ...summarizeReactionsForWashLog(reactionRows, washLog.id, currentUserId),
  };
}

export function mapCommunityFeedRows(
  rows: CommunityWashLogRow[],
  profiles: CommunityProfileRow[],
  reactions: CommunityReactionRow[] = [],
  currentUserId = "",
) {
  const profileMap = createProfileMap(profiles);

  return rows
    .map((row) => createCommunityItem(row, profileMap, reactions, currentUserId))
    .filter((item): item is CommunityFeedItem => Boolean(item));
}

export function mapLandingPreviewRows(
  rows: CommunityWashLogRow[],
  profiles: CommunityProfileRow[],
  limit = 3,
) {
  return mapCommunityFeedRows(rows, profiles).slice(0, limit);
}

type CommunitySigningSupabaseClient = Parameters<typeof signWashImageRows>[0];

export async function signCommunityWashLogRows<T extends CommunityWashLogRow>(
  supabase: CommunitySigningSupabaseClient,
  rows: T[],
) {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      wash_images: row.wash_images
        ? await signWashImageRows(supabase, row.wash_images)
        : row.wash_images,
    })),
  );
}

export function mapCommunityDetailRow(
  row: CommunityWashLogRow,
  profile: CommunityProfileRow | null,
  reactions: CommunityReactionRow[] = [],
  currentUserId = "",
): CommunityWashLogDetail | null {
  const profileMap = createProfileMap(profile ? [profile] : []);

  return createCommunityItem(row, profileMap, reactions, currentUserId);
}
