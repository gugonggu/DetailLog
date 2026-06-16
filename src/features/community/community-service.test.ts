import { describe, expect, it } from "vitest";

import {
  mapLandingPreviewRows,
  mapCommunityDetailRow,
  mapCommunityFeedRows,
  signCommunityWashLogRows,
} from "./community-service";
import type {
  CommunityProfileRow,
  CommunityReactionRow,
  CommunityWashLogRow,
} from "./types";

const basePublicWashLogRow: CommunityWashLogRow = {
  id: "wash-log-id",
  user_id: "author-id",
  car_id: "car-id",
  title: "Weekend wash",
  wash_date: "2026-05-19",
  location: "Home",
  duration_minutes: 90,
  cost: 25000,
  weather: "Sunny",
  dirt_level: 3,
  satisfaction: 5,
  memo: "Glossy finish",
  visibility: "public",
  created_at: "2026-05-19T00:00:00.000Z",
  updated_at: "2026-05-19T00:00:00.000Z",
  cars: {
    id: "car-id",
    name: "Daily",
    brand: "Hyundai",
    model: "Sonata",
  },
  wash_steps: [],
  wash_images: [],
};

const profiles: CommunityProfileRow[] = [
  {
    id: "author-id",
    nickname: "Author",
    avatar_url: "https://example.supabase.co/storage/v1/object/public/avatars/author/avatar.jpg",
  },
];

const reactions: CommunityReactionRow[] = [
  {
    id: "like-id",
    user_id: "current-user-id",
    wash_log_id: "wash-log-id",
    type: "like",
    created_at: "2026-05-19T01:00:00.000Z",
  },
  {
    id: "other-like-id",
    user_id: "other-user-id",
    wash_log_id: "wash-log-id",
    type: "like",
    created_at: "2026-05-19T02:00:00.000Z",
  },
  {
    id: "bookmark-id",
    user_id: "current-user-id",
    wash_log_id: "wash-log-id",
    type: "bookmark",
    created_at: "2026-05-19T03:00:00.000Z",
  },
];

describe("community service", () => {
  it("maps reaction counts and current user state for feed rows", () => {
    const [item] = mapCommunityFeedRows(
      [basePublicWashLogRow],
      profiles,
      reactions,
      "current-user-id",
    );

    expect(item.likeCount).toBe(2);
    expect(item.bookmarkCount).toBe(1);
    expect(item.likedByCurrentUser).toBe(true);
    expect(item.bookmarkedByCurrentUser).toBe(true);
    expect(item.author.avatarUrl).toBe(
      "https://example.supabase.co/storage/v1/object/public/avatars/author/avatar.jpg",
    );
  });

  it("maps reaction counts and current user state for detail rows", () => {
    const item = mapCommunityDetailRow(
      basePublicWashLogRow,
      profiles[0],
      reactions,
      "current-user-id",
    );

    expect(item).toMatchObject({
      likeCount: 2,
      bookmarkCount: 1,
      likedByCurrentUser: true,
      bookmarkedByCurrentUser: true,
    });
  });

  it("drops private wash logs from feed rows", () => {
    const privateWashLog = {
      ...basePublicWashLogRow,
      visibility: "private" as const,
    };

    expect(mapCommunityFeedRows([privateWashLog], profiles)).toEqual([]);
  });

  it("returns null for a private community detail row", () => {
    const privateWashLog = {
      ...basePublicWashLogRow,
      visibility: "private" as const,
    };

    expect(mapCommunityDetailRow(privateWashLog, profiles[0])).toBeNull();
  });

  it("maps up to three public rows for landing preview", () => {
    const rows = Array.from({ length: 5 }, (_, index) => ({
      ...basePublicWashLogRow,
      id: `wash-log-${index + 1}`,
      title: `Weekend wash ${index + 1}`,
    }));

    const items = mapLandingPreviewRows(rows, profiles);

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.title)).toEqual([
      "Weekend wash 1",
      "Weekend wash 2",
      "Weekend wash 3",
    ]);
    expect(items[0]).toMatchObject({
      likeCount: 0,
      bookmarkCount: 0,
      likedByCurrentUser: false,
      bookmarkedByCurrentUser: false,
    });
  });

  it("signs nested wash image rows for community rendering", async () => {
    const row = {
      ...basePublicWashLogRow,
      wash_images: [
        {
          id: "image-id",
          wash_log_id: "wash-log-id",
          image_url:
            "https://example.supabase.co/storage/v1/object/public/wash-images/user-id/wash-log-id/file.jpg",
          image_type: "before" as const,
          is_representative: true,
          created_at: "2026-05-19T00:00:00.000Z",
        },
      ],
    };
    const supabase = {
      storage: {
        from() {
          return {
            createSignedUrl() {
              return Promise.resolve({
                data: { signedUrl: "https://signed.example/file.jpg" },
                error: null,
              });
            },
          };
        },
      },
    };

    const [signedRow] = await signCommunityWashLogRows(supabase, [row]);

    expect(signedRow.wash_images?.[0]?.image_url).toBe("https://signed.example/file.jpg");
    expect(row.wash_images[0].image_url).toContain("/object/public/wash-images/");
  });
});
