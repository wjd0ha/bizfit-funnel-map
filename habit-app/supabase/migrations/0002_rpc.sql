-- 부행일치 1단계: 핵심 로직 (SECURITY DEFINER RPC)
-- 업무상 거절은 jsonb {ok:false, code, message} 로 반환, 권한 오류는 예외(42501).

create or replace function fail(p_code text, p_msg text) returns jsonb
language sql immutable as $$ select jsonb_build_object('ok', false, 'code', p_code, 'message', p_msg) $$;

create or replace function require_admin() returns void
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
end $$;

-- 관리자 또는 스케줄러(auth.uid() 없음)만 통과
create or replace function require_admin_or_cron() returns void
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if auth.uid() is not null and not is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

create or replace function require_user() returns uuid
language plpgsql stable as $$
#variable_conflict use_column
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  return auth.uid();
end $$;

-- ───────── 내부 헬퍼 ─────────
-- 다음 기수 참여 생성. 잔액 < 보증금이면 topup_pending + 재납부 안내 행 생성.
create or replace function make_participation(p_user uuid, p_cohort int, p_h1 text, p_h2 text, p_h3 text)
returns void language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare bal int; dep int := setting_int('deposit_amount'); c cohorts;
begin
  select deposit_balance into bal from memberships where user_id = p_user;
  select * into c from cohorts where no = p_cohort;
  if bal >= dep then
    insert into participations (user_id, cohort_no, status, habit1, habit2, habit3)
      values (p_user, p_cohort, 'active', p_h1, p_h2, p_h3) on conflict do nothing;
  else
    insert into participations (user_id, cohort_no, status, topup_due_at, habit1, habit2, habit3)
      values (p_user, p_cohort, 'topup_pending',
              -- 다음 기수 시작일 + grace일 23:59:59 (KST)
              ((c.start_date + setting_int('topup_grace_days'))::timestamp + interval '23 hours 59 minutes 59 seconds') at time zone 'Asia/Seoul',
              p_h1, p_h2, p_h3)
      on conflict do nothing;
    if found then
      insert into payments (user_id, cohort_no, kind, amount) values (p_user, p_cohort, 'topup', dep - bal);
    end if;
  end if;
end $$;

