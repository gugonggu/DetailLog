import { describe, expect, it } from "vitest";

import {
  mapCommunityDetailRow,
  mapCommunityFeedRows,
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
});
