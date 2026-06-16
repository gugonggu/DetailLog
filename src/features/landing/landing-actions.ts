type LandingAction = {
  href: string;
  label: string;
};

type LandingActions = {
  navPrimary: LandingAction;
  navSecondary: LandingAction;
  heroPrimary: LandingAction;
  heroSecondary: LandingAction;
  emptyPrimary: LandingAction;
};

export function getLandingActions(isAuthenticated: boolean): LandingActions {
  if (isAuthenticated) {
    return {
      navPrimary: { href: "/dashboard", label: "대시보드" },
      navSecondary: { href: "/community", label: "커뮤니티" },
      heroPrimary: { href: "/dashboard", label: "내 대시보드로 가기" },
      heroSecondary: { href: "/wash/new", label: "세차 기록 남기기" },
      emptyPrimary: { href: "/wash/new", label: "첫 공개 기록 남기기" },
    };
  }

  return {
    navPrimary: { href: "/signup", label: "시작하기" },
    navSecondary: { href: "/login", label: "로그인" },
    heroPrimary: { href: "/signup", label: "무료로 시작하기" },
    heroSecondary: { href: "/community", label: "공개 기록 보기" },
    emptyPrimary: { href: "/login", label: "로그인하고 기록하기" },
  };
}
