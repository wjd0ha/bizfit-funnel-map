// 체험용 데모: 서버 없이 브라우저 메모리에서 동작하는 가짜 Supabase. (VITE_DEMO=1 빌드에서만 사용)
/* eslint-disable @typescript-eslint/no-explicit-any */
export const DEMO = import.meta.env.VITE_DEMO === "1";

type Row = Record<string, any>;
const START = "2026-10-05"; // 40기 시작일 (월)
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (s: string, n: number) => { const [y, m, d] = s.split("-").map(Number); return iso(new Date(y, m - 1, d + n)); };
const ok = (o: Row = {}) => ({ ok: true, ...o });
const fail = (code: string, message: string) => ({ ok: false, code, message });

export const PERSONAS = { u1: "참가자(40기 진행 중)", new1: "신규 가입자(신청 전)", admin1: "관리자" } as const;
export type PersonaId = keyof typeof PERSONAS;

const state = {
  me: "u1" as PersonaId | null, // 데모는 로그인 없이 참가자 화면으로 바로 시작
  day: 12, // 40기 N일차
  listeners: [] as ((e: string, s: any) => void)[],
  db: {} as Record<string, Row[]>,
  pid: 100,
};

function seed() {
  const P = (id: string, name: string, nickname: string, role = "member") => ({ id, email: `${id}@demo.kr`, name, nickname, phone: "010-1234-5678", role });
  const cohorts = [
    { no: 40, start_date: START, end_date: "2026-11-01", recruiting_open: false, apply_deadline: null, finalized_at: null },
    { no: 41, start_date: "2026-11-02", end_date: "2026-11-29", recruiting_open: true, apply_deadline: "2026-11-01T14:59:00Z", finalized_at: null },
    { no: 42, start_date: "2026-11-30", end_date: "2026-12-27", recruiting_open: false, apply_deadline: null, finalized_at: null },
  ];
  const mem = (user_id: string, o: Row = {}) => ({ user_id, status: "active", fee_paid: true, deposit_balance: 20000, stop_requested: false, refund_bank: null, refund_account: null, refund_holder: null, refund_requested_at: null, refund_done_at: null, ended_at: null, ...o });
  const part = (user_id: string, o: Row = {}) => ({ user_id, cohort_no: 40, status: "active", topup_due_at: null, result: "pending", revoked: false, habit1: "운동 30분", habit2: "독서 10쪽", habit3: null, ...o });
  state.db = {
    profiles: [P("u1", "홍길동", "길동"), P("new1", "새로미", "새로미"), P("admin1", "운영자", "운영자", "admin"), P("a", "김하나", "하나"), P("b", "이두리", "두리"), P("c", "박세미", "세미"), P("z", "최민수", "민수")],
    cohorts,
    memberships: [mem("u1"), mem("a"), mem("b", { deposit_balance: 10000 }), mem("c", { stop_requested: true }), mem("z", { status: "ended", deposit_balance: 10000, refund_bank: "국민", refund_account: "123-45-6789", refund_holder: "최민수", refund_requested_at: "2026-10-03T01:00:00Z", ended_at: "2026-10-02T15:10:00Z" })],
    participations: [part("u1"), part("a"), part("b"), part("c", { habit1: "명상 5분" })],
    checkins: [],
    payments: [
      { id: 1, user_id: "b", cohort_no: 41, kind: "topup", amount: 10000, depositor_name: "이두리", status: "claimed", created_at: "2026-10-14T01:00:00Z", confirmed_at: null },
      { id: 2, user_id: "a", cohort_no: 40, kind: "initial", amount: 30000, depositor_name: "김하나", status: "confirmed", created_at: "2026-09-25T01:00:00Z", confirmed_at: "2026-09-25T03:00:00Z" },
    ],
    deposit_ledger: [{ id: 1, user_id: "u1", cohort_no: 40, delta: 20000, reason: "deposit_in", created_at: "2026-09-25T02:00:00Z" }],
    consents: [],
    pending_imports: [{ email: "kim@example.com", name: "김이관", nickname: "이관", phone: "010", deposit_balance: 20000, fee_paid: true, cohort_no: 40, linked_at: "2026-09-29T01:00:00Z" }, { email: "lee@example.com", name: "이대기", nickname: "대기", phone: "010", deposit_balance: 20000, fee_paid: true, cohort_no: 40, linked_at: null }],
    settings: Object.entries({ bank_name: "카카오뱅크", bank_account: "3333-00-0000000", bank_holder: "부행일치", chat_url: "https://open.kakao.com/o/example", chat_password: "pw1234", operator_name: "운영자", operator_contact_email: "op@example.com", fee_amount: "10000", deposit_amount: "20000", partial_forfeit: "10000", checkin_start: "07:00", checkin_end: "23:59", topup_grace_days: "2", refund_claim_days: "90", stop_from_day: "25", chat_open_days_before: "2", success_min: "20", partial_min: "18", terms_version: "1", privacy_version: "1", auto_finalize: "off", export_token_hash: "" }).map(([key, value]) => ({ key, value })),
  };
  // 다른 참가자의 인증 기록(샘플)
  for (const [u, n] of [["a", 11], ["b", 9], ["c", 8]] as const) for (let i = 0; i < n; i++) state.db.checkins.push({ user_id: u, cohort_no: 40, checkin_date: addDays(START, i) });
  seedMyCheckins();
}
function seedMyCheckins() {
  state.db.checkins = state.db.checkins.filter((c) => c.user_id !== "u1");
  const n = Math.floor((state.day - 1) * 0.78);
  const days = Array.from({ length: state.day - 1 }, (_, i) => i).filter((i) => (i * 7 + 3) % 9 !== 0).slice(0, n + 1);
  for (const i of days) state.db.checkins.push({ user_id: "u1", cohort_no: 40, checkin_date: addDays(START, i) });
}
seed();