-- 이관 연결: 같은 이메일의 pending_imports 가 있으면 회원/참여 생성
create or replace function link_import(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare pi pending_imports; em text;
begin
  select email into em from profiles where id = p_user;
  select * into pi from pending_imports where email = lower(em) and linked_at is null for update;
  if not found then return false; end if;
  if exists (select 1 from memberships where user_id = p_user) then return false; end if;
  insert into memberships (user_id, status, fee_paid, deposit_balance)
    values (p_user, 'active', pi.fee_paid, pi.deposit_balance);
  if pi.deposit_balance > 0 then
    insert into deposit_ledger (user_id, cohort_no, delta, reason) values (p_user, pi.cohort_no, pi.deposit_balance, 'deposit_in');
  end if;
  perform make_participation(p_user, pi.cohort_no, null, null, null);
  update pending_imports set linked_at = app_now() where email = pi.email;
  return true;
end $$;

-- 재납부 기한 경과 + 미납 → 무효 처리, 회원 종료 (cron 전용)
-- 참가자가 "입금했어요"를 눌러 운영자 확인 대기(claimed) 중이면 무효 처리하지 않는다.
create or replace function expire_unpaid() returns int
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare r record; n int := 0;
begin
  for r in
    select p.user_id, p.cohort_no from participations p
    where p.status = 'topup_pending' and p.topup_due_at < app_now()
      and not exists (select 1 from payments y where y.user_id = p.user_id and y.cohort_no = p.cohort_no
                      and y.kind = 'topup' and y.status = 'claimed')
    for update
  loop
    update participations set status = 'void' where user_id = r.user_id and cohort_no = r.cohort_no;
    update memberships set status = 'ended', ended_at = app_now(), stop_requested = false where user_id = r.user_id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- 정산이 끝난 기수의 계속 참가자에게 다음 기수 참여 생성 (멱등)
create or replace function roll_over(p_cohort int) returns int
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare nxt int; r record; n int := 0;
begin
  if not exists (select 1 from cohorts where no = p_cohort and finalized_at is not null) then return 0; end if;
  select min(no) into nxt from cohorts where no > p_cohort;
  if nxt is null then return 0; end if;
  for r in
    select p.user_id, p.habit1, p.habit2, p.habit3 from participations p
    join memberships m using (user_id)
    where p.cohort_no = p_cohort and p.status <> 'void' and p.result <> 'pending'
      and m.status = 'active' and not m.stop_requested
      and not exists (select 1 from participations q where q.user_id = p.user_id and q.cohort_no = nxt)
  loop
    perform make_participation(r.user_id, nxt, r.habit1, r.habit2, r.habit3);  -- 습관은 직전 기수에서 복사
    n := n + 1;
  end loop;
  return n;
end $$;

-- ───────── 사용자 RPC ─────────
create or replace function get_public_info() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('operator_name', setting('operator_name'),
    'operator_contact_email', setting('operator_contact_email'),
    'terms_version', setting('terms_version'), 'privacy_version', setting('privacy_version'),
    'fee_amount', setting_int('fee_amount'), 'deposit_amount', setting_int('deposit_amount'),
    'checkin_start', setting('checkin_start'), 'checkin_end', setting('checkin_end'))
$$;

create or replace function update_nickname(p_new text) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); old text; nn text := trim(coalesce(p_new,''));
begin
  if char_length(nn) not between 1 and 20 then return fail('invalid_nickname','닉네임은 1~20자입니다'); end if;
  select nickname into old from profiles where id = uid for update;
  if old = nn then return jsonb_build_object('ok', true); end if;
  update profiles set nickname = nn where id = uid;
  insert into nickname_history (user_id, old_nickname, new_nickname) values (uid, old, nn);
  return jsonb_build_object('ok', true);
end $$;

-- S2: 신청 화면용. 모집 중 기수 + 내가 낼 금액 + 입금 계좌
create or replace function get_apply_info() returns jsonb
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); m memberships; amt int; fee int := setting_int('fee_amount'); dep int := setting_int('deposit_amount');
begin
  select * into m from memberships where user_id = uid;
  amt := fee + dep - case when m.status = 'ended' then coalesce(m.deposit_balance,0) else 0 end;
  return jsonb_build_object('amount', amt,
    'cohorts', coalesce((select jsonb_agg(jsonb_build_object('no', no, 'start_date', start_date, 'end_date', end_date, 'apply_deadline', apply_deadline) order by no)
        from cohorts where recruiting_open and (apply_deadline is null or app_now() <= apply_deadline) and kst_today() < start_date), '[]'::jsonb),
    'bank_name', setting('bank_name'), 'bank_account', setting('bank_account'), 'bank_holder', setting('bank_holder'));
end $$;

create or replace function apply(p_cohort_no int, p_depositor_name text, p_terms_agreed boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); c cohorts; m memberships; amt int;
        fee int := setting_int('fee_amount'); dep int := setting_int('deposit_amount'); dn text := trim(coalesce(p_depositor_name,''));
