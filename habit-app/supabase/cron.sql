-- pg_cron 스케줄 (Supabase 대시보드에서 pg_cron 확장을 켠 뒤 SQL Editor 에서 1회 실행)
-- cron 은 UTC 기준. 정산은 KST 00:10(=UTC 15:10), 미납 만료는 매시 정각.
select cron.schedule('finalize-due-cohorts', '10 15 * * *', $$select public.finalize_due_cohorts()$$);
select cron.schedule('expire-unpaid',        '5 * * * *',   $$select public.expire_unpaid()$$);
