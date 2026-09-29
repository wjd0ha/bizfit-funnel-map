# 부행일치 (habit-app)

설계서 기반 습관 인증 앱(PWA). 저장소 루트의 Next.js "Bizfit Funnel Map"과는 별개이며 이 폴더에서 독립적으로 개발·배포한다.

```
habit-app/
  supabase/migrations/   0001 스키마·RLS, 0002 RPC, 0003 관리자 추가, 0004 공개정보
  supabase/cron.sql      pg_cron 스케줄 (이미 적용됨)
  supabase/tests/        로컬 PostgreSQL 테스트 (run.sh)
  web/                   Vite + React + TS + Tailwind + PWA
  sheets/Code.gs         구글 시트 연동 Apps Script
```

## 현재 상태
- Supabase 프로젝트 `buhaengilchi` (서울, `qkfldfeorzkiynovptro`) 에 0001~0004, pg_cron, Edge Function(`signup`, `export-sheet`) 적용 완료
- 40~42기 생성 완료 (설계서 2장 일정)
- 프론트: S1~S11, A1~A7 구현 (`web/`)

## 운영자 최초 설정 (1회)
1. 배포된 주소에서 운영자 계정으로 일반 가입한다.
2. Supabase SQL Editor 에서 실행: `update profiles set role='admin' where email='본인이메일';`
3. 앱 → 관리자 → 설정: 입금 계좌, 단톡방 링크·비밀번호, 운영자 이름·이메일 입력
4. 관리자 → 이관: 40기 CSV 업로드 후 참가자에게 "시트에 적은 이메일로 가입" 안내
5. 관리자 → 기수: 41기 모집 시 "모집 활성화"

## 로컬 개발
```
cd habit-app/web
cp .env.example .env     # 값 입력 (publishable 키만. service_role 금지)
npm install && npm run dev
```

## 배포 (Cloudflare Pages, 무료 기본 주소)
- 루트 디렉터리 `habit-app/web`, 빌드 명령 `npm run build`, 출력 `dist`
- 환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- 프로젝트명이 곧 주소(`이름.pages.dev`)이므로 배포 전에 확정한다. 바뀌면 홈 화면에 추가한 앱을 다시 추가해야 한다.
- 이메일 인증은 쓰지 않는다: 가입은 Edge Function `signup` 이 처리(메일 발송 제한 회피)

## 테스트
`habit-app/supabase/tests/run.sh` — 임시 DB에 마이그레이션 + 경계값 테스트(116건).
시각은 테스트에서만 `app_now()` 를 대체해 고정하고, 운영은 `now()` (KST 변환) 만 쓴다.

## 시트 연동 (2단계)
`sheets/Code.gs` 상단 주석 참고. 토큰은 관리자 → 설정에서 발급(서버엔 해시만 저장).

## 아직 확인하지 못한 것
- 카카오톡 인앱 / 아이폰 Safari / 안드로이드 Chrome 실기기 확인
- 대비(contrast) 실측, Lighthouse PWA 점검
- 개인정보 처리방침의 국외 이전 항목·전자상거래 기록 보존 기간(법령 확인 후 문구 확정)
- 환불불가·차감 조항의 법률 검토