begin
  if not coalesce(p_terms_agreed,false) then return fail('terms_required','참여 규정 동의가 필요합니다'); end if;
  if dn = '' then return fail('depositor_required','입금자명을 입력하세요'); end if;
  select * into c from cohorts where no = p_cohort_no;
  if not found or not c.recruiting_open or (c.apply_deadline is not null and app_now() > c.apply_deadline)
     or kst_today() >= c.start_date then
    return fail('not_recruiting','모집 중인 기수가 아닙니다');
  end if;
  select * into m from memberships where user_id = uid for update;
  if not found then
    insert into memberships (user_id, status) values (uid, 'applied');
    amt := fee + dep;
  elsif m.status = 'active' then
    return fail('already_member','이미 참가 중입니다(중단 신청이 없으면 자동 연장됩니다)');
  elsif m.status = 'ended' then
    if m.refund_requested_at is not null and m.refund_done_at is null then
      return fail('refund_pending','환급 처리가 끝난 뒤 다시 신청할 수 있습니다');
    end if;
    -- 재가입: 참가비 다시 + 보증금은 잔액을 뺀 부족분
    update memberships set status = 'applied', fee_paid = false, stop_requested = false, ended_at = null where user_id = uid;
    amt := fee + dep - m.deposit_balance;
  else
    if exists (select 1 from participations where user_id = uid and status = 'pending_payment' and cohort_no <> p_cohort_no) then
      return fail('already_applied','이미 다른 기수에 신청했습니다');
    end if;
    amt := fee + dep;
  end if;
  insert into participations (user_id, cohort_no, status) values (uid, p_cohort_no, 'pending_payment')
    on conflict (user_id, cohort_no) do update set status = 'pending_payment', topup_due_at = null, result = 'pending'
    where participations.status in ('void','pending_payment');
  if not found then return fail('already_applied','이미 신청한 기수입니다'); end if;
  delete from payments where user_id = uid and cohort_no = p_cohort_no and kind = 'initial' and status in ('awaiting','rejected');
  insert into payments (user_id, cohort_no, kind, amount, depositor_name) values (uid, p_cohort_no, 'initial', amt, dn);
  insert into consents (user_id, type, version) values (uid, 'terms', setting('terms_version'));
  return jsonb_build_object('ok', true, 'amount', amt, 'bank_name', setting('bank_name'),
    'bank_account', setting('bank_account'), 'bank_holder', setting('bank_holder'));
end $$;

create or replace function claim_payment(p_kind text, p_depositor_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); pid bigint; dn text := trim(coalesce(p_depositor_name,''));
begin
  if dn = '' then return fail('depositor_required','입금자명을 입력하세요'); end if;
  select id into pid from payments where user_id = uid and kind = p_kind and status in ('awaiting','rejected')
    order by id desc limit 1 for update;
  if pid is null then return fail('no_payment','입금 안내 내역이 없습니다'); end if;
  update payments set status = 'claimed', depositor_name = dn where id = pid;
  return jsonb_build_object('ok', true);
end $$;

-- S4: 습관 설정. 기수 1일차 23:59까지(=시작일 다음날 00:00 전) 수정 가능
create or replace function set_habits(p_cohort_no int, p_habits text[]) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); c cohorts; h text[]; 
begin
  select * into c from cohorts where no = p_cohort_no;
  if not exists (select 1 from participations where user_id = uid and cohort_no = p_cohort_no and status <> 'void') then
    return fail('no_participation','참여 내역이 없습니다');
  end if;
  if kst_today() > c.start_date then return fail('habits_locked','습관은 기수 1일차 23:59까지만 수정할 수 있습니다'); end if;
  select coalesce(array_agg(t), '{}') into h from (select trim(x) t from unnest(p_habits) x where trim(coalesce(x,'')) <> '' limit 3) s;
  if array_length(h,1) is null then return fail('habit_required','습관을 1~3개 입력하세요'); end if;
  update participations set habit1 = h[1], habit2 = h[2], habit3 = h[3] where user_id = uid and cohort_no = p_cohort_no;
  return jsonb_build_object('ok', true);
end $$;