const today = () => addDays(START, state.day - 1);
const setting = (k: string) => state.db.settings.find((s) => s.key === k)?.value ?? "";
const me = () => state.me as string;
const isAdmin = () => state.me === "admin1";
const myMem = () => state.db.memberships.find((m) => m.user_id === me());
const coh = (no: number) => state.db.cohorts.find((c) => c.no === no)!;
const countOf = (u: string, c: number) => state.db.checkins.filter((k) => k.user_id === u && k.cohort_no === c).length;

export function setDay(d: number) { state.day = d; seedMyCheckins(); }
export function getDay() { return state.day; }
export function setPersona(id: PersonaId | null) {
  state.me = id;
  const s = id ? { user: { id, email: `${id}@demo.kr` }, access_token: "demo" } : null;
  state.listeners.forEach((l) => l(id ? "SIGNED_IN" : "SIGNED_OUT", s));
}
export const getPersona = () => state.me;

function home() {
  const m = myMem();
  if (!m) return { phase: "none", next_cohort_start: "2026-11-02" };
  const p = [...state.db.participations].filter((x) => x.user_id === me() && x.status !== "void").sort((a, b) => a.cohort_no - b.cohort_no)[0];
  if (!p) return { phase: m.status === "ended" ? "ended" : "none", membership_status: m.status, next_cohort_start: "2026-11-02" };
  const c = coh(p.cohort_no), t = today(), goal = 20;
  const before = t < c.start_date, day_no = before ? null : Math.round((Date.parse(t) - Date.parse(c.start_date)) / 86400000) + 1;
  const n = countOf(me(), c.no), done = state.db.checkins.some((k) => k.user_id === me() && k.cohort_no === c.no && k.checkin_date === t);
  const active = ["active", "topup_pending"].includes(p.status);
  return {
    phase: before ? "before_start" : "in_cohort", cohort_no: c.no, start_date: c.start_date, end_date: c.end_date, day_no,
    days_left: Math.max(Math.round((Date.parse(c.end_date) - Date.parse(t)) / 86400000), 0),
    habits: [p.habit1, p.habit2, p.habit3].filter(Boolean), count: n, goal, percent: Math.round(Math.min(n / goal, 1) * 100),
    checked_today: done, can_checkin: !before && active && !done, participation_status: p.status, topup_due_at: p.topup_due_at,
    membership_status: m.status, next_cohort_start: c.start_date,
    chat: active && t >= addDays(c.start_date, -2) ? { url: setting("chat_url"), password: setting("chat_password") } : null,
  };
}

