import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";
import { EmptyState, ErrorState, LoadingCard } from "./states";

describe("shared UI components", () => {
  it("renders a page header with its action", () => {
    const markup = renderToStaticMarkup(
      createElement(PageHeader, {
        eyebrow: "Cars",
        title: "내 차량",
        description: "차량 프로필을 관리합니다.",
        action: createElement("a", { href: "/cars/new" }, "차량 추가"),
      }),
    );

    expect(markup).toContain("내 차량");
    expect(markup).toContain("차량 추가");
  });

  it("renders empty and error states with clear labels", () => {
    const emptyMarkup = renderToStaticMarkup(
      createElement(EmptyState, {
        title: "기록이 없습니다.",
        description: "첫 기록을 추가해 보세요.",
      }),
    );
    const errorMarkup = renderToStaticMarkup(
      createElement(ErrorState, {
        title: "불러오지 못했습니다.",
        description: "잠시 후 다시 시도해 주세요.",
      }),
    );

    expect(emptyMarkup).toContain("기록이 없습니다.");
    expect(errorMarkup).toContain('role="alert"');
  });

  it("renders loading cards as busy content", () => {
    const markup = renderToStaticMarkup(createElement(LoadingCard));

    expect(markup).toContain('aria-busy="true"');
  });
});
