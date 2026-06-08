import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  Clock,
  ImageIcon,
  MapPin,
  Star,
  User,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { ReactionButtons } from "@/features/community/reaction-buttons";
import {
  communityDetailSelect,
  getAuthorNickname,
  getCarSummary,
  mapCommunityDetailRow,
} from "@/features/community/community-service";
import type {
  CommunityProfileRow,
  CommunityReactionRow,
  CommunityWashLogRow,
} from "@/features/community/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CommunityDetailPageProps = {
  params: Promise<{
    washLogId: string;
  }>;
};

const imageTypeLabels = {
  before: "Before",
  after: "After",
  process: "Process",
  etc: "Etc",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function CommunityDetailPage({
  params,
}: CommunityDetailPageProps) {
  const { washLogId } = await params;
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

  const { data, error } = await supabase
    .from("wash_logs")
    .select(communityDetailSelect)
    .eq("id", washLogId)
    .eq("visibility", "public")
    .maybeSingle();

  if (!error && !data) {
    notFound();
  }

  const profileResult = data
    ? await supabase
        .from("profiles")
        .select("id,nickname")
        .eq("id", data.user_id)
        .maybeSingle()
    : { data: null, error: null };

  const reactionResult = data
    ? await supabase
        .from("reactions")
        .select("id,user_id,wash_log_id,type,created_at")
        .eq("wash_log_id", washLogId)
    : { data: [], error: null };

  const washLog = data
    ? mapCommunityDetailRow(
        data as CommunityWashLogRow,
        profileResult.data as CommunityProfileRow | null,
        (reactionResult.data ?? []) as CommunityReactionRow[],
        user.id,
      )
    : null;
  const pageError = error ?? profileResult.error ?? reactionResult.error;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        href="/community"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        커뮤니티 목록
      </Link>

      {pageError ? (
        <section className="mt-8 rounded-md border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
          공개 세차 기록을 불러오지 못했습니다. {pageError.message}
        </section>
      ) : null}

      {!pageError && washLog ? (
        <>
          <section className="mt-6">
            <p className="text-sm font-semibold text-primary">Community Detail</p>
            <h1 className="mt-3 text-3xl font-bold">{washLog.title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {getCarSummary(washLog.car)} · {formatDate(washLog.washDate)}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 shadow-sm">
                <User className="h-4 w-4 text-primary" aria-hidden="true" />
                {getAuthorNickname(washLog.author)}
              </span>
              <ReactionButtons
                washLogId={washLog.id}
                currentUserId={user.id}
                initialLikeCount={washLog.likeCount}
                initialBookmarkCount={washLog.bookmarkCount}
                initiallyLiked={washLog.likedByCurrentUser}
                initiallyBookmarked={washLog.bookmarkedByCurrentUser}
              />
            </div>
          </section>

          <section className="mt-8 rounded-md border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <CarFront className="h-8 w-8" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">차량 및 세차 요약</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  공개 기록의 핵심 정보를 확인합니다.
                </p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoItem
                label="작성자"
                value={getAuthorNickname(washLog.author)}
                icon={<User className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem
                label="차량"
                value={getCarSummary(washLog.car)}
                icon={<CarFront className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem
                label="세차일"
                value={formatDate(washLog.washDate)}
                icon={<CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem
                label="소요 시간"
                value={`${washLog.durationMinutes}분`}
                icon={<Clock className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem
                label="비용"
                value={formatCurrency(washLog.cost)}
                icon={<Wallet className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem
                label="장소"
                value={washLog.location ?? "입력 없음"}
                icon={<MapPin className="h-4 w-4 text-primary" aria-hidden="true" />}
              />
              <InfoItem label="날씨" value={washLog.weather ?? "입력 없음"} />
              <InfoItem label="오염도" value={`${washLog.dirtLevel}/5`} />
              <InfoItem
                label="만족도"
                value={`${washLog.satisfaction}/5`}
                icon={<Star className="h-4 w-4 text-accent" aria-hidden="true" />}
              />
            </dl>
          </section>

          <section className="mt-6 rounded-md border border-border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">세차 단계</h2>
            {washLog.steps.length > 0 ? (
              <div className="mt-5 space-y-4">
                {washLog.steps.map((step) => (
                  <article className="rounded-md border border-border p-4" key={step.id}>
                    <p className="text-sm font-semibold text-primary">
                      단계 {step.stepOrder}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{step.stepType}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      제품: {step.productName ?? "입력 없음"}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {step.memo || "단계 메모가 없습니다."}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-md border border-dashed border-border p-5 text-sm text-muted-foreground">
                등록된 세차 단계가 없습니다.
              </p>
            )}
          </section>

          <section className="mt-6 rounded-md border border-border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">이미지</h2>
            {washLog.images.length > 0 ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {washLog.images.map((image) => (
                  <article className="overflow-hidden rounded-md border border-border" key={image.id}>
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        src={image.imageUrl}
                        alt={`${imageTypeLabels[image.imageType]} 세차 이미지`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                        unoptimized
                      />
                      {image.isRepresentative ? (
                        <span className="absolute left-3 top-3 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                          대표
                        </span>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <span className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {imageTypeLabels[image.imageType]}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex min-h-44 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                <ImageIcon className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
          </section>

          <section className="mt-6 rounded-md border border-border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">메모</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {washLog.memo || "메모가 없습니다."}
            </p>
          </section>
        </>
      ) : null}
    </main>
  );
}

type InfoItemProps = {
  label: string;
  value: string;
  icon?: ReactNode;
};

function InfoItem({ label, value, icon }: InfoItemProps) {
  return (
    <div className="rounded-md border border-border p-4">
      <dt className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </dt>
      <dd className="mt-2 text-sm text-muted-foreground">{value}</dd>
    </div>
  );
}
