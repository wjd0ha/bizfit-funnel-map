-- 15장 테스트 항목 (1단계: DB 로직/RLS). 실패가 하나라도 있으면 마지막에 예외.
create table t_res (name text, ok boolean);
create function t_ok(n text, c boolean) returns void language plpgsql security definer as
$$ begin insert into t_res values (n, coalesce(c,false)); if not coalesce(c,false) then raise warning 'FAIL: %', n; end if; end $$;
create function t_now(ts text) returns void language sql as $$ select set_config('test.now', ts, false) $$;
create function t_as(u uuid) returns void language sql as $$ select set_config('request.jwt.claim.sub', coalesce(u::text,''), false) $$;
create function t_code(j jsonb) returns text language sql as $$ select case when (j->>'ok')::boolean then 'ok' else j->>'code' end $$;
create function t_raises(q text) returns boolean language plpgsql as
$$ begin execute q; return false; exception when others then return true; end $$;
create function t_user(n text) returns uuid language plpgsql as $$
declare u uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (u, n || '@t.kr', jsonb_build_object('name', n, 'nickname', n, 'phone', '010', 'privacy_agreed', 'true'));
  return u;
end $$;
create function t_cnt(u uuid, c int, n int) returns void language sql as $$
  insert into checkins (user_id, cohort_no, checkin_date)
  select u, c, (select start_date from cohorts where no = c) + i from generate_series(0, n - 1) i $$;

-- 관리자 + 기수
select t_now('2026-09-29 12:00+09');
select t_user('admin') as admin \gset
update profiles set role = 'admin' where id = :'admin';
select t_as(:'admin');
select t_ok('가입 시 개인정보 동의 기록', (select count(*) from consents where user_id = :'admin' and type = 'privacy') = 1);
select t_ok('가입 동의 없으면 차단', t_raises($$insert into auth.users (email, raw_user_meta_data) values ('x@t.kr','{"name":"a","nickname":"a","phone":"1"}')$$));
select t_ok('40기 생성', t_code(admin_create_cohort(40,'2026-10-05','2026-11-01','2026-10-04 23:59+09')) = 'ok');
select t_ok('41기 생성', t_code(admin_create_cohort(41,'2026-11-02','2026-11-29',null)) = 'ok');
select t_ok('42기 생성', t_code(admin_create_cohort(42,'2026-11-30','2026-12-27',null)) = 'ok');
select t_ok('월요일 아닌 시작일 거절', t_code(admin_create_cohort(99,'2027-01-05','2027-02-01',null)) = 'bad_dates');
select t_ok('기간 겹침 거절', t_code(admin_create_cohort(43,'2026-12-21','2027-01-17',null)) in ('conflict','bad_dates'));
select t_ok('42기 뒤 제안: 43기 2027-01-04 (휴식 1주)', admin_suggest_next_cohort() = '{"ok":true,"no":43,"start_date":"2027-01-04","end_date":"2027-01-31"}'::jsonb);
select admin_create_cohort(43,'2027-01-04','2027-01-31',null), admin_create_cohort(44,'2027-02-01','2027-02-28',null), admin_create_cohort(45,'2027-03-01','2027-03-28',null);
select t_ok('44기 뒤 휴식 없음 / 45기 뒤 46기 2027-04-05', admin_suggest_next_cohort()->>'start_date' = '2027-04-05');

-- 설정(계좌/단톡방)
select admin_set_setting('bank_name','테스트은행'), admin_set_setting('bank_account','111-22'), admin_set_setting('bank_holder','운영자'),
       admin_set_setting('chat_url','https://open.kakao.com/x'), admin_set_setting('chat_password','pw1234');

-- 신청: 모집 닫힘/열림
select t_user('u1') as u1 \gset
select t_as(:'u1');
select t_ok('모집 비활성 기수 신청 차단', t_code(apply(40,'홍길동',true)) = 'not_recruiting');
select t_as(:'admin'); select admin_set_recruiting(40, true, null);
select t_as(:'u1');
select t_ok('참여 규정 미동의 차단', t_code(apply(40,'홍길동',false)) = 'terms_required');
select t_ok('신청 금액 3만원', (apply(40,'홍길동',true)->>'amount')::int = 30000);
select t_ok('재신청은 기존 신청 갱신(행 1개)', t_code(apply(40,'홍길동',true)) = 'ok' and (select count(*) from participations where user_id = :'u1') = 1 and (select count(*) from payments where user_id = :'u1') = 1);
select t_ok('입금 전 단톡방 비노출', get_home()->'chat' = 'null'::jsonb or get_home()->'chat' is null);
select t_ok('입금했어요', t_code(claim_payment('initial','홍길동')) = 'ok');
select t_as(:'admin');
select id as pay1 from payments where user_id = :'u1' \gset
select t_ok('입금 확인', t_code(admin_confirm_payment(:pay1)) = 'ok');
select t_ok('확인 후 잔액 2만/참가비 납부', (select deposit_balance = 20000 and fee_paid and status = 'active' from memberships where user_id = :'u1'));
select t_ok('원장 deposit_in 20000', (select sum(delta) from deposit_ledger where user_id = :'u1' and reason = 'deposit_in') = 20000);
select t_ok('이중 확인 차단', t_code(admin_confirm_payment(:pay1)) = 'bad_status');