create or replace function check_in() returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); today date := kst_today(); t time := kst_time(); p participations; m memberships; n int; rc int;
begin
  -- 07:00 ~ 23:59(해당 분 끝까지). 클라이언트 시계는 쓰지 않는다.
  if not (t >= setting('checkin_start')::time and t <= setting('checkin_end')::time + interval '59.999999 seconds') then
    return fail('outside_time', '인증 가능 시간은 ' || setting('checkin_start') || '~' || setting('checkin_end') || ' 입니다');
  end if;
  select p.* into p from participations p join cohorts c on c.no = p.cohort_no
    where p.user_id = uid and today between c.start_date and c.end_date;
  if not found then return fail('no_active_cohort','진행 중인 기수가 없습니다'); end if;
  select * into m from memberships where user_id = uid;
  if m.status = 'ended' or p.status = 'void' then return fail('not_eligible','참여가 종료되었거나 무효 처리되었습니다'); end if;
  if p.status = 'pending_payment' then return fail('payment_pending','입금 확인 후 인증할 수 있습니다'); end if;
  insert into checkins (user_id, cohort_no, checkin_date) values (uid, p.cohort_no, today) on conflict do nothing;
  get diagnostics rc = row_count;
  select count(*) into n from checkins where user_id = uid and cohort_no = p.cohort_no;
  if rc = 0 then return jsonb_build_object('ok', false, 'code', 'already_checked', 'message', '이미 인증했습니다', 'count', n); end if;
  return jsonb_build_object('ok', true, 'count', n);
end $$;

-- S5 홈
create or replace function get_home() returns jsonb
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); today date := kst_today(); t time := kst_time();
  p participations; c cohorts; m memberships; n int := 0; goal int := setting_int('success_min');
  phase text; in_time boolean; done boolean := false; chat jsonb := null; nxt date; day_no int;
begin
  select * into m from memberships where user_id = uid;
  if not found then return jsonb_build_object('phase','none'); end if;
  -- 오늘 진행 중인 참여, 없으면 다가오는 첫 참여
  select p.* into p from participations p join cohorts c on c.no = p.cohort_no
    where p.user_id = uid and p.status <> 'void' and c.end_date >= today order by c.start_date limit 1;
  if not found then
    select min(start_date) into nxt from cohorts where start_date > today;
    return jsonb_build_object('phase', case when m.status = 'ended' then 'ended' else 'none' end,
      'membership_status', m.status, 'next_cohort_start', nxt);
  end if;
  select * into c from cohorts where no = p.cohort_no;
  select count(*) into n from checkins where user_id = uid and cohort_no = p.cohort_no;
  if today < c.start_date then phase := 'before_start';
  else phase := 'in_cohort'; day_no := today - c.start_date + 1; end if;
  select exists (select 1 from checkins where user_id = uid and cohort_no = p.cohort_no and checkin_date = today) into done;
  in_time := t >= setting('checkin_start')::time and t <= setting('checkin_end')::time + interval '59.999999 seconds';
  if p.status in ('active','topup_pending') and today >= c.start_date - setting_int('chat_open_days_before') then
    chat := jsonb_build_object('url', setting('chat_url'), 'password', setting('chat_password'));
  end if;
  if phase = 'before_start' then
    select min(start_date) into nxt from cohorts where no = c.no;
  end if;
  return jsonb_build_object('phase', phase, 'cohort_no', c.no, 'start_date', c.start_date, 'end_date', c.end_date,
    'day_no', day_no, 'days_left', greatest(c.end_date - today, 0),
    'habits', to_jsonb(array_remove(array[p.habit1, p.habit2, p.habit3], null)),
    'count', n, 'goal', goal, 'percent', round(least(n::numeric / goal, 1) * 100),
    'checked_today', done,
    'can_checkin', phase = 'in_cohort' and p.status in ('active','topup_pending') and m.status <> 'ended' and in_time and not done,
    'participation_status', p.status, 'topup_due_at', p.topup_due_at, 'membership_status', m.status,
    'next_cohort_start', case when phase = 'before_start' then c.start_date else (select min(start_date) from cohorts where start_date > today) end,
    'chat', chat);
end $$;

-- S6 진행 현황
create or replace function get_progress(p_cohort_no int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); c cohorts; n int;
begin
  select * into c from cohorts where no = p_cohort_no;
  select count(*) into n from checkins where user_id = uid and cohort_no = p_cohort_no;
  return jsonb_build_object('start_date', c.start_date, 'end_date', c.end_date, 'count', n,
    'remaining_to_goal', greatest(setting_int('success_min') - n, 0),
    'success_min', setting_int('success_min'), 'partial_min', setting_int('partial_min'),
    'dates', coalesce((select jsonb_agg(checkin_date order by checkin_date) from checkins where user_id = uid and cohort_no = p_cohort_no), '[]'::jsonb));
