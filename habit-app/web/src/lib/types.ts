export type Profile = { id: string; email: string; name: string; nickname: string; phone: string; role: "member" | "admin" };

export type Membership = {
  user_id: string; status: "applied" | "active" | "ended"; fee_paid: boolean; deposit_balance: number;
  stop_requested: boolean; refund_bank: string | null; refund_account: string | null; refund_holder: string | null;
  refund_requested_at: string | null; refund_done_at: string | null; ended_at: string | null;
};

export type Cohort = {
  no: number; start_date: string; end_date: string; recruiting_open: boolean;
  apply_deadline: string | null; finalized_at: string | null;
};

export type Payment = {
  id: number; user_id: string; cohort_no: number; kind: "initial" | "topup"; amount: number;
  depositor_name: string | null; status: "awaiting" | "claimed" | "confirmed" | "rejected"; created_at: string; confirmed_at: string | null;
};

export type Home = {
  phase: "none" | "ended" | "before_start" | "in_cohort";
  membership_status?: string; next_cohort_start?: string | null;
  cohort_no?: number; start_date?: string; end_date?: string; day_no?: number | null; days_left?: number;
  habits?: string[]; count?: number; goal?: number; percent?: number;
  checked_today?: boolean; can_checkin?: boolean;
  participation_status?: "pending_payment" | "topup_pending" | "active" | "void"; topup_due_at?: string | null;
  chat?: { url: string; password: string } | null;
};

export type ApplyInfo = {
  amount: number; bank_name: string; bank_account: string; bank_holder: string;
  cohorts: { no: number; start_date: string; end_date: string; apply_deadline: string | null }[];
};

export type PublicInfo = {
  operator_name: string; operator_contact_email: string; terms_version: string; privacy_version: string;
  fee_amount: number; deposit_amount: number; checkin_start: string; checkin_end: string;
  refund_claim_days: number; stop_from_day: number; success_min: number; partial_min: number;
};

export type AdminParticipant = {
  user_id: string; name: string; nickname: string; phone: string; email: string; membership_status: string;
  deposit_balance: number; fee_paid: boolean; stop_requested: boolean; participation_status: string;
  result: "pending" | "success" | "partial" | "fail"; revoked: boolean; topup_due_at: string | null;
  checkin_count: number; topup_amount: number | null;
};
