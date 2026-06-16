# Security And RLS

이 문서는 Detailog에서 Supabase RLS를 적용할 때 지켜야 하는 최소 권한 기준을 정리합니다. 앱 코드의 `user_id`와 `visibility` 필터는 사용자 경험을 위한 1차 방어이고, 최종 데이터 보호는 RLS가 담당해야 합니다.

## 기본 원칙

- 개인 데이터 변경은 `auth.uid()`가 소유자인 row로 제한합니다.
- 비공개 세차 기록은 작성자만 읽을 수 있습니다.
- 공개 세차 기록은 커뮤니티와 랜딩 미리보기에 노출될 수 있습니다.
- 브라우저에는 `service_role` key를 절대 노출하지 않습니다.

## Public Landing Preview

랜딩 홈(`/`)은 로그인하지 않은 방문자에게 최근 공개 세차 기록을 미리 보여줍니다. 이를 위해 anon role에는 아래 데이터만 읽기 권한을 줍니다.

- `public.wash_logs`: `visibility = 'public'`인 row
- `public.wash_images`: 공개 wash log에 연결된 이미지 row
- `public.cars`: 공개 wash log에 연결된 차량 요약 row
- `public.community_profiles`: 공개 표시용 `id`, `nickname`, `avatar_url` view

쓰기, 수정, 삭제는 계속 authenticated 사용자에게만 허용합니다. 공개 홈에서 필요한 데이터가 늘어나면 먼저 공개해도 되는 정보인지 검토하고, 가능하면 table 전체가 아니라 view 또는 제한된 select 정책을 사용합니다.

## Profiles

`profiles` table은 본인만 직접 읽고 수정할 수 있습니다. 다른 사용자의 공개 표시 정보는 `community_profiles` view를 통해서만 읽습니다.

```sql
create policy "Users can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (id = auth.uid());

create policy "Users can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());
```

## Wash Logs

Authenticated 사용자는 본인 기록과 공개 기록을 읽을 수 있습니다. Anon 사용자는 랜딩 미리보기를 위해 공개 기록만 읽을 수 있습니다.

```sql
create policy "Users can read own or public wash logs"
on public.wash_logs for select to authenticated
using (user_id = auth.uid() or visibility = 'public');

create policy "Public wash logs are readable by anonymous visitors"
on public.wash_logs for select to anon
using (visibility = 'public');
```

Insert, update, delete는 본인 소유 차량과 기록으로 제한합니다.

## Wash Images

Authenticated 사용자는 본인 기록 또는 공개 기록의 이미지 row를 읽을 수 있습니다. Anon 사용자는 공개 기록에 연결된 이미지 row만 읽을 수 있습니다.

```sql
create policy "Public wash images are readable by anonymous visitors"
on public.wash_images for select to anon
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.id = wash_images.wash_log_id
      and wash_logs.visibility = 'public'
  )
);
```

`wash-images` bucket은 private bucket입니다. DB에는 Storage object path를 저장하고, 화면에서는 서버가 발급한 signed URL만 사용합니다. Storage select 정책은 본인 이미지 또는 공개 wash log에 연결된 이미지만 읽을 수 있도록 제한합니다.

## Cars

차량 table은 기본적으로 본인 차량만 읽고 수정합니다. 다만 공개 세차 기록 카드의 차량 요약을 표시하기 위해 anon은 공개 wash log에 연결된 차량 row만 읽을 수 있습니다.

```sql
create policy "Public cars are readable by anonymous visitors"
on public.cars for select to anon
using (
  exists (
    select 1 from public.wash_logs
    where wash_logs.car_id = cars.id
      and wash_logs.visibility = 'public'
  )
);
```

차량의 민감한 필드가 늘어나면 공개용 view를 분리해야 합니다.

## Reactions

반응은 공개 wash log에만 생성할 수 있고, insert/delete는 `user_id = auth.uid()`로 제한합니다. 랜딩 미리보기는 현재 반응 데이터를 읽지 않습니다.

## Storage

`avatars`와 `wash-images`는 사용자 ID로 시작하는 object path를 사용합니다. 업로드, 교체, 삭제는 해당 top-level folder가 `auth.uid()`와 일치할 때만 허용합니다.