end $$;

-- 25~28일차에만 가능. 종료일 23:59까지 취소 가능
create or replace function request_stop(p_bank text, p_account text, p_holder text) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); today date := kst_today(); c cohorts; p participations;
begin
  if coalesce(trim(p_bank),'') = '' or coalesce(trim(p_account),'') = '' or coalesce(trim(p_holder),'') = '' then
    return fail('account_required','환급계좌를 모두 입력하세요');
  end if;
  select p.* into p from participations p join cohorts c on c.no = p.cohort_no
    where p.user_id = uid and p.status in ('active','topup_pending') and today between c.start_date and c.end_date;
  if not found then return fail('no_active_cohort','진행 중인 기수가 없습니다'); end if;
  select * into c from cohorts where no = p.cohort_no;
  if today - c.start_date + 1 < setting_int('stop_from_day') then
    return fail('too_early', setting('stop_from_day') || '일차부터 신청할 수 있습니다');
  end if;
  update memberships set stop_requested = true, refund_bank = trim(p_bank), refund_account = trim(p_account), refund_holder = trim(p_holder)
    where user_id = uid;
  return jsonb_build_object('ok', true);
end $$;

create or replace function cancel_stop() returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); today date := kst_today();
begin
  if not exists (select 1 from participations p join cohorts c on c.no = p.cohort_no
       where p.user_id = uid and p.status in ('active','topup_pending') and today between c.start_date and c.end_date) then
    return fail('too_late','중단 신청을 취소할 수 없습니다');
  end if;
  update memberships set stop_requested = false, refund_bank = null, refund_account = null, refund_holder = null
    where user_id = uid and refund_requested_at is null;
  return jsonb_build_object('ok', true);
end $$;

create or replace function request_refund(p_bank text, p_account text, p_holder text) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare uid uuid := require_user(); m memberships;
begin
  if coalesce(trim(p_bank),'') = '' or coalesce(trim(p_account),'') = '' or coalesce(trim(p_holder),'') = '' then
    return fail('account_required','환급계좌를 모두 입력하세요');
  end if;
  select * into m from memberships where user_id = uid for update;
  if not found or m.status <> 'ended' or m.deposit_balance <= 0 then
    return fail('not_refundable','환급 대상이 아닙니다');
  end if;
  if app_now() > m.ended_at + make_interval(days => setting_int('refund_claim_days')) then
    return fail('claim_expired','환급 신청 기간이 지났습니다');
  end if;
  update memberships set refund_bank = trim(p_bank), refund_account = trim(p_account), refund_holder = trim(p_holder),
    refund_requested_at = app_now(), refund_done_at = null where user_id = uid;
  return jsonb_build_object('ok', true, 'amount', m.deposit_balance);
end $$;

