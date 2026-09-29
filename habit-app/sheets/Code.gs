/**
 * 부행일치 → 구글 스프레드시트 읽기 전용 사본 (시트에 바인딩한 Apps Script)
 *
 * 설치
 * 1) 새 구글 시트를 만들고 확장 프로그램 → Apps Script 에 이 파일을 붙여 넣는다.
 * 2) 프로젝트 설정 → 스크립트 속성에 아래 두 값을 추가한다. (코드에 직접 쓰지 말 것)
 *      EXPORT_URL   = https://<프로젝트ref>.supabase.co/functions/v1/export-sheet
 *      EXPORT_TOKEN = 관리자 화면 → 설정 → '새 토큰 발급'으로 받은 값
 * 3) syncNow 를 한 번 실행해 권한을 승인한다.
 * 4) 트리거 → 시간 기반 → 매일 오전 6~7시 syncNow 를 추가한다. (수동은 시트 메뉴 '부행일치 → 지금 갱신')
 *
 * 원본은 앱 DB이며 시트에서 수정해도 앱에 반영되지 않는다. 계좌번호·비밀번호는 내보내지 않는다.
 * 시트 공유 범위는 운영자 계정 단독으로 유지할 것.
 */
var TABS = {
  '참가자': { key: 'participants', cols: [['name', '성명'], ['nickname', '닉네임'], ['phone', '연락처'], ['status', '상태'], ['deposit_balance', '보증금 잔액'], ['fee_paid', '참가비 납부']] },
  '기수별 인증': { key: 'checkins', cols: [['cohort_no', '기수'], ['name', '성명'], ['nickname', '닉네임'], ['count', '인증 횟수'], ['result', '결과'], ['status', '참여 상태']] },
  '입금 내역': { key: 'payments', cols: [['created_at', '일시'], ['depositor_name', '입금자명'], ['amount', '금액'], ['kind', '종류'], ['status', '상태'], ['cohort_no', '기수']] },
  '정산 결과': { key: 'settlement', cols: [['cohort_no', '기수'], ['result', '결과'], ['people', '인원']] },
  '환급 대상': { key: 'refunds', cols: [['name', '이름'], ['amount', '금액'], ['state', '상태']] }
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('부행일치').addItem('지금 갱신', 'syncNow').addToUi();
}

function syncNow() {
  var props = PropertiesService.getScriptProperties();
  var res = UrlFetchApp.fetch(props.getProperty('EXPORT_URL'), {
    method: 'get',
    headers: { 'x-export-token': props.getProperty('EXPORT_TOKEN') },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('내보내기 실패: HTTP ' + res.getResponseCode());
  var data = JSON.parse(res.getContentText()).data;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (name) {
    var t = TABS[name], rows = data[t.key] || [];
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    sheet.clearContents(); // 탭을 덮어쓴다
    var values = [t.cols.map(function (c) { return c[1]; })];
    rows.forEach(function (r) { values.push(t.cols.map(function (c) { return r[c[0]] === null || r[c[0]] === undefined ? '' : r[c[0]]; })); });
    sheet.getRange(1, 1, values.length, t.cols.length).setValues(values);
    sheet.setFrozenRows(1);
  });
  SpreadsheetApp.getActiveSpreadsheet().toast('갱신 완료 ' + new Date().toLocaleString('ko-KR'));
}
