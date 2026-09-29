-- 화면 문구가 설정값(환급 신청 기간, 중단 시작 일차 등)을 따르도록 공개 정보를 확장한다.
create or replace function get_public_info() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('operator_name', setting('operator_name'),
    'operator_contact_email', setting('operator_contact_email'),
    'terms_version', setting('terms_version'), 'privacy_version', setting('privacy_version'),
    'fee_amount', setting_int('fee_amount'), 'deposit_amount', setting_int('deposit_amount'),
    'checkin_start', setting('checkin_start'), 'checkin_end', setting('checkin_end'),
    'refund_claim_days', setting_int('refund_claim_days'), 'stop_from_day', setting_int('stop_from_day'),
    'success_min', setting_int('success_min'), 'partial_min', setting_int('partial_min'))
$$;
