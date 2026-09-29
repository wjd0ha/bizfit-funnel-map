# 부행일치 (habit-app)

설계서 기반 습관 인증 앱. 기존 Next.js "Bizfit Funnel Map"(저장소 루트)과는 별개이며, 이 폴더에서 독립적으로 개발한다.

## 진행 상황 (설계서 13장)
- [x] 1단계 DB: `supabase/migrations/0001_schema.sql`(테이블·RLS), `0002_rpc.sql`(RPC), `supabase/cron.sql`(pg_cron)
- [x] 1단계 테스트: `supabase/tests/run.sh` (로컬 PostgreSQL 16, 108개 검증)
- [ ] 2단계~ 프론트(Vite+React), 관리자 화면, Edge Function `export-sheet` 등

## 테스트 실행
`habit-app/supabase/tests/run.sh` — 임시 DB를 만들어 마이그레이션 + `tests.sql` 을 실행한다.
시각은 테스트에서만 `app_now()` 를 대체해 고정한다(운영은 `now()`).

## Supabase 적용
SQL Editor 또는 `supabase db push` 로 0001 → 0002 순서 적용, 이후 `cron.sql` 1회 실행.
관리자 지정: 가입 후 `update profiles set role='admin' where email='...';` 1회.
