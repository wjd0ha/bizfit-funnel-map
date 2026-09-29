#!/usr/bin/env bash
# 사용: habit-app/supabase/tests/run.sh   (로컬 PostgreSQL 16 필요, root/postgres 권한)
set -euo pipefail
cd "$(dirname "$0")"
pg_lsclusters | grep -q online || pg_ctlcluster 16 main start
sleep 2
P="su postgres -c"
$P "psql -qc 'drop database if exists habit_test'" ; $P "psql -qc 'create database habit_test'"
run() { $P "psql -X -q -v ON_ERROR_STOP=1 habit_test -f $(pwd)/$1"; }
run shim.sql
run ../migrations/0001_schema.sql
run ../migrations/0002_rpc.sql
run ../migrations/0003_admin_extras.sql
run clock.sql
run tests.sql
