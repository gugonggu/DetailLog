# Basic Search And Filter Design

## 목표

`/wash`와 `/community` 목록에 MVP 수준의 검색·필터를 추가한다. 필터 상태는 URL search params에 저장하며, 기존 서버 컴포넌트의 Supabase query에서 결과를 제한한다.

## 설계

- `/wash`는 `keyword`, `car`, `visibility`, `dirtLevel`, `satisfaction`, `from`, `to`를 지원한다.
- `/community`는 `keyword`, `dirtLevel`, `satisfaction`, `order`를 지원한다.
- `keyword`는 `title`, `location`, `memo`에 대해 대소문자 구분 없이 검색한다.
- 등급 필터는 `1`부터 `5`까지의 정확한 값만 허용한다.
- 날짜는 `YYYY-MM-DD` 값만 허용하며 `wash_date` 범위에 적용한다.
- 커뮤니티의 기본 및 유일한 정렬 선택은 최신순이다.
- 각 feature의 순수 파서가 URL 값을 정리하고 검증한다.
- 기본 HTML `GET` form을 사용하며 별도 클라이언트 상태는 추가하지 않는다.
- 결과가 없고 활성 필터가 있으면 필터 결과 전용 빈 상태와 초기화 링크를 표시한다.

## 트레이드오프

서버 필터와 URL search params는 새로고침, 공유, 뒤로 가기에 자연스럽고 전체 행을 브라우저로 보내지 않는다. 대신 입력할 때마다 즉시 갱신하지 않고 사용자가 검색 버튼을 눌러야 한다. 자동완성, 복합 정렬, 페이지네이션은 이번 단계에서 제외한다.

## 테스트

- 순수 파서가 공백, 잘못된 enum·등급·날짜, 배열형 search param을 안전하게 처리하는지 검증한다.
- 전체 테스트, lint, production build를 실행한다.
- 모바일과 데스크톱 폭에서 필터 form과 빈 상태를 수동 확인한다.