const rpcs: Record<string, (a: Row) => any> = {
  get_home: home,
  get_public_info: () => ({ operator_name: setting("operator_name"), operator_contact_email: setting("operator_contact_email"), terms_version: "1", privacy_version: "1", fee_amount: 10000, deposit_amount: 20000, checkin_start: "07:00", checkin_end: "23:59", refund_claim_days: 90, stop_from_day: 25, success_min: 20, partial_min: 18 }),
  get_apply_info: () => ({ amount: myMem()?.status === "ended" ? 30000 - myMem()!.deposit_balance : 30000, bank_name: setting("bank_name"), bank_account: setting("bank_account"), bank_holder: setting("bank_holder"), cohorts: state.db.cohorts.filter((c) => c.recruiting_open) }),
  check_in: () => {
    const h: any = home(); if (!h.can_checkin && !h.checked_today) return fail("no_active_cohort", "지금은 인증할 수 없어요");
    if (h.checked_today) return { ok: false, code: "already_checked", message: "이미 인증했습니다", count: h.count };
    state.db.checkins.push({ user_id: me(), cohort_no: h.cohort_no, checkin_date: today() });
    return ok({ count: h.count + 1 });
  },
  get_progress: (a) => ({ start_date: coh(a.p_cohort_no).start_date, count: countOf(me(), a.p_cohort_no), remaining_to_goal: Math.max(20 - countOf(me(), a.p_cohort_no), 0), success_min: 20, partial_min: 18, dates: state.db.checkins.filter((k) => k.user_id === me() && k.cohort_no === a.p_cohort_no).map((k) => k.checkin_date).sort() }),
  set_habits: (a) => { const p = state.db.participations.find((x) => x.user_id === me() && x.cohort_no === a.p_cohort_no); const h = (a.p_habits as string[]).map((x) => x.trim()).filter(Boolean); if (!h.length) return fail("habit_required", "습관을 1~3개 입력하세요"); Object.assign(p!, { habit1: h[0], habit2: h[1] ?? null, habit3: h[2] ?? null }); return ok(); },
  update_nickname: (a) => { const p = state.db.profiles.find((x) => x.id === me())!; p.nickname = String(a.p_new).trim(); return ok(); },
  apply: (a) => {
    if (myMem()) return fail("already_member", "이미 참가 중입니다(중단 신청이 없으면 자동 연장됩니다)");
    state.db.memberships.push({ user_id: me(), status: "applied", fee_paid: false, deposit_balance: 0, stop_requested: false, refund_bank: null, refund_account: null, refund_holder: null, refund_requested_at: null, refund_done_at: null, ended_at: null });
    state.db.participations.push({ user_id: me(), cohort_no: a.p_cohort_no, status: "pending_payment", topup_due_at: null, result: "pending", revoked: false, habit1: null, habit2: null, habit3: null });
    state.db.payments.push({ id: ++state.pid, user_id: me(), cohort_no: a.p_cohort_no, kind: "initial", amount: 30000, depositor_name: a.p_depositor_name, status: "awaiting", created_at: new Date().toISOString(), confirmed_at: null });
    return ok({ amount: 30000 });
  },
  claim_payment: (a) => { const p = [...state.db.payments].reverse().find((x) => x.user_id === me() && x.kind === a.p_kind && ["awaiting", "rejected"].includes(x.status)); if (!p) return fail("no_payment", "입금 안내 내역이 없습니다"); Object.assign(p, { status: "claimed", depositor_name: a.p_depositor_name }); return ok(); },
  request_stop: () => { const h: any = home(); if ((h.day_no ?? 0) < 25) return fail("too_early", "25일차부터 신청할 수 있습니다"); Object.assign(myMem()!, { stop_requested: true }); return ok(); },
  cancel_stop: () => { Object.assign(myMem()!, { stop_requested: false }); return ok(); },
  request_refund: () => fail("not_refundable", "데모에서는 환급 신청을 지원하지 않아요"),
  // ── 관리자
  admin_counts: () => ({ claimed_payments: state.db.payments.filter((p) => p.status === "claimed").length, refunds_waiting: state.db.memberships.filter((m) => m.refund_requested_at && !m.refund_done_at).length, members: state.db.memberships.length, pending_imports: 1 }),
  admin_suggest_next_cohort: () => { const l = [...state.db.cohorts].sort((a, b) => b.no - a.no)[0]; const s = addDays(l.end_date, 1 + (l.no % 3 === 0 ? 7 : 0)); return ok({ no: l.no + 1, start_date: s, end_date: addDays(s, 27) }); },
  admin_create_cohort: (a) => { state.db.cohorts.push({ no: a.p_no, start_date: a.p_start, end_date: a.p_end, recruiting_open: false, apply_deadline: a.p_apply_deadline, finalized_at: null }); return ok(); },
  admin_set_recruiting: (a) => { Object.assign(coh(a.p_no), { recruiting_open: a.p_open, apply_deadline: a.p_deadline ?? coh(a.p_no).apply_deadline }); return ok(); },
  admin_confirm_payment: (a) => {
    const y = state.db.payments.find((p) => p.id === a.p_payment_id)!; y.status = "confirmed"; y.confirmed_at = new Date().toISOString();
    const m = state.db.memberships.find((x) => x.user_id === y.user_id)!; const p = state.db.participations.find((x) => x.user_id === y.user_id && x.cohort_no === y.cohort_no)!;
    if (y.kind === "initial") Object.assign(m, { status: "active", fee_paid: true, deposit_balance: 20000 }); else m.deposit_balance += y.amount;
    Object.assign(p, { status: "active", topup_due_at: null }); return ok();
  },
  admin_reject_payment: (a) => { state.db.payments.find((p) => p.id === a.p_payment_id)!.status = "rejected"; return ok(); },
  admin_participants: (a) => state.db.participations.filter((p) => p.cohort_no === a.p_cohort).map((p) => { const pr = state.db.profiles.find((x) => x.id === p.user_id)!, m = state.db.memberships.find((x) => x.user_id === p.user_id)!; return { user_id: p.user_id, name: pr.name, nickname: pr.nickname, phone: pr.phone, email: pr.email, membership_status: m.status, deposit_balance: m.deposit_balance, fee_paid: m.fee_paid, stop_requested: m.stop_requested, participation_status: p.status, result: p.result, revoked: p.revoked, topup_due_at: p.topup_due_at, checkin_count: countOf(p.user_id, p.cohort_no), topup_amount: null }; }),
  admin_set_revoked: (a) => { state.db.participations.find((p) => p.user_id === a.p_user && p.cohort_no === a.p_cohort)!.revoked = a.p_revoked; return ok(); },
  admin_cancel_application: () => fail("already_started", "데모에서는 지원하지 않아요"),
  finalize_cohort: () => fail("not_ended", "데모에서는 정산을 실행하지 않아요 (기수가 진행 중이에요)"),
  admin_mark_refunded: (a) => { Object.assign(state.db.memberships.find((m) => m.user_id === a.p_user)!, { deposit_balance: 0, refund_done_at: new Date().toISOString(), refund_bank: null, refund_account: null, refund_holder: null }); return ok(); },
  admin_set_setting: (a) => { const s = state.db.settings.find((x) => x.key === a.p_key); if (s) s.value = a.p_value; return ok(); },
  admin_set_export_token: () => ok(),
  admin_import_members: (a) => { (a.p_rows as Row[]).forEach((r) => state.db.pending_imports.push({ email: r.email, name: r.name, nickname: r.nickname, phone: r.phone, deposit_balance: r.deposit_balance, fee_paid: r.fee_paid, cohort_no: r.cohort_no, linked_at: null })); return ok({ rows: (a.p_rows as Row[]).length, linked_now: 0 }); },
};

