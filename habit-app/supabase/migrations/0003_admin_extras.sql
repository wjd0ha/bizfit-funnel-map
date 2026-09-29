-- 3단계 추가: 시작 전 취소(전액 환불), 허위 인증 성공 취소, 관리자 목록 RPC, 수동 정산 기본값

-- 허위 인증 성공 취소 표시 (정산 전에만 가능). 표시된 참여는 정산 시 '미달' 처리.
alter table participations add column revoked boolean not null default false;

-- 자동 정산은 기본 끔: 운영자가 허위 인증을 검토한 뒤 A4에서 수동 정산한다.
insert into settings (key, value) values ('auto_finalize', 'off') on conflict do nothing;

create or replace function finalize_due_cohorts() returns int
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare r record; n int := 0;
begin
  if setting('auto_finalize') <> 'on' then return 0; end if;
  for r in select no from cohorts where finalized_at is null and end_date < kst_today() order by no loop
    perform finalize_cohort(r.no); n := n + 1;
  end loop;
  return n;
end $$;

-- 정산: revoked 참여는 인증 횟수와 무관하게 미달 처리
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
      update participations set status = 'void' where user_id = r.user_id and cohort_no = p_cohort_no;
      update memberships set status = 'ended', ended_at = app_now(), stop_requested = false where user_id = r.user_id and status <> 'ended';
      continue;
    end if;
    select count(*) into n from checkins where user_id = r.user_id and cohort_no = p_cohort_no;
    res := case when r.revoked then 'fail' when n >= setting_int('success_min') then 'success'
                when n >= setting_int('partial_min') then 'partial' else 'fail' end;
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

create or replace function admin_set_revoked(p_user uuid, p_cohort int, p_revoked boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform require_admin();
  if exists (select 1 from cohorts where no = p_cohort and finalized_at is not null) then
    return fail('finalized','이미 정산된 기수입니다');
  end if;
  update participations set revoked = p_revoked where user_id = p_user and cohort_no = p_cohort;
  if not found then return fail('no_participation','참여 내역이 없습니다'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- 기수 시작 전 취소: 입금액 전액 환불(실제 송금은 운영자가 수동). 원장에서 잔액을 꺼내고 회원 종료.
create or replace function admin_cancel_application(p_user uuid, p_cohort int) returns jsonb
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare c cohorts; m memberships; refund_total int;
begin
  perform require_admin();
  select * into c from cohorts where no = p_cohort;
  if not found or kst_today() >= c.start_date then
    return fail('already_started','기수 시작 후에는 환불할 수 없습니다');
  end if;
  select coalesce(sum(amount),0) into refund_total from payments
    where user_id = p_user and cohort_no = p_cohort and status = 'confirmed';
  select * into m from memberships where user_id = p_user for update;
  if not found then return fail('no_member','회원이 아닙니다'); end if;
  update participations set status = 'void' where user_id = p_user and cohort_no = p_cohort;
  update payments set status = 'rejected' where user_id = p_user and cohort_no = p_cohort and status in ('awaiting','claimed');
  if m.deposit_balance > 0 then
    insert into deposit_ledger (user_id, cohort_no, delta, reason) values (p_user, p_cohort, -m.deposit_balance, 'refund_out');
  end if;
  update memberships set status = 'ended', ended_at = app_now(), deposit_balance = 0, fee_paid = false, stop_requested = false
    where user_id = p_user;
  return jsonb_build_object('ok', true, 'refund_amount', refund_total);
end $$;

-- A3/A4: 참가자 목록 (인증 횟수, 결과, 보증금 잔액, 재납부 상태)
create or replace function admin_participants(p_cohort int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  perform require_admin();
  return coalesce((select jsonb_agg(row_to_json(t) order by t.name) from (
    select pr.id as user_id, pr.name, pr.nickname, pr.phone, pr.email, m.status as membership_status,
      m.deposit_balance, m.fee_paid, m.stop_requested, p.status as participation_status, p.result, p.revoked,
      p.topup_due_at, (select count(*) from checkins k where k.user_id = p.user_id and k.cohort_no = p.cohort_no) as checkin_count,
      (select y.amount from payments y where y.user_id = p.user_id and y.cohort_no = p.cohort_no and y.kind = 'topup' and y.status <> 'confirmed' order by y.id desc limit 1) as topup_amount
    from participations p join profiles pr on pr.id = p.user_id join memberships m on m.user_id = p.user_id
    where p.cohort_no = p_cohort) t), '[]'::jsonb);
end $$;

-- 상단 배지용: 확인 대기 입금 수, 환급 대기 수
create or replace function admin_counts() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  perform require_admin();
  return jsonb_build_object(
    'claimed_payments', (select count(*) from payments where status = 'claimed'),
    'refunds_waiting', (select count(*) from memberships where refund_requested_at is not null and refund_done_at is null),
    'members', (select count(*) from memberships),
    'pending_imports', (select count(*) from pending_imports where linked_at is null));
end $$;

revoke execute on function admin_set_revoked(uuid,int,boolean), admin_cancel_application(uuid,int),
  admin_participants(int), admin_counts() from public, anon, authenticated;
grant execute on function admin_set_revoked(uuid,int,boolean), admin_cancel_application(uuid,int),
  admin_participants(int), admin_counts() to authenticated;
