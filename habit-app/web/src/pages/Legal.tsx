import { Link, useLocation } from "react-router-dom";
import { useAsync } from "../lib/hooks";
import { rpc } from "../lib/supabase";
import type { PublicInfo } from "../lib/types";
import { Spinner } from "../components/ui";
import { won } from "../lib/format";

// S11: 로그인 없이 열람. 설계서 10장(참여 규정)·11장(개인정보) 문구.
export function useInfo() { return useAsync(() => rpc<PublicInfo>("get_public_info")); }

export function RulesText({ i }: { i: PublicInfo }) {
  const total = i.fee_amount + i.deposit_amount;
  return (
    <ol className="list-decimal space-y-3 pl-5">
      <li><b>참여 비용</b>: 참가비 {won(i.fee_amount)}(최초 1회)과 보증금 {won(i.deposit_amount)}, 합계 {won(total)}을 신청 시 입금합니다. 참가비는 다시 내지 않습니다.</li>
      <li><b>기수</b>: 1기수는 28일이며 월요일에 시작합니다. 참가자는 1~3개의 목표 습관을 정하고, 그중 하나만 실천해도 그날을 인증할 수 있습니다.</li>
      <li><b>인증</b>: 앱에서 매일 {i.checkin_start}~{i.checkin_end}(한국시간)에만 하루 1회 인증합니다. 인증 시각은 서버 시각을 기준으로 하며, 지난 날짜의 인증과 취소는 할 수 없습니다. 인증 사진은 단톡방에 올립니다.</li>
      <li><b>결과와 보증금</b>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>28일 중 20일 이상 인증: 보증금이 유지되고 다음 기수로 자동 연장됩니다.</li>
          <li>18~19일 인증: 보증금 1만원이 차감되며, 다음 기수를 이어가려면 1만원을 추가 입금합니다.</li>
          <li>17일 이하 인증: 보증금 2만원이 차감되며, 다음 기수를 이어가려면 2만원을 다시 입금합니다.</li>
        </ul></li>
      <li><b>자동 연장과 중단</b>: 중단 신청을 하지 않으면 다음 기수로 자동 연장됩니다. 중단은 기수 25일차부터 28일차 23:59까지 앱에서 신청하며, 기수 종료 후 남은 보증금을 환급해 드립니다.</li>
      <li><b>추가 입금 기한</b>: 추가 입금이 필요한 경우 다음 기수 시작일 다음 다음 날(수요일) 23:59까지 입금해야 하며, 기한 내 입금하지 않으면 연장이 종료되고 해당 기수 참여가 취소됩니다. 종료 후 남은 보증금은 종료일부터 90일 이내에 환급을 신청할 수 있습니다.</li>
      <li><b>환불 제한</b>: 기수가 시작(월요일 00:00)된 후에는 환불되지 않으며, 중도에 포기하는 경우에도 환불되지 않습니다. 기수 시작 전에는 운영자에게 요청하시면 입금액 전액을 환불해 드립니다.</li>
      <li><b>허위 인증</b>: 실제로 실천하지 않고 인증한 사실이 확인되면 운영자가 해당 기수의 성공 인정을 취소할 수 있습니다.</li>
      <li><b>운영 종료</b>: 부행일치 운영을 종료하는 경우 종료 4주 전에 공지하며, 참가자의 남은 보증금은 전액 환급합니다.</li>
      <li><b>단톡방</b>: 입금이 확인되면 시작 전 토요일부터 앱에서 단톡방 링크를 안내합니다.</li>
      <li><b>문의</b>: {i.operator_name || "운영자"} {i.operator_contact_email && `(${i.operator_contact_email})`}</li>
    </ol>
  );
}

export function PrivacyConsentText() {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      <li><b>수집 항목</b>: 이메일, 비밀번호(암호화하여 저장), 성명, 닉네임, 연락처. 신청·입금 시 입금자명, 이용 중 습관 내용과 인증 기록. 환급 신청 시 은행명·계좌번호·예금주.</li>
      <li><b>목적</b>: 회원 식별과 로그인, 챌린지 신청·입금 확인, 인증 관리, 정산과 보증금 환급, 단톡방 안내 등 서비스 공지.</li>
      <li><b>보유·이용 기간</b>: 회원 종료(탈퇴) 시까지. 환급계좌는 환급 완료 즉시 파기. 입금·정산 기록은 관련 법령이 정한 기간 동안 보관 후 파기.</li>
      <li><b>거부 권리와 불이익</b>: 동의를 거부할 수 있으나, 필수 항목에 동의하지 않으면 가입과 참여가 제한됩니다.</li>
      <li><b>제3자 제공</b>: 없음.</li>
    </ul>
  );
}

export default function Legal({ kind }: { kind: "terms" | "privacy" }) {
  const { data: i, loading } = useInfo();
  const { pathname } = useLocation();
  if (loading || !i) return <Spinner />;
  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <Link to="/" className="text-sm underline">← 돌아가기</Link>
      <h1 className="mb-1 mt-3 text-xl font-bold">{kind === "terms" ? "부행일치 참여 규정" : "개인정보 처리방침"}</h1>
      <p className="mb-4 text-sm text-ink/70">버전 {kind === "terms" ? i.terms_version : i.privacy_version}</p>
      {kind === "terms" ? <RulesText i={i} /> : (
        <div className="space-y-5 text-sm">
          <section><h2 className="mb-1 font-bold">1. 개인정보 수집·이용</h2><PrivacyConsentText /></section>
          <section><h2 className="mb-1 font-bold">2. 처리 위탁 및 국외 이전</h2>
            <p>서비스 운영을 위해 클라우드 서비스(Supabase: 데이터베이스·인증, 서울 리전 / Cloudflare: 웹 호스팅)를 이용합니다. 이전되는 항목은 위 수집 항목 전체이며, 서비스 이용 기간 동안 보관됩니다. 실제 이전 국가와 근거는 서비스 이용 계약 및 법령 기준에 맞게 운영자가 확정하여 갱신합니다.</p></section>
          <section><h2 className="mb-1 font-bold">3. 정보주체의 권리</h2>
            <p>열람·정정·삭제·처리정지를 요구할 수 있으며, 아래 운영자 이메일로 요청해 주세요. 닉네임은 앱의 마이 화면에서 직접 수정할 수 있습니다.</p></section>
          <section><h2 className="mb-1 font-bold">4. 개인정보 처리 책임자</h2>
            <p>{i.operator_name || "운영자"} {i.operator_contact_email && `(${i.operator_contact_email})`}</p></section>
          <section><h2 className="mb-1 font-bold">5. 시행일과 버전</h2><p>버전 {i.privacy_version}. 동의 시 버전과 시각이 기록됩니다.</p></section>
        </div>
      )}
      <p className="mt-6 text-sm text-ink/70">{pathname === "/terms" ? <Link to="/privacy" className="underline">개인정보 처리방침 보기</Link> : <Link to="/terms" className="underline">참여 규정 보기</Link>}</p>
    </div>
  );
}
