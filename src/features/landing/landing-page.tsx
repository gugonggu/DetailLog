import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Car,
  Droplets,
  ImageIcon,
  LogIn,
  PenLine,
  Search,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  getAuthorNickname,
  getCarSummary,
} from "@/features/community/community-service";
import type { CommunityFeedItem } from "@/features/community/types";

import { getLandingActions } from "./landing-actions";

type LandingPageProps = {
  previewItems: CommunityFeedItem[];
  previewError?: string;
  isAuthenticated: boolean;
};

const stats = [
  { label: "기록", value: "Wash logs" },
  { label: "추천", value: "AI routine" },
  { label: "공유", value: "Community" },
];

const productHighlights = [
  {
    title: "세차 기록 정리",
    description: "차량별 세차 날짜, 비용, 오염도, 만족도, 사진을 한 흐름으로 남깁니다.",
    icon: BookOpenCheck,
  },
  {
    title: "AI 세차 루틴 추천",
    description: "차량 상태와 선호도를 바탕으로 다음 세차 순서와 주의사항을 AI로 추천받을 수 있습니다.",
    icon: Sparkles,
  },
  {
    title: "공개 기록 탐색",
    description: "다른 사용자의 공개 세차 기록을 보고 제품, 과정, 결과를 비교합니다.",
    icon: Users,
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

function PreviewCard({ item }: { item: CommunityFeedItem }) {
  return (
    <Link
      className="group grid overflow-hidden rounded-lg border border-border/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary"
      href={`/community/${item.id}`}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {item.representativeImage ? (
          <Image
            src={item.representativeImage.imageUrl}
            alt={`${item.title} 대표 이미지`}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-9 w-9" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDate(item.washDate)}
        </div>
        <h3 className="mt-2 truncate text-base font-bold">{item.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
            {item.author.avatarUrl ? (
              <Image
                src={item.author.avatarUrl}
                alt={`${getAuthorNickname(item.author)} 아바타`}
                fill
                className="object-cover"
                sizes="24px"
                unoptimized
              />
            ) : (
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </span>
          <span className="truncate">{getAuthorNickname(item.author)}</span>
        </div>
        <p className="mt-3 truncate text-sm font-medium">{getCarSummary(item.car)}</p>
        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>오염도 {item.dirtLevel}/5</span>
          <span>만족도 {item.satisfaction}/5</span>
        </div>
      </div>
    </Link>
  );
}

export function LandingPage({
  previewItems,
  previewError = "",
  isAuthenticated,
}: LandingPageProps) {
  const actions = getLandingActions(isAuthenticated);
  const HeroPrimaryIcon = isAuthenticated ? Car : ArrowRight;
  const HeroSecondaryIcon = isAuthenticated ? PenLine : Search;
  const EmptyIcon = isAuthenticated ? PenLine : LogIn;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4 sm:px-8">
          <Link className="mr-auto text-xl font-black tracking-tight" href="/">
            Detailog
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="공개 메뉴">
            <Link className="secondary-action h-10 px-3" href={actions.navSecondary.href}>
              {actions.navSecondary.label}
            </Link>
          </nav>
          <Link className="primary-action h-10 px-4" href={actions.navPrimary.href}>
            {actions.navPrimary.label}
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-14">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-bold text-muted-foreground">
            <Car className="h-4 w-4 text-primary" aria-hidden="true" />
            세차 기록이 루틴이 되는 공간
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            세차 기록을 남기고
            <span className="block text-primary">좋은 루틴을 발견하세요.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Detailog는 차량별 세차 기록, 사진, 만족도, 루틴 추천, 공개 커뮤니티를
            한곳에 모으는 웹 서비스입니다.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="primary-action" href={actions.heroPrimary.href}>
              {actions.heroPrimary.label}
              <HeroPrimaryIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link className="secondary-action" href={actions.heroSecondary.href}>
              {actions.heroSecondary.label}
              <HeroSecondaryIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {stats.map((item) => (
              <div className="rounded-lg border border-border bg-white p-3" key={item.label}>
                <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div
            className="relative min-h-[340px] bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(15,23,42,0.1), rgba(15,23,42,0.68)), url('/images/landing-hero.svg')",
            }}
          >
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
              <p className="text-sm font-semibold text-white/80">Today care board</p>
              <h2 className="mt-2 max-w-sm text-3xl font-black">
                내 세차 결과를 다음 관리 기준으로 만듭니다.
              </h2>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            {productHighlights.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="rounded-lg bg-muted/50 p-4" key={feature.title}>
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-primary">Community preview</p>
              <h2 className="mt-2 text-3xl font-black">최근 공개 세차 기록</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                공개로 공유된 기록을 먼저 둘러보고, 마음에 드는 루틴을 내 차량 관리에
                참고하세요.
              </p>
            </div>
            <Link className="secondary-action" href="/community">
              전체 보기
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {previewError ? (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              공개 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.
            </div>
          ) : null}

          {!previewError && previewItems.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <Droplets className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold">아직 공개 기록이 없습니다</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                첫 공개 세차 기록을 남기면 이곳에 서비스의 첫 콘텐츠로 표시됩니다.
              </p>
              <Link className="primary-action mt-5" href={actions.emptyPrimary.href}>
                {actions.emptyPrimary.label}
                <EmptyIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : null}

          {!previewError && previewItems.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {previewItems.map((item) => (
                <PreviewCard item={item} key={item.id} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
