-- 부행일치 1단계: 스키마 + RLS
-- 금액/시간/기한 값은 settings 에서 읽는다(코드 하드코딩 금지). 비밀 값은 넣지 않는다.

-- ───────── 시간/설정 헬퍼 ─────────
-- app_now(): 서버 시각만 사용. (테스트에서만 이 함수를 대체해 시각을 고정한다)
create or replace function app_now() returns timestamptz
language sql stable as $$ select now() $$;

create or replace function kst_today() returns date
language sql stable as $$ select (app_now() at time zone 'Asia/Seoul')::date $$;

create or replace function kst_time() returns time
language sql stable as $$ select (app_now() at time zone 'Asia/Seoul')::time $$;

-- ───────── 테이블 ─────────
create table settings (
  key   text primary key,
  value text not null default ''
);

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  name       text not null,
  nickname   text not null,
  phone      text not null,
  role       text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create table nickname_history (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references profiles(id) on delete cascade,
  old_nickname text not null,
  new_nickname text not null,
  changed_at   timestamptz not null default now()
);

create table cohorts (
  no               int primary key,
  start_date       date not null,
  end_date         date not null,
  recruiting_open  boolean not null default false,
  apply_deadline   timestamptz,
  finalized_at     timestamptz,
  check (end_date > start_date)
);

create table memberships (
  user_id             uuid primary key references profiles(id) on delete cascade,
  status              text not null check (status in ('applied','active','ended')),
  fee_paid            boolean not null default false,
  deposit_balance     int not null default 0 check (deposit_balance >= 0),
  stop_requested      boolean not null default false,
  refund_bank         text,
  refund_account      text,
  refund_holder       text,
  refund_requested_at timestamptz,
  refund_done_at      timestamptz,
  ended_at            timestamptz
);

create table participations (
  user_id      uuid not null references profiles(id) on delete cascade,
  cohort_no    int  not null references cohorts(no),
  status       text not null check (status in ('pending_payment','topup_pending','active','void')),
  topup_due_at timestamptz,
  result       text not null default 'pending' check (result in ('pending','success','partial','fail')),
  habit1 text, habit2 text, habit3 text,
  primary key (user_id, cohort_no)
);

create table checkins (
  user_id      uuid not null,
  cohort_no    int  not null,
  checkin_date date not null,
  created_at   timestamptz not null default now(),
  unique (user_id, cohort_no, checkin_date),
  foreign key (user_id, cohort_no) references participations(user_id, cohort_no) on delete cascade
);

-- 설계서 enum(claimed/confirmed/rejected)에 'awaiting'(안내만 나간 상태) 추가
create table payments (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references profiles(id) on delete cascade,
  cohort_no     int  not null references cohorts(no),
  kind          text not null check (kind in ('initial','topup')),
  amount        int  not null check (amount > 0),
  depositor_name text,
  status        text not null default 'awaiting' check (status in ('awaiting','claimed','confirmed','rejected')),
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz
);

create table deposit_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  cohort_no  int references cohorts(no),
  delta      int not null,
  reason     text not null check (reason in ('deposit_in','forfeit','topup','refund_out')),
  created_at timestamptz not null default now()
);

create table consents (
  id        bigint generated always as identity primary key,
  user_id   uuid not null references profiles(id) on delete cascade,
  type      text not null check (type in ('privacy','terms')),
  version   text not null,
  agreed_at timestamptz not null default now()
);

-- A7 이관: 같은 이메일로 가입하면 자동 연결
create table pending_imports (
  email           text primary key,          -- 소문자 저장
  name            text not null,
  nickname        text not null,
  phone           text not null,
  deposit_balance int  not null default 0 check (deposit_balance between 0 and 1000000),
  fee_paid        boolean not null default true,
  cohort_no       int  not null references cohorts(no),
  linked_at       timestamptz
);

create index on payments (status);
create index on participations (cohort_no, status);

-- ───────── 기본 설정값 (비밀/계좌 값은 비워 둠: 관리자 화면 A6에서 입력) ─────────
insert into settings (key, value) values
  ('bank_name',''),('bank_account',''),('bank_holder',''),
  ('chat_url',''),('chat_password',''),
  ('operator_name',''),('operator_contact_email',''),
  ('fee_amount','10000'),('deposit_amount','20000'),
  ('checkin_start','07:00'),('checkin_end','23:59'),
  ('topup_grace_days','2'),('refund_claim_days','90'),
  ('success_min','20'),('partial_min','18'),('partial_forfeit','10000'),
  ('stop_from_day','25'),('chat_open_days_before','2'),
  ('terms_version','1'),('privacy_version','1'),
  ('export_token_hash','');

create or replace function setting(k text) returns text
language sql stable security definer set search_path = public as
$$ select value from settings where key = k $$;

create or replace function setting_int(k text) returns int
language sql stable security definer set search_path = public as
$$ select value::int from settings where key = k $$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;

-- ───────── 가입 트리거: profiles + 개인정보 동의 기록 + 이관 연결 ─────────
-- 클라이언트는 signUp 의 metadata 로 name, nickname, phone, privacy_agreed 를 보낸다.
-- role 은 항상 'member' (관리자 지정은 DB에서 수동 1회).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if coalesce(m->>'privacy_agreed','') <> 'true' then
    raise exception '개인정보 수집·이용 동의(필수)가 필요합니다' using errcode = '22023';
  end if;
  if coalesce(trim(m->>'name'),'') = '' or coalesce(trim(m->>'nickname'),'') = ''
     or coalesce(trim(m->>'phone'),'') = '' then
    raise exception '성명, 닉네임, 연락처는 필수입니다' using errcode = '22023';
  end if;
  insert into profiles (id, email, name, nickname, phone)
    values (new.id, lower(new.email), trim(m->>'name'), trim(m->>'nickname'), trim(m->>'phone'));
  insert into consents (user_id, type, version) values (new.id, 'privacy', setting('privacy_version'));
  perform link_import(new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ───────── RLS: 클라이언트는 조회만. 쓰기는 RPC(SECURITY DEFINER)로만 ─────────
alter table settings         enable row level security;
alter table profiles         enable row level security;
alter table nickname_history enable row level security;
alter table cohorts          enable row level security;
alter table memberships      enable row level security;
alter table participations   enable row level security;
alter table checkins         enable row level security;
alter table payments         enable row level security;
alter table deposit_ledger   enable row level security;
alter table consents         enable row level security;
alter table pending_imports  enable row level security;

create policy own_or_admin on profiles         for select to authenticated using (id = auth.uid() or is_admin());
create policy own_or_admin on nickname_history for select to authenticated using (user_id = auth.uid() or is_admin());
create policy own_or_admin on memberships      for select to authenticated using (user_id = auth.uid() or is_admin());
create policy own_or_admin on participations   for select to authenticated using (user_id = auth.uid() or is_admin());
create policy own_or_admin on checkins         for select to authenticated using (user_id = auth.uid() or is_admin());
create policy own_or_admin on payments         for select to authenticated using (user_id = auth.uid() or is_admin());
create policy own_or_admin on deposit_ledger   for select to authenticated using (user_id = auth.uid() or is_admin());
create policy own_or_admin on consents         for select to authenticated using (user_id = auth.uid() or is_admin());
create policy read_all     on cohorts          for select to authenticated using (true);
create policy admin_only   on settings         for select to authenticated using (is_admin());
create policy admin_only   on pending_imports  for select to authenticated using (is_admin());

revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;