-- 단톡방 노출: 토요일 00:00
select t_as(:'u1');
select t_now('2026-10-02 23:59:59+09');
select t_ok('토요일 전 단톡방 비노출', (get_home()->'chat') is null or get_home()->'chat' = 'null'::jsonb);
select t_now('2026-10-03 00:00:00+09');
select t_ok('토요일 00:00 단톡방 노출', get_home()->'chat'->>'url' = 'https://open.kakao.com/x');
select t_ok('습관 설정', t_code(set_habits(40, array['운동','독서','','명상','초과'])) = 'ok');
select t_ok('습관 최대 3개', (select habit3 = '명상' from participations where user_id = :'u1'));

-- 인증 시간 경계
select t_now('2026-10-05 06:59:00+09'); select t_ok('06:59 차단', t_code(check_in()) = 'outside_time');
select t_now('2026-10-05 07:00:00+09'); select t_ok('07:00 허용', t_code(check_in()) = 'ok');
select t_ok('하루 2회 차단', t_code(check_in()) = 'already_checked');
select t_ok('홈: 오늘 인증 완료 표시', (get_home()->>'checked_today')::boolean and not (get_home()->>'can_checkin')::boolean);
select t_now('2026-10-06 23:59:00+09'); select t_ok('23:59 허용', t_code(check_in()) = 'ok');
select t_now('2026-10-06 23:59:59+09'); select t_ok('23:59:59 이미 인증(시간대는 통과)', t_code(check_in()) = 'already_checked');
select t_now('2026-10-07 00:00:00+09'); select t_ok('00:00 차단', t_code(check_in()) = 'outside_time');
select t_now('2026-10-06 12:00+09');    select t_ok('클라이언트 무관: 게이지 2/20 = 10%', (get_home()->>'percent')::int = 10 and (get_home()->>'count')::int = 2);
select t_now('2026-10-04 08:00+09');    select t_ok('시작 전(시간대 OK) 인증 차단', t_code(check_in()) = 'no_active_cohort');
select t_now('2026-11-02 08:00+09');    select t_ok('기수 종료 후 인증 차단', t_code(check_in()) = 'no_active_cohort');

-- 미납/무효/종료 회원 인증 차단
select t_now('2026-10-05 08:00+09');
select t_user('unpaid') as unpaid \gset
select t_as(:'unpaid'); select apply(40,'미납',true);
select t_now('2026-10-01 09:00+09'); select apply(40,'미납',true);
select t_now('2026-10-05 08:00+09');
select t_ok('미납(pending_payment) 인증 차단', t_code(check_in()) = 'payment_pending');
select t_ok('시작 후 신규 신청 차단', t_code(apply(40,'x',true)) in ('not_recruiting','already_applied'));

