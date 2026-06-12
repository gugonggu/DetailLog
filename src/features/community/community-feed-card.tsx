import { ImageIcon, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  getAuthorNickname,
  getCarSummary,
} from "@/features/community/community-service";
import type { CommunityFeedItem } from "@/features/community/types";
import { ReactionButtons } from "./reaction-buttons";

type CommunityFeedCardProps = {
  item: CommunityFeedItem;
  currentUserId: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function CommunityFeedCard({ item, currentUserId }: CommunityFeedCardProps) {
  return (
    <article className="surface-card overflow-hidden transition hover:-translate-y-0.5 hover:border-primary">
      <Link href={`/community/${item.id}`}>
        <div className="relative aspect-[4/3] bg-muted">
          {item.representativeImage ? (
            <Image
              src={item.representativeImage.imageUrl}
              alt={`${item.title} 대표 이미지`}
              fill
              className="object-cover"
              sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {getAuthorNickname(item.author)}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              공개
            </span>
          </div>

          <p className="mt-4 text-sm font-medium text-foreground">
            {getCarSummary(item.car)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(item.washDate)}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs font-semibold text-muted-foreground">오염도</p>
              <p className="mt-1 font-semibold">{item.dirtLevel}/5</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs font-semibold text-muted-foreground">만족도</p>
              <p className="mt-1 flex items-center gap-1 font-semibold">
                <Star className="h-4 w-4 text-accent" aria-hidden="true" />
                {item.satisfaction}/5
              </p>
            </div>
          </div>
        </div>
      </Link>

      <div className="border-t border-border px-5 py-4">
        <ReactionButtons
          washLogId={item.id}
          currentUserId={currentUserId}
          initialLikeCount={item.likeCount}
          initialBookmarkCount={item.bookmarkCount}
          initiallyLiked={item.likedByCurrentUser}
          initiallyBookmarked={item.bookmarkedByCurrentUser}
        />
      </div>
    </article>
  );
}