-- ───────── 정산 ─────────
create or replace function finalize_cohort(p_cohort_no int) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c cohorts; r record; n int; res text; bal int; forfeit int; cnt int := 0; rolled int;
begin
  perform require_admin_or_cron();
  select * into c from cohorts where no = p_cohort_no for update;
  if not found then return fail('no_cohort','기수가 없습니다'); end if;
  if c.finalized_at is not null then return jsonb_build_object('ok', true, 'already', true); end if;
  if kst_today() <= c.end_date then return fail('not_ended','기수가 아직 끝나지 않았습니다'); end if;

  perform expire_unpaid();
  for r in select p.*, m.stop_requested, m.deposit_balance from participations p join memberships m using (user_id)
           where p.cohort_no = p_cohort_no and p.status in ('active','pending_payment','topup_pending') order by p.user_id for update of p, m
  loop
    if r.status <> 'active' then
      -- 입금 확인이 끝나지 않은 참여는 정산하지 않고 무효 처리
      update participations set status = 'void' where user_id = r.user_id and cohort_no = p_cohort_no;
      update memberships set status = 'ended', ended_at = app_now(), stop_requested = false where user_id = r.user_id and status <> 'ended';
      continue;
    end if;
    select count(*) into n from checkins where user_id = r.user_id and cohort_no = p_cohort_no;
    res := case when n >= setting_int('success_min') then 'success' when n >= setting_int('partial_min') then 'partial' else 'fail' end;
    forfeit := case res when 'partial' then setting_int('partial_forfeit') when 'fail' then setting_int('deposit_amount') else 0 end;
    forfeit := least(forfeit, r.deposit_balance);
    if forfeit > 0 then
      update memberships set deposit_balance = deposit_balance - forfeit where user_id = r.user_id;
      insert into deposit_ledger (user_id, cohort_no, delta, reason) values (r.user_id, p_cohort_no, -forfeit, 'forfeit');
    end if;
    update participations set result = res where user_id = r.user_id and cohort_no = p_cohort_no;
    if r.stop_requested then
      select deposit_balance into bal from memberships where user_id = r.user_id;
      update memberships set status = 'ended', ended_at = app_now(),
        refund_requested_at = case when bal > 0 then app_now() end,
        refund_bank = case when bal > 0 then refund_bank end, refund_account = case when bal > 0 then refund_account end,
        refund_holder = case when bal > 0 then refund_holder end
        where user_id = r.user_id;
    end if;
    cnt := cnt + 1;
  end loop;
  update cohorts set finalized_at = app_now() where no = p_cohort_no;
  rolled := roll_over(p_cohort_no);
  return jsonb_build_object('ok', true, 'settled', cnt, 'rolled_over', rolled);
end $$;

-- cron: 종료됐지만 미정산인 기수 정산
create or replace function finalize_due_cohorts() returns int
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare r record; n int := 0;
begin
  for r in select no from cohorts where finalized_at is null and end_date < kst_today() order by no loop
    perform finalize_cohort(r.no); n := n + 1;
  end loop;
  return n;
end $$;

