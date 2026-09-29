-- 보안 점검(advisor) 권고: 헬퍼 함수 search_path 고정
alter function public.fail(text, text) set search_path = public;
alter function public.require_user() set search_path = public;
alter function public.app_now() set search_path = public;
alter function public.kst_today() set search_path = public;
alter function public.kst_time() set search_path = public;
