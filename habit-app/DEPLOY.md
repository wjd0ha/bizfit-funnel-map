# 부행일치 배포 안내 (Cloudflare Pages) — 다른 AI/담당자에게 그대로 전달용

## 상황
- GitHub 저장소: `wjd0ha/bizfit-funnel-map` (비공개), 브랜치 `claude/habit-app-design-plfj9s`
- 배포 대상은 저장소 안의 **`habit-app/web`** 폴더 하나입니다. (저장소 루트는 다른 Next.js 앱이니 건드리지 마세요. 루트의 `wrangler.jsonc`, `open-next.config.ts`도 이 앱과 무관합니다.)
- 앱: Vite + React + TypeScript SPA(PWA). 백엔드는 이미 Supabase(서울)에 구축·적용 완료. **프론트만 배포하면 됩니다.**
- 목표: Cloudflare Pages 무료 기본 주소(`프로젝트명.pages.dev`), 커스텀 도메인 없음.

## 배포 절차
1. Cloudflare 대시보드 → Workers & Pages → Create → **Pages** → Connect to Git → GitHub 계정 연결 후 저장소 `bizfit-funnel-map` 선택
   (저장소가 비공개이므로 Cloudflare GitHub 앱에 이 저장소 접근 권한을 줘야 합니다.)
2. **프로젝트 이름 확정**: 이 이름이 곧 주소(`이름.pages.dev`)입니다. 배포 후 바꾸면 참가자가 홈 화면에 추가한 앱을 다시 추가해야 하니 신중히 정하세요.
3. 빌드 설정
   - Production branch: `claude/habit-app-design-plfj9s` (또는 이 브랜치를 main에 병합한 뒤 main)
   - Root directory: `habit-app/web`
   - Framework preset: None (또는 Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 환경변수 (Production, Preview 모두)
   - `VITE_SUPABASE_URL` = `https://qkfldfeorzkiynovptro.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_JAhWe419VTKD6XjYBFM4ag_ETacDnQM`  (공개용 키라 프론트에 들어가도 되는 값)
   - `NODE_VERSION` = `22`
   - ⚠ `service_role` 키는 어디에도 넣지 마세요.
5. Save and Deploy. SPA 라우팅은 `public/_redirects`(`/* /index.html 200`)가 이미 처리합니다.

## 배포 후 확인
1. 주소를 열면 로그인/가입 화면(로고 + "부행일치")이 나온다.
2. 가입 탭에서 이메일·비밀번호(8자 이상)·성명·닉네임·연락처 + 개인정보 동의로 가입 → 자동 로그인되어 홈이 보인다. (가입은 Supabase Edge Function `signup`이 처리하며 이메일 인증 메일은 없다.)
3. `/terms`, `/privacy` 가 로그인 없이 열린다.
4. 휴대폰에서 "홈 화면에 추가" 후 앱처럼 열린다.
5. 배포된 주소와 가입한 이메일을 운영자(Claude)에게 알려 주면 관리자 권한을 지정한다. (DB에서 1회 지정: `update profiles set role='admin' where email='...';`)

## 알아둘 점
- Cloudflare Pages 무료 플랜의 상업적 이용 허용 여부와 사용량 한도는 배포 전에 공식 약관으로 확인하세요.
- 비밀 값(계좌, 단톡방 링크/비밀번호, 시트 연동 토큰)은 코드에 없고 관리자 화면 → 설정에서 입력합니다.
- 문제가 생기면 빌드 로그를 그대로 전달해 주세요.