-- ───────── 관리자 RPC ─────────
create or replace function admin_confirm_payment(p_payment_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare y payments; m memberships; dep int := setting_int('deposit_amount');
begin
  perform require_admin();
  select * into y from payments where id = p_payment_id for update;
  if not found then return fail('no_payment','입금 내역이 없습니다'); end if;
  if y.status not in ('claimed','awaiting') then return fail('bad_status','확인할 수 없는 상태입니다'); end if;
  select * into m from memberships where user_id = y.user_id for update;
  if y.kind = 'initial' then
    if not exists (select 1 from participations where user_id = y.user_id and cohort_no = y.cohort_no and status = 'pending_payment') then
      return fail('bad_status','신청 상태가 아닙니다');
    end if;
    update memberships set status = 'active', fee_paid = true, deposit_balance = dep, ended_at = null where user_id = y.user_id;
    if dep - m.deposit_balance > 0 then
      insert into deposit_ledger (user_id, cohort_no, delta, reason) values (y.user_id, y.cohort_no, dep - m.deposit_balance, 'deposit_in');
    end if;
    update participations set status = 'active' where user_id = y.user_id and cohort_no = y.cohort_no;
  else
    if not exists (select 1 from participations where user_id = y.user_id and cohort_no = y.cohort_no and status = 'topup_pending') then
      return fail('expired','재납부 기한이 지나 무효 처리된 참여입니다');
    end if;
    update memberships set deposit_balance = deposit_balance + y.amount where user_id = y.user_id;
    insert into deposit_ledger (user_id, cohort_no, delta, reason) values (y.user_id, y.cohort_no, y.amount, 'topup');
    update participations set status = 'active', topup_due_at = null where user_id = y.user_id and cohort_no = y.cohort_no;
  end if;
  update payments set status = 'confirmed', confirmed_at = app_now() where id = p_payment_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_reject_payment(p_payment_id bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform require_admin();
  update payments set status = 'rejected' where id = p_payment_id and status in ('claimed','awaiting');
  if not found then return fail('bad_status','반려할 수 없는 상태입니다'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_mark_refunded(p_user uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare m memberships; lastc int;
begin
  perform require_admin();
  select * into m from memberships where user_id = p_user for update;
  if not found or m.status <> 'ended' or m.refund_requested_at is null or m.refund_done_at is not null or m.deposit_balance <= 0 then
    return fail('not_refundable','환급 대기 상태가 아닙니다');
  end if;
  select max(cohort_no) into lastc from participations where user_id = p_user;
  insert into deposit_ledger (user_id, cohort_no, delta, reason) values (p_user, lastc, -m.deposit_balance, 'refund_out');
  update memberships set deposit_balance = 0, refund_done_at = app_now(),
    refund_bank = null, refund_account = null, refund_holder = null where user_id = p_user;
  return jsonb_build_object('ok', true, 'amount', m.deposit_balance);
end $$;

-- 다음 기수 날짜 제안: 3개 기수 진행 후 1주 휴식 (no % 3 = 0 인 기수 뒤에 휴식)
create or replace function admin_suggest_next_cohort() returns jsonb
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare c cohorts; s date;
begin
  perform require_admin();
  select * into c from cohorts order by no desc limit 1;
  if not found then return fail('no_cohort','기수가 없습니다'); end if;
  s := c.end_date + 1 + case when c.no % 3 = 0 then 7 else 0 end;
  return jsonb_build_object('ok', true, 'no', c.no + 1, 'start_date', s, 'end_date', s + 27);
end $$;

create or replace function admin_create_cohort(p_no int, p_start date, p_end date, p_apply_deadline timestamptz) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare prev int;
begin
  perform require_admin();
  if extract(isodow from p_start) <> 1 or p_end <> p_start + 27 then
    return fail('bad_dates','기수는 월요일 시작, 28일이어야 합니다');
  end if;
  if exists (select 1 from cohorts where no = p_no or daterange(start_date, end_date, '[]') && daterange(p_start, p_end, '[]')) then
    return fail('conflict','기수 번호 또는 기간이 겹칩니다');
  end if;
  insert into cohorts (no, start_date, end_date, apply_deadline) values (p_no, p_start, p_end, p_apply_deadline);
  -- 이전 기수가 이미 정산됐다면 계속 참가자 참여를 이어서 생성
  select max(no) into prev from cohorts where no < p_no;
  if prev is not null then perform roll_over(prev); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_set_recruiting(p_no int, p_open boolean, p_deadline timestamptz) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform require_admin();
  update cohorts set recruiting_open = p_open, apply_deadline = coalesce(p_deadline, apply_deadline) where no = p_no;
  if not found then return fail('no_cohort','기수가 없습니다'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function admin_set_setting(p_key text, p_value text) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform require_admin();
  update settings set value = coalesce(p_value,'') where key = p_key;
  if not found then return fail('no_key','알 수 없는 설정 키입니다'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- 시트 연동 토큰 설정: 평문은 저장하지 않고 해시만 저장
create or replace function admin_set_export_token(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform require_admin();
  if char_length(coalesce(p_token,'')) < 24 then return fail('weak_token','토큰은 24자 이상이어야 합니다'); end if;
  update settings set value = encode(sha256(convert_to(p_token,'UTF8')),'hex') where key = 'export_token_hash';
  return jsonb_build_object('ok', true);
end $$;

-- A7 이관. p_rows: [{name,nickname,phone,email,deposit_balance,fee_paid,cohort_no}]
create or replace function admin_import_members(p_rows jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare r jsonb; em text; n int := 0; linked int := 0; uid uuid;
begin
  perform require_admin();
  for r in select * from jsonb_array_elements(p_rows) loop
    em := lower(trim(r->>'email'));
    if em is null or em = '' then return fail('bad_row','이메일이 비어 있는 행이 있습니다'); end if;
    insert into pending_imports (email, name, nickname, phone, deposit_balance, fee_paid, cohort_no)
      values (em, r->>'name', r->>'nickname', r->>'phone', coalesce((r->>'deposit_balance')::int,0),
              coalesce((r->>'fee_paid')::boolean, true), (r->>'cohort_no')::int)
      on conflict (email) do update set name = excluded.name, nickname = excluded.nickname, phone = excluded.phone,
        deposit_balance = excluded.deposit_balance, fee_paid = excluded.fee_paid, cohort_no = excluded.cohort_no
        where pending_imports.linked_at is null;
    n := n + 1;
    select id into uid from profiles where email = em;
    if uid is not null and link_import(uid) then linked := linked + 1; end if;
  end loop;
  return jsonb_build_object('ok', true, 'rows', n, 'linked_now', linked);
end $$;

-- 시트 연동(서버 전용: Edge Function 이 service_role 로 호출). 계좌번호/비밀번호 제외.
create or replace function export_data(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare h text := setting('export_token_hash');
begin
  if h = '' or p_token is null or encode(sha256(convert_to(p_token,'UTF8')),'hex') <> h then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'participants', (select coalesce(jsonb_agg(jsonb_build_object('name', pr.name, 'nickname', pr.nickname, 'phone', pr.phone,
        'status', m.status, 'deposit_balance', m.deposit_balance, 'fee_paid', m.fee_paid) order by pr.name), '[]') from memberships m join profiles pr on pr.id = m.user_id),
    'checkins', (select coalesce(jsonb_agg(jsonb_build_object('cohort_no', p.cohort_no, 'name', pr.name, 'nickname', pr.nickname,
        'count', (select count(*) from checkins k where k.user_id = p.user_id and k.cohort_no = p.cohort_no), 'result', p.result, 'status', p.status)
        order by p.cohort_no, pr.name), '[]') from participations p join profiles pr on pr.id = p.user_id),
    'payments', (select coalesce(jsonb_agg(jsonb_build_object('created_at', y.created_at, 'depositor_name', y.depositor_name,
        'amount', y.amount, 'kind', y.kind, 'status', y.status, 'cohort_no', y.cohort_no) order by y.id), '[]') from payments y),
    'settlement', (select coalesce(jsonb_agg(jsonb_build_object('cohort_no', cohort_no, 'result', result, 'people', cnt) order by cohort_no, result), '[]')
        from (select cohort_no, result, count(*) cnt from participations where result <> 'pending' group by 1,2) s),
    'refunds', (select coalesce(jsonb_agg(jsonb_build_object('name', pr.name, 'amount', m.deposit_balance,
        'state', case when m.refund_done_at is not null then 'done' when m.refund_requested_at is not null then 'requested' else 'eligible' end)), '[]')
        from memberships m join profiles pr on pr.id = m.user_id where m.status = 'ended' and (m.deposit_balance > 0 or m.refund_done_at is not null)));
end $$;

-- ───────── 실행 권한: 기본 차단 후 필요한 것만 허용 ─────────
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function is_admin() to authenticated;   -- RLS 정책에서 사용
grant execute on function get_public_info() to anon, authenticated;
grant execute on function
  update_nickname(text), get_apply_info(), apply(int,text,boolean), claim_payment(text,text),
  set_habits(int,text[]), check_in(), get_home(), get_progress(int), request_stop(text,text,text),
  cancel_stop(), request_refund(text,text,text),
  finalize_cohort(int), admin_confirm_payment(bigint), admin_reject_payment(bigint), admin_mark_refunded(uuid),
  admin_suggest_next_cohort(), admin_create_cohort(int,date,date,timestamptz), admin_set_recruiting(int,boolean,timestamptz),
  admin_set_setting(text,text), admin_set_export_token(text), admin_import_members(jsonb)
  to authenticated;
-- export_data 는 service_role(Edge Function) 전용. expire_unpaid / finalize_due_cohorts / roll_over 는 cron(postgres) 전용.
grant execute on function export_data(text) to service_role;