-- 이관(A7) + 정산 경계 17/18/19/20
select t_as(:'admin');
select t_ok('이관 등록', (admin_import_members('[
 {"name":"n17","nickname":"n17","phone":"1","email":"n17@t.kr","deposit_balance":20000,"fee_paid":true,"cohort_no":40},
 {"name":"n18","nickname":"n18","phone":"1","email":"n18@t.kr","deposit_balance":20000,"fee_paid":true,"cohort_no":40},
 {"name":"n19","nickname":"n19","phone":"1","email":"n19@t.kr","deposit_balance":20000,"fee_paid":true,"cohort_no":40},
 {"name":"n20","nickname":"n20","phone":"1","email":"n20@t.kr","deposit_balance":20000,"fee_paid":true,"cohort_no":40},
 {"name":"stop","nickname":"stop","phone":"1","email":"stop@t.kr","deposit_balance":20000,"fee_paid":true,"cohort_no":40},
 {"name":"gone","nickname":"gone","phone":"1","email":"gone@t.kr","deposit_balance":20000,"fee_paid":true,"cohort_no":40}]'::jsonb)->>'rows')::int = 6);
select t_user('n17') as n17, t_user('n18') as n18, t_user('n19') as n19, t_user('n20') as n20, t_user('stop') as ustop, t_user('gone') as ugone \gset
select t_ok('같은 이메일 가입 시 자동 연결', (select count(*) from participations where cohort_no = 40 and status = 'active' and user_id in (:'n17',:'n18',:'n19',:'n20')) = 4);
select t_cnt(:'n17',40,17), t_cnt(:'n18',40,18), t_cnt(:'n19',40,19), t_cnt(:'n20',40,20), t_cnt(:'ustop',40,20), t_cnt(:'ugone',40,3);
insert into checkins select :'u1', 40, d::date, now() from generate_series('2026-10-05'::date,'2026-10-24'::date,'1 day') d on conflict do nothing;

-- 중단 신청 경계 (stop 사용자)
select t_as(:'ustop');
select t_now('2026-10-28 12:00+09'); select t_ok('24일차 중단 차단', t_code(request_stop('은행','123','홍')) = 'too_early');
select t_now('2026-10-29 12:00+09'); select t_ok('25일차 중단 허용', t_code(request_stop('은행','123','홍')) = 'ok');
select t_ok('취소 가능(28일차 이전)', t_code(cancel_stop()) = 'ok');
select t_ok('취소 후 계좌 삭제', (select refund_account is null and not stop_requested from memberships where user_id = :'ustop'));
select request_stop('은행','123','홍');
select t_now('2026-11-01 23:59:00+09'); select t_ok('28일차 23:59 중단 유지', (select stop_requested from memberships where user_id = :'ustop'));
select t_now('2026-11-02 08:00+09');
select t_ok('28일차 이후 중단 차단', t_code(request_stop('은행','123','홍')) = 'no_active_cohort');
select t_as(:'n17');
select t_ok('25일차 이전/이후 일반 사용자 정산 함수 차단', t_raises('select finalize_cohort(40)'));

-- 정산
select t_as(:'admin');
select t_now('2026-11-01 23:59+09'); select t_ok('종료 전 정산 차단', t_code(finalize_cohort(40)) = 'not_ended');
select t_now('2026-11-02 00:10+09');
select t_ok('정산 실행', t_code(finalize_cohort(40)) = 'ok');
select t_ok('17회 = fail', (select result from participations where user_id = :'n17' and cohort_no = 40) = 'fail');
select t_ok('18회 = partial', (select result from participations where user_id = :'n18' and cohort_no = 40) = 'partial');
select t_ok('19회 = partial', (select result from participations where user_id = :'n19' and cohort_no = 40) = 'partial');
select t_ok('20회 = success', (select result from participations where user_id = :'n20' and cohort_no = 40) = 'success');
select t_ok('잔액: 17→0, 18→1만, 19→1만, 20→2만',
  (select array_agg(deposit_balance order by name) from memberships join profiles on id = user_id where user_id in (:'n17',:'n18',:'n19',:'n20')) = array[0,10000,10000,20000]);
select t_ok('성공자 다음 기수 자동 연장(active, 추가 납부 없음)', (select status from participations where user_id = :'n20' and cohort_no = 41) = 'active'
  and not exists (select 1 from payments where user_id = :'n20' and cohort_no = 41));
select t_ok('부분환급 재납부 1만원 + 기한 수요일 23:59:59', exists (select 1 from payments where user_id = :'n19' and cohort_no = 41 and kind = 'topup' and amount = 10000)
  and (select status = 'topup_pending' and topup_due_at = '2026-11-04 23:59:59+09' from participations where user_id = :'n19' and cohort_no = 41));
select t_ok('미달 재납부 2만원', exists (select 1 from payments where user_id = :'n17' and cohort_no = 41 and kind = 'topup' and amount = 20000));
select t_ok('원장 forfeit 합계 = -(2+1+1+2[gone 3회])만', (select sum(delta) from deposit_ledger where reason = 'forfeit') = -60000);
select t_ok('u1(20회) 성공', (select result from participations where user_id = :'u1' and cohort_no = 40) = 'success');
select t_ok('미납 신청자 정산 시 무효', (select status from participations where user_id = :'unpaid' and cohort_no = 40) = 'void');
select t_ok('중단 신청자: 종료 + 환급 대기', (select status = 'ended' and refund_requested_at is not null and deposit_balance = 20000 from memberships where user_id = :'ustop'));
select t_ok('중단 신청자 다음 기수 참여 없음', not exists (select 1 from participations where user_id = :'ustop' and cohort_no = 41));
-- 멱등
select count(*) as led from deposit_ledger \gset
select count(*) as par from participations \gset
select t_ok('중복 정산 무해(already)', finalize_cohort(40)->>'already' = 'true');
select t_ok('중복 정산 후 원장/참여 불변', (select count(*) from deposit_ledger) = :led and (select count(*) from participations) = :par);

-- 재납부: 기한 내/초과
select t_now('2026-11-03 12:00+09');
select t_as(:'n19'); select t_ok('재납부 입금했어요', t_code(claim_payment('topup','n19')) = 'ok');
select t_ok('topup_pending 도 인증 허용', t_code(check_in()) = 'ok');
select t_as(:'admin'); select id as pay19 from payments where user_id = :'n19' and kind = 'topup' \gset
select t_ok('재납부 확인', t_code(admin_confirm_payment(:pay19)) = 'ok');
select t_ok('재납부 후 잔액 2만 + active', (select deposit_balance = 20000 from memberships where user_id = :'n19') and (select status = 'active' from participations where user_id = :'n19' and cohort_no = 41));
select t_now('2026-11-04 23:59:30+09'); select t_ok('기한 당일 23:59:30 만료 아님', expire_unpaid() = 0);
-- n18: 입금했어요만 누르고 미확인 → 만료 보류. n17: 미납 → 만료
select t_as(:'n18'); select claim_payment('topup','n18');
select t_now('2026-11-05 00:00:01+09');
select t_ok('기한 초과 미납만 무효(n17, gone), 확인 대기(n18) 보류', expire_unpaid() = 2);
select t_ok('n17 void + 회원 종료 + 잔액 유지', (select status = 'void' from participations where user_id = :'n17' and cohort_no = 41)
  and (select status = 'ended' and deposit_balance = 0 from memberships where user_id = :'n17'));
select t_as(:'admin'); select id as pay17t from payments where user_id = :'n17' and kind = 'topup' \gset
select t_ok('무효 처리된 참여의 재납부 확인 차단', t_code(admin_confirm_payment(:pay17t)) = 'expired');
select t_as(:'n17'); select t_ok('무효 회원 인증 차단', t_code(check_in()) in ('not_eligible','outside_time'));
select t_now('2026-11-05 09:00+09'); select t_ok('무효 회원 인증 차단(시간대 OK)', t_code(check_in()) = 'not_eligible');

-- 환급: 무효로 종료된 잔액 보유자(n17은 0원이라 대상 아님) → n18 을 만료시켜 검증
select t_ok('잔액 0 은 환급 신청 불가', t_code(request_refund('은행','1','홍')) = 'not_refundable');
select t_as(:'admin'); select id as pay18 from payments where user_id = :'n18' and kind = 'topup' \gset
update payments set status = 'awaiting' where id = :pay18;   -- 미확인 상태로 되돌려 만료 유도
select t_ok('n18 만료', expire_unpaid() = 1);
select t_as(:'n18');
select t_ok('환급 신청(잔액 1만)', t_code(request_refund('은행','9-9','김')) = 'ok');
select t_as(:'admin');
select t_ok('환급 완료 처리', t_code(admin_mark_refunded(:'n18')) = 'ok');
select t_ok('환급 후 계좌 삭제 + 잔액 0 + refund_out', (select refund_account is null and deposit_balance = 0 and refund_done_at is not null from memberships where user_id = :'n18')
  and (select delta from deposit_ledger where user_id = :'n18' and reason = 'refund_out') = -10000);
select t_ok('중단자 환급 완료', t_code(admin_mark_refunded(:'ustop')) = 'ok');
select t_ok('중단자 계좌 삭제', (select refund_account is null and refund_done_at is not null from memberships where user_id = :'ustop'));
-- 환급 신청 기간(90일) + 환급 미완료 재가입 차단
update memberships set status='ended', deposit_balance=10000, ended_at='2026-11-05+09', refund_requested_at=null, refund_done_at=null, stop_requested=false where user_id = :'ugone';
select t_now('2026-11-06 12:00+09');
select t_as(:'admin'); select admin_set_recruiting(42, true, '2026-11-29 23:59+09');
select t_as(:'ugone'); select update_nickname('새닉');
select t_ok('닉네임 변경 이력', (select count(*) from nickname_history where user_id = :'ugone' and new_nickname = '새닉') = 1);
select t_ok('종료 90일 이내 환급 신청 가능', t_code(request_refund('은','1','고')) = 'ok');
select t_ok('환급 미완료 재가입 차단', t_code(apply(42,'gone',true)) = 'refund_pending');
update memberships set refund_requested_at = null where user_id = :'ugone';
select t_now('2027-02-03 00:00+09'); select t_ok('정확히 90일째 신청 가능', t_code(request_refund('은','1','고')) = 'ok');
update memberships set refund_requested_at = null where user_id = :'ugone';
select t_now('2027-02-03 00:00:01+09'); select t_ok('90일 초과 차단', t_code(request_refund('은','1','고')) = 'claim_expired');

-- 재가입 금액 = 참가비 + 부족분 (n18: 환급 완료로 잔액 0 → 3만원 / 잔액 있는 종료자 → 부족분)
select t_now('2026-11-06 12:00+09');
select t_as(:'n18'); select t_ok('재가입 신청 금액 3만원(잔액 0)', (apply(42,'n18',true)->>'amount')::int = 30000);
update memberships set status='ended', deposit_balance=10000, refund_requested_at=null, refund_done_at=null, ended_at=app_now() where user_id = :'n17';
select t_as(:'n17'); select t_ok('재가입 금액 = 참가비 1만 + (2만-잔액 1만) = 2만', (apply(42,'n17',true)->>'amount')::int = 20000);
select t_as(:'admin'); select id as pay17 from payments where user_id = :'n17' and cohort_no = 42 \gset
select t_ok('재가입 입금 확인 → 잔액 2만', t_code(admin_confirm_payment(:pay17)) = 'ok' and true);
select t_ok('재가입 후 잔액 2만·참가비 납부', (select deposit_balance = 20000 and fee_paid and status = 'active' from memberships where user_id = :'n17'));

-- 시트 연동 토큰
select t_as(:'admin');
select t_ok('약한 토큰 거절', t_code(admin_set_export_token('short')) = 'weak_token');
select admin_set_export_token('abcdefghijklmnopqrstuvwxyz012345');
select t_ok('토큰 없이 export 차단', t_raises($$select export_data(null)$$) and t_raises($$select export_data('wrong')$$));
select t_ok('정상 토큰 export, 계좌번호 미포함', (export_data('abcdefghijklmnopqrstuvwxyz012345')::text not like '%refund_account%')
  and jsonb_array_length(export_data('abcdefghijklmnopqrstuvwxyz012345')->'participants') > 0);
select t_ok('settings 에 토큰 평문 없음', (select value from settings where key = 'export_token_hash') not like '%abcdef%');

-- ───────── RLS / 권한 (실제 role 전환) ─────────
select t_as(:'n20');
set role authenticated;
select t_ok('RLS: 내 payments 만 조회', (select count(*) from payments where user_id <> auth.uid()) = 0);
select t_ok('RLS: 타인 memberships 0건', (select count(*) from memberships where user_id <> auth.uid()) = 0);
select t_ok('RLS: 타인 checkins 0건', (select count(*) from checkins where user_id <> auth.uid()) = 0);
select t_ok('RLS: settings 조회 불가(0건)', (select count(*) from settings) = 0);
select t_ok('RLS: profiles 는 본인만', (select count(*) from profiles) = 1);
select t_ok('직접 INSERT checkins 차단', t_raises($$insert into checkins values (auth.uid(), 41, '2026-11-03', now())$$));
select t_ok('직접 UPDATE memberships 차단', t_raises($$update memberships set deposit_balance = 99999 where user_id = auth.uid()$$));
select t_ok('직접 role 상승 차단', t_raises($$update profiles set role = 'admin' where id = auth.uid()$$));
select t_ok('관리자 RPC 차단: confirm', t_raises('select admin_confirm_payment(1)'));
select t_ok('관리자 RPC 차단: finalize', t_raises('select finalize_cohort(41)'));
select t_ok('관리자 RPC 차단: setting', t_raises($$select admin_set_setting('bank_account','x')$$));
select t_ok('관리자 RPC 차단: import', t_raises($$select admin_import_members('[]')$$));
select t_ok('내부 함수 직접 호출 차단', t_raises('select expire_unpaid()') and t_raises('select roll_over(40)') and t_raises('select export_data(''x'')'));
reset role;
select t_as(:'admin'); set role authenticated;
select t_ok('관리자는 settings/타인 데이터 조회', (select count(*) from settings) > 0 and (select count(*) from profiles) > 5);
reset role;
set role anon;
select t_ok('anon: 테이블 조회 불가', t_raises('select * from profiles') and t_raises('select * from cohorts'));
select t_ok('anon: get_public_info 허용', get_public_info() ? 'operator_name');
select t_ok('anon: 인증 RPC 차단', t_raises('select check_in()'));
reset role;

-- 결과
select count(*) filter (where not ok) as failed, count(*) as total from t_res \gset
\echo ===== :total 건 중 실패 :failed 건 =====
select name from t_res where not ok;
do $$ begin if (select count(*) from t_res where not ok) > 0 then raise exception '테스트 실패'; end if; end $$;