const MEMBER_TABLES = ["memberships", "participations", "checkins", "payments", "deposit_ledger", "consents"];
function from(table: string) {
  let rows: Row[] = [...(state.db[table] ?? [])], head = false, join = false;
  if (!isAdmin()) {
    if (MEMBER_TABLES.includes(table)) rows = rows.filter((r) => r.user_id === me());
    if (table === "profiles") rows = rows.filter((r) => r.id === me());
    if (table === "settings" || table === "pending_imports") rows = [];
  }
  const done = () => {
    if (!join) return rows;
    return rows.map((r) => ({ ...r, profiles: (() => { const p = state.db.profiles.find((x) => x.id === r.user_id); return p ? { name: p.name, nickname: p.nickname } : null; })() }));
  };
  const q: any = {
    select(cols?: string, opt?: any) { if (opt?.head) head = true; if (cols?.includes("profiles(")) join = true; return q; },
    eq(k: string, v: any) { rows = rows.filter((r) => r[k] === v); return q; },
    neq(k: string, v: any) { rows = rows.filter((r) => r[k] !== v); return q; },
    gt(k: string, v: any) { rows = rows.filter((r) => r[k] > v); return q; },
    order(k: string, o?: any) { const s = o?.ascending === false ? -1 : 1; rows = [...rows].sort((a, b) => (a[k] > b[k] ? s : a[k] < b[k] ? -s : 0)); return q; },
    limit(n: number) { rows = rows.slice(0, n); return q; },
    maybeSingle: () => Promise.resolve({ data: done()[0] ?? null, error: null }),
    single: () => Promise.resolve({ data: done()[0] ?? null, error: null }),
    then: (res: any, rej: any) => Promise.resolve({ data: head ? null : done(), count: rows.length, error: null }).then(res, rej),
  };
  return q;
}

export const demoClient: any = {
  from,
  rpc: (fn: string, args: Row = {}) => {
    if (!state.me) return Promise.resolve({ data: null, error: { message: "unauthorized" } });
    if (fn.startsWith("admin_") || fn === "finalize_cohort") if (!isAdmin()) return Promise.resolve({ data: null, error: { message: "forbidden" } });
    const f = rpcs[fn];
    return Promise.resolve(f ? { data: f(args), error: null } : { data: null, error: { message: `데모에서 지원하지 않는 기능: ${fn}` } });
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: state.me ? { user: { id: state.me, email: `${state.me}@demo.kr` } } : null } }),
    onAuthStateChange: (cb: any) => { state.listeners.push(cb); return { data: { subscription: { unsubscribe: () => { state.listeners = state.listeners.filter((x) => x !== cb); } } } }; },
    signInWithPassword: ({ email }: { email: string }) => {
      const id: PersonaId = /admin/i.test(email) ? "admin1" : /new/i.test(email) ? "new1" : "u1";
      setPersona(id); return Promise.resolve({ error: null });
    },
    signOut: () => { setPersona(null); return Promise.resolve({ error: null }); },
  },
};
