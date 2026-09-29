-- 테스트 전용: 시각 고정. 운영 코드는 app_now() = now() 만 사용한다.
create or replace function app_now() returns timestamptz language sql stable as
$$ select coalesce(nullif(current_setting('test.now', true), '')::timestamptz, now()) $$;
grant execute on function app_now() to public;
