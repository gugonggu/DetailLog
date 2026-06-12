import Link from "next/link";
import { BookMarked, Car, Droplets, Sparkles, Users } from "lucide-react";

const previewItems = [
  { label: "Cars", value: "2 active" },
  { label: "Last wash", value: "May 18" },
  { label: "Routine", value: "Gloss care" },
];

const featureCards = [
  {
    title: "Wash records",
    description: "차량별 세차 이력, 사용 제품, 사진 기록을 한 곳에서 정리합니다.",
    icon: Droplets,
  },
  {
    title: "AI routine",
    description: "차량 상태와 선호도 기반 추천 흐름을 나중에 연결할 수 있게 준비합니다.",
    icon: Sparkles,
  },
  {
    title: "Community",
    description: "세차 루틴과 결과를 공유하는 커뮤니티 화면을 단계적으로 확장합니다.",
    icon: Users,
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:py-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-bold text-muted-foreground">
            <Car className="h-4 w-4 text-primary" aria-hidden="true" />
            Detailog web MVP
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            세차 관리가<br /><span className="text-primary">더 선명해집니다.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            세차 기록 관리, 루틴 추천, 커뮤니티 공유를 위한 responsive web
            service MVP입니다. 첫 단계에서는 Vercel 배포를 염두에 둔 웹 기반
            구조만 준비합니다.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="primary-action"
            >
              대시보드 열기
            </Link>
            <Link
              href="/community"
              className="secondary-action"
            >
              커뮤니티 보기
            </Link>
          </div>
        </div>

        <div className="surface-card p-3 sm:p-4">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Today care board</p>
                <h2 className="mt-1 text-2xl font-semibold">Civic detail log</h2>
              </div>
              <BookMarked className="h-6 w-6 text-accent" aria-hidden="true" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {previewItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/10 p-3"
                >
                  <p className="text-xs text-slate-300">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 h-32 rounded-2xl bg-[linear-gradient(135deg,#0e7490_0%,#22d3ee_48%,#f59e0b_100%)]" />
          </div>

          <div className="mt-4 grid gap-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="grid grid-cols-[2.5rem_1fr] gap-3 rounded-2xl bg-muted/50 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
