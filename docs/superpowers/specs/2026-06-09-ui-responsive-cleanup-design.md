# Detailog UI 및 반응형 정리 설계

## 목표

Detailog의 기존 business logic과 데이터 흐름을 유지하면서 주요 페이지의
레이아웃, 모바일 사용성, 카드 계층, 폼 가독성, 내비게이션 및 상태 UI를
일관되게 정리한다.

시각 방향은 토스와 유사한 현대적인 웹 프로그램 UI를 참고한다. 넉넉한
여백, 부드러운 배경, 명확한 정보 우선순위, 편안한 모바일 조작을 적용하되
Detailog의 teal 포인트 색상은 유지한다.

## 범위

- `/`
- `/dashboard`
- `/cars`
- `/wash`
- `/routine/new`
- `/community`
- `/bookmarks`
- `/profile`

위 페이지와 직접 연결된 공통 레이아웃, 카드, 폼 및 loading UI만 변경한다.
현재 검색·필터 기능을 포함한 business logic, 인증, Supabase 쿼리, OpenAI
호출 방식은 변경하지 않는다.

## UI 구조

### 앱 내비게이션

기존 서버 인증 레이아웃을 유지한다. 메뉴 열림 상태만 담당하는 작은 client
component를 추가해 모바일 햄버거 메뉴를 제공한다. 데스크톱에서는 기존
가로 메뉴를 유지하되 간격과 hover 상태를 정돈한다.

### 페이지 레이아웃

반복되는 페이지 제목, 설명, 우측 action 영역을 `PageHeader`로 통일한다.
페이지 최대 너비와 좌우 여백도 공통 규칙을 사용한다. action은 모바일에서
읽기 흐름 아래에 배치되고, 필요한 경우 전체 너비를 사용한다.

### 카드와 상태 UI

카드는 더 부드러운 모서리, 약한 테두리와 그림자, 넉넉한 내부 여백을
공통적으로 사용한다. 정보 카드 안에서는 eyebrow, 제목, 설명, metric의
우선순위를 분명히 한다.

반복되는 상태 UI는 다음 공통 component로 정리한다.

- `EmptyState`: 아이콘, 제목, 설명, 선택적 action
- `ErrorState`: 오류 제목과 상세 메시지
- `LoadingCard`: 주요 목록 및 요약 loading skeleton

빈 결과와 실제 데이터 없음은 설명과 action 문구를 다르게 유지한다.

### 폼

기존 React Hook Form과 Zod 구성은 유지한다. 폼 container, 섹션 간격, label,
helper, error, input focus 상태를 일관되게 정리한다. 모바일에서는 action
버튼이 전체 너비를 사용하고, 넓은 화면에서는 필요한 너비만 사용한다.

이번 단계에서는 모든 form field와 button을 범용 primitive로 전환하지 않는다.
이는 변경량과 회귀 위험을 불필요하게 키우기 때문이다.

### 문구

범위 내 사용자 노출 문구 중 깨진 한글을 기존 의미에 맞게 정상화한다.
기술 식별자, route, table 이름, 변수명은 영어를 유지한다.

## 반응형 동작

- 모바일: 햄버거 메뉴, 단일 열 카드 및 폼, 전체 너비 주요 action
- 태블릿: 목록과 일부 요약을 2열로 확장
- 데스크톱: 기존 정보 밀도를 유지하면서 2~4열 레이아웃 사용
- 모든 크기에서 가로 overflow와 잘린 action이 없도록 한다

## 오류 및 loading 처리

페이지 query 오류는 공통 `ErrorState`로 표시한다. form 제출 오류는 현재
form 내부 상태를 유지하되 같은 색상과 간격 규칙을 적용한다.

기존 route loading 파일을 공통 skeleton 스타일로 정돈하고 `/bookmarks`와
`/routine/new`에 필요한 loading UI를 추가한다.

## 검증

- `npm test`
- `npm run build`
- 브라우저에서 주요 route의 desktop 및 mobile viewport 확인
- 모바일 햄버거 메뉴 열기, route 이동, 메뉴 닫기 확인
- 빈 상태, 오류 상태, loading 상태의 시각적 일관성 확인
- 폼 label, helper, validation error 및 제출 버튼 확인

## 제외 범위

- 새로운 business feature
- database schema 또는 query 동작 변경
- Supabase 또는 OpenAI integration 변경
- native mobile app
- 전면적인 디자인 시스템 또는 animation system 구축
