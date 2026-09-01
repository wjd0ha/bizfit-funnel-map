import {
  UserSituation,
  RevenueModel,
  FunnelOption,
  ExecutionBlueprint,
  FunnelType
} from './types';

/**
 * Natural Korean particle formatter to eliminate crude placeholders like "(을)를", "(이)가".
 */
function attachPostposition(word: string, type: '을/를' | '이/가' | '은/는' | '과/와'): string {
  if (!word || word.length === 0) return word;
  const lastChar = word.charCodeAt(word.length - 1);
  // Hangul Syllables range: 0xAC00 ~ 0xD7A3
  if (lastChar < 0xAC00 || lastChar > 0xD7A3) {
    // Non-hangul default fallback
    const fallbackMap = { '을/를': '를', '이/가': '가', '은/는': '는', '과/와': '와' };
    return `${word} ${fallbackMap[type]}`;
  }
  const hasJongseong = (lastChar - 0xAC00) % 28 !== 0;

  switch (type) {
    case '을/를':
      return hasJongseong ? `${word}을` : `${word}를`;
    case '이/가':
      return hasJongseong ? `${word}이` : `${word}가`;
    case '은/는':
      return hasJongseong ? `${word}은` : `${word}는`;
    case '과/와':
      return hasJongseong ? `${word}과` : `${word}와`;
  }
}

/**
 * Audit helper: Checks whether user has explicitly mentioned specific tool/format skills.
 */
function checkUserSkillMatch(situation: UserSituation, keywords: string[]): boolean {
  const combined = `${situation.career} ${situation.skills} ${situation.existingContent || ''}`.toLowerCase();
  return keywords.some(kw => combined.includes(kw.toLowerCase()));
}

/**
 * Dynamic demo data generator enforcing Provider vs Customer separation and skill auditing.
 */
export function generateDemoModels(
  situation: UserSituation,
  filterCondition?: string
): RevenueModel[] {
  const career = situation.career || '실무 경험';
  const skills = situation.skills || '보유 기술';

  const isDogGroomer = checkUserSkillMatch(situation, ['미용', '반려견', '애견', '강아지']);
  const isEcommerce = checkUserSkillMatch(situation, ['쇼핑몰', '스토어', '마켓', '온라인', 'CS', '발주']);
  const isNotionExcel = checkUserSkillMatch(situation, ['노션', '엑셀', '정리', '대시보드', '수식']);

  const supportsNotionExcel = isNotionExcel || checkUserSkillMatch(situation, ['노션', '엑셀']);
  const supportsCanva = checkUserSkillMatch(situation, ['캔바', '디자인', '카드뉴스', '포스터']);
  const supportsLecture = checkUserSkillMatch(situation, ['강의', '출강', '세미나', '교육']);

  const isNoFace = situation.faceExposure === 'not_allowed' || filterCondition?.includes('얼굴 노출 없이');
  const isNoLectureFilter = filterCondition?.includes('강의는 제외');

  let models: RevenueModel[] = [];

  // ==========================================
  // PROFILE A: 지역 서비스업 / 반려견 미용사
  // ==========================================
  if (isDogGroomer) {
    models = [
      {
        id: 'model-groomer-1',
        name: '초보 반려견 보호자를 위한 1:1 셀프 위생케어 실습 레슨',
        providerProfile: {
          careerSummary: career,
          coreSkills: ['소형견 미용', '피부 케어', '위생 관리 안심 지도']
        },
        targetCustomer: '반려견을 처음 키워 발톱 정리, 귀 청소, 빗질 등 홈 위생케어에 큰 스트레스를 느끼는 초보 보호자',
        customerProblem: '집에서 잘못 관리하여 아이가 다치거나 미용실 방문 시 극심한 스트레스를 받는 불안감',
        recommendedFormat: '1:1 방문 또는 매장 맞춤 실습 코칭 (60분)',
        matchReason: `${career} 경험에서 얻은 안전한 위생 관리 노하우를 바탕으로, 불안한 초보 보호자에게 즉각적인 실습 가치를 제공합니다.`,
        preparationItems: ['안전 발톱 깎이 및 귀 청소 도구 세트', '부위별 위생 관리 가이드 체크리스트', '1:1 실습 신청 구글 폼'],
        prepDuration: '2~3일',
        scores: { difficulty: 2, costBurden: 1, validationEase: 5, operationBurden: 3 },
        scoreRationale: '별도 장비 구입 없이 기존 미용 도구와 노하우로 즉시 제공할 수 있으며 첫 보호자 고객 검증이 매우 빠릅니다.',
        riskOrAssumption: '보호자가 직접 아이를 다룰 때 다치지 않도록 안전 수칙 안내문을 사전에 준비해야 합니다.'
      },
      {
        id: 'model-groomer-2',
        name: '반려견 피부·모질 상태 1:1 맞춤 진단 및 케어 솔루션 리포트',
        providerProfile: {
          careerSummary: career,
          coreSkills: ['견종별 모질 진단', '피부 자극 최소화 케어']
        },
        targetCustomer: '반려견의 털 엉킴, 비듬, 습진 문제로 어떤 샴푸나 관리법을 써야 할지 고민하는 보호자',
        customerProblem: '인터넷의 정보가 너무 많아 우리 아이 피부 타입에 맞는 관리 기준을 찾기 어려움',
        recommendedFormat: '1:1 피부 상태 진단 세션 (30분) + 맞춤 케어 가이드 리포트',
        matchReason: '현장에서 수많은 아이들의 모질을 접해본 관찰 노하우를 진단 서비스로 상품화할 수 있습니다.',
        preparationItems: ['피부/모질 자가 진단 질문지', '견종별 홈 케어 팁 PDF 파일', '진단 결과 양식'],
        prepDuration: '3일',
        scores: { difficulty: 2, costBurden: 1, validationEase: 4, operationBurden: 2 },
        scoreRationale: '미용 전후 상담 시간을 활용하거나 텍스트/사진 진단으로 전달할 수 있어 부담이 적습니다.',
        riskOrAssumption: '의학적 수의사 진료가 아닌 "일상 위생 및 피부 관리 가이드"임을 명확히 안내해야 합니다.'
      },
      {
        id: 'model-groomer-3',
        name: '미용 적응이 어려운 예비 민감견을 위한 스트레스 완화 케어 컨설팅',
        providerProfile: {
          careerSummary: career,
          coreSkills: ['민감견 둔감화 적응 케어', '입마개/미용 거부 완화']
        },
        targetCustomer: '입질이나 거부 반응으로 일반 미용실에서 거부당하거나 미용 후 며칠간 밥을 안 먹는 아이의 보호자',
        customerProblem: '반려견의 미용 거부 반응 때문에 보호자와 아이 모두 큰 마음의 상처를 입음',
        recommendedFormat: '30분 1:1 맞춤 상담 + 단계별 둔감화 훈련 가이드',
        matchReason: '전문 미용사의 경험을 바탕으로 민감한 아이들의 행동 패턴을 파악해 실질적 가이드를 제공합니다.',
        preparationItems: ['미용 거부 원인 분석 질문지', '단계별 둔감화 행동 가이드북'],
        prepDuration: '3~4일',
        scores: { difficulty: 3, costBurden: 1, validationEase: 4, operationBurden: 3 },
        scoreRationale: '통증이 명확한 고관여 문제이므로 보호자의 첫 구매 결정 및 추천 전환이 용이합니다.',
        riskOrAssumption: '행동 교정 전문가가 아닌 "미용 적응을 위한 환경 가이드" 범위로 정의해야 합니다.'
      }
    ];
  }

  // ==========================================
  // PROFILE B: 사무·기획 실무자 / 5년 차 온라인 쇼핑몰 운영자
  // ==========================================
  else if (isEcommerce) {
    models = [
      {
        id: 'model-ecom-1',
        name: '초보 1인 마켓 대표를 위한 CS 응대 및 발주 세팅 1:1 맞춤 진단',
        providerProfile: {
          careerSummary: career,
          coreSkills: ['쇼핑몰 운영 실무', 'CS 답변 템플릿', '발주 모니터링']
        },
        targetCustomer: '쇼핑몰을 막 오픈했으나 반복되는 고객 문의 처리와 발주 누락으로 하루를 소비하는 초보 1인 창업자',
        customerProblem: 'CS 응대 기준이 없어 고객 컴플레인에 스트레스를 받고 정작 마케팅에 쏟을 시간이 부족함',
        recommendedFormat: '60분 온라인 줌 진단 + CS 매뉴얼 가이드',
        matchReason: `${career} 경험에서 검증된 실수 방지 세팅법을 전달하여 초기 쇼핑몰 대표의 시간을 효율화해 줍니다.`,
        preparationItems: ['CS 자주 묻는 질문 20선 양식', '발주 모니터링 체크리스트', '줌 상담 링크'],
        prepDuration: '3일',
        scores: { difficulty: 2, costBurden: 1, validationEase: 5, operationBurden: 3 },
        scoreRationale: '현업 실무 지식 기반 서비스로 별도 초기 비용 없이 바로 첫 고객 결제 검증이 가능합니다.',
        riskOrAssumption: '상담 전 쇼핑몰 카테고리와 주요 고객 문의 유형을 사전에 제출받아야 맞춤 가이드가 가능합니다.'
      },
      {
        id: 'model-ecom-2',
        name: '초기 쇼핑몰 상품 상세페이지 전환 요소 1:1 진단 리포트',
        providerProfile: {
          careerSummary: career,
          coreSkills: ['상세페이지 구조 설계', '구매 전환 문구 구성']
        },
        targetCustomer: '상품을 등록하고 유입은 있으나 실제 구매 결제로 이어지지 않아 고민인 초기 셀러',
        customerProblem: '어떤 부분이 불친절하여 구매를 주저하는지 객관적 시선으로 파악하기 어려움',
        recommendedFormat: '상세페이지 1:1 피드백 리포트 (PDF 3~5페이지)',
        matchReason: '직접 쇼핑몰을 운영하며 쌓은 상세페이지 세팅 노하우를 객관적 피드백 리포트로 전달합니다.',
        preparationItems: ['구매 전환 요소 10가지 검수 체크리스트', '피드백 노션/PDF 양식'],
        prepDuration: '3~5일',
        scores: { difficulty: 2, costBurden: 1, validationEase: 4, operationBurden: 2 },
        scoreRationale: '텍스트와 캡처 기반 리포트로 제공할 수 있어 운영 시간이 일정하게 관리됩니다.',
        riskOrAssumption: '디자인 수정 외주가 아닌 "구매 전환 문맥 및 정보 구성 피드백"임을 사전 안내합니다.'
      },
      {
        id: 'model-ecom-3',
        name: '1인 셀러 전용 실수 방지 발주 & 재고 관리 세팅 가이드',
        providerProfile: {
          careerSummary: career,
          coreSkills: ['재고 수량 모니터링', '오발주 예방 실무']
        },
        targetCustomer: '수동으로 주문을 처리하다가 품절 반영 지연이나 오배송 실수를 겪은 초보 마켓 운영자',
        customerProblem: '재고 파악 불일치로 인한 오배송 및 고객 사과문 작성으로 인한 자괴감',
        recommendedFormat: '60분 맞춤 1:1 세팅 가이드 세션',
        matchReason: '실제 운영 과정에서 경험한 오발주 방지 체크포인트를 즉시 적용 가능한 가이드로 공유합니다.',
        preparationItems: ['발주 확인 및 재고 점검 체크리스트', '실수 방지 5단계 매뉴얼'],
        prepDuration: '3일',
        scores: { difficulty: 2, costBurden: 1, validationEase: 4, operationBurden: 2 },
        scoreRationale: '초보 운영자들의 가장 긴급한 실무 사고를 방지해 주어 서비스 필요성을 공감받기 쉽습니다.',
        riskOrAssumption: '특정有料 ERP 프로그램 강매가 아닌 1인 사업자용 기본 관리 체크포인트 위주여야 합니다.'
      }
    ];
  }

  // ==========================================
  // PROFILE C: 취미·교육 경험 보유자 / 노션·엑셀 실무자
  // ==========================================
  else if (isNotionExcel) {
    models = [
      {
        id: 'model-notion-1',
        name: '프리랜서 및 1인 크리에이터 전용 노션 업무 통합 대시보드 세팅 가이드',
        providerProfile: {
          careerSummary: career,
          coreSkills: ['노션 수식 활용', '프로젝트 DB 연동', '일정 통합 정리']
        },
        targetCustomer: '여러 프로젝트 일정과 매출 장부, 작업 자료가 흩어져 관리에 스트레스를 받는 1인 프리랜서',
        customerProblem: '업무 일정이 꼬이거나 미팅 노트를 찾지 못해 작업 효율이 떨어지고 누락이 발생함',
        recommendedFormat: '노션 템플릿 복제 링크 + 10분 화면 녹화 사용 안내 영상',
        matchReason: `${career} 경험에서 다져진 데이터 정리 기술을 복제 가능한 디지털 자산 형태로 공유합니다.`,
        preparationItems: ['완성형 프리랜서 통합 대시보드 노션 템플릿', 'Loom/OBS 활용 가이드 영상'],
        prepDuration: '3~5일',
        scores: { difficulty: 2, costBurden: 1, validationEase: 4, operationBurden: 1 },
        scoreRationale: '제작 후 반복 전달만으로 운영이 가능하여 시간 대비 효율성이 뛰어납니다.',
        riskOrAssumption: '노션 기초 사용법을 모르는 사용자를 위해 1페이지 기본 조작 안내서를 동봉해야 합니다.'
      },
      {
        id: 'model-notion-2',
        name: '초보 자영업자를 위한 엑셀/노션 손익 및 고정비 자동 계산 양식',
        providerProfile: {
          careerSummary: career,
          coreSkills: ['엑셀 자동 계산 수식', '손익 구분 정리']
        },
        targetCustomer: '매달 통장 잔고와 실제 순이익이 맞지 않아 정확한 이익률을 파악하고 싶은 소상공인',
        customerProblem: '복잡한 회계 프로그램은 어렵고 엑셀 수식을 다루지 못해 감으로 장부를 작성함',
        recommendedFormat: '간편 손익 계산 양식 + 1:1 입력 가이드 30분',
        matchReason: '숫자 정리에 익숙하지 않은 소상공인에게 필수 수식이 입력된 쉬운 장부를 제공합니다.',
        preparationItems: ['수식 적용 완료된 엑셀/노션 파일', '샘플 입력 데이터'],
        prepDuration: '3일',
        scores: { difficulty: 2, costBurden: 1, validationEase: 5, operationBurden: 2 },
        scoreRationale: '돈이 새는 구간을 찾아주는 명확한 가치가 있어 빠른 검증이 가능합니다.',
        riskOrAssumption: '세무 신고용 장부가 아닌 "일상 경영 손익 파악용 참고 양식"임을 명시합니다.'
      }
    ];
  }

  // ==========================================
  // GENERAL FALLBACK MODELS (Audited & Safe)
  // ==========================================
  else {
    models = [
      {
        id: 'model-general-1',
        name: `${career} 경험 기반 문제 해결 1:1 맞춤 진단 세션`,
        providerProfile: {
          careerSummary: career,
          coreSkills: [skills]
        },
        targetCustomer: `${career} 분야에서 시행착오를 겪으며 해결책을 찾지 못해 막막한 초보자`,
        customerProblem: '혼자 검색하면 정보가 쏟아져 내 상황에 맞는 우선순위를 정하지 못함',
        recommendedFormat: '60분 온라인 1:1 맞춤 진단 (줌 또는 텍스트 피드백)',
        matchReason: `${career}에서 얻은 실무 경험을 활용해 즉각적인 문제 분석을 제공할 수 있는 가장 가벼운 형태입니다.`,
        preparationItems: ['사전 질문지 (Google Form)', '60분 진단 체크리스트', '실행 리포트 양식'],
        prepDuration: '2~3일',
        scores: { difficulty: 2, costBurden: 1, validationEase: 5, operationBurden: 3 },
        scoreRationale: '비용 부담 없이 소수 고객을 대상으로 즉시 결제 가치를 검증할 수 있습니다.',
        riskOrAssumption: '무료 상담으로 흐르지 않도록 10분 사전 질문 확인 후 유료 진단으로 연결해야 합니다.'
      },
      {
        id: 'model-general-2',
        name: `${skills} 핵심 노하우 실무가이드 & 체크리스트`,
        providerProfile: {
          careerSummary: career,
          coreSkills: [skills]
        },
        targetCustomer: `${skills} 관련 작업을 빠르게 마치고 싶지만 노하우가 부족해 시간이 오래 걸리는 사람`,
        customerProblem: '작업 순서를 몰라 같은 과정을 여러 번 반복하며 시간을 낭비함',
        recommendedFormat: 'PDF 디지털 가이드북 (15~20페이지)',
        matchReason: '직접 시간을 들이지 않고 체계화된 글로 작성해 전달할 수 있습니다.',
        preparationItems: ['가이드북 노션/워드 작성 원본', '요약 체크리스트 PDF'],
        prepDuration: '3~5일',
        scores: { difficulty: 2, costBurden: 1, validationEase: 4, operationBurden: 1 },
        scoreRationale: '제작 후 반복 전달이 가능하여 운영 부담이 적습니다.',
        riskOrAssumption: '단순 이론이 아니라 "당장 이번 주 적용할 수 있는 체크리스트"가 포함되어야 합니다.'
      },
      {
        id: 'model-general-3',
        name: `${career} 문제 해결 소규모 실습 워크숍`,
        providerProfile: {
          careerSummary: career,
          coreSkills: [skills]
        },
        targetCustomer: '혼자 실습하기 어렵고 피드백을 받으며 결과물을 완성하고 싶은 예비 사업자',
        customerProblem: '혼자 시도하다 막히면 중단되어 완성작을 만들어본 경험이 부족함',
        recommendedFormat: '3~5인 소규모 실습 세션 (90분)',
        matchReason: '참가자가 직접 결과물을 손에 쥐고 돌아가게 만들어 높은 만족도를 형성합니다.',
        preparationItems: ['실습 교안 슬라이드', '실습용 샘플 파일'],
        prepDuration: '4~5일',
        scores: { difficulty: 3, costBurden: 1, validationEase: 4, operationBurden: 3 },
        scoreRationale: '소수 참가자로 빠르게 검증할 수 있습니다.',
        riskOrAssumption: '이론 설명 위주가 아닌 "완성물 만들기" 실습 중심으로 진행해야 합니다.'
      }
    ];
  }

  // Auditing: Remove unmentioned tool formats if requested
  if (isNoLectureFilter) {
    models = models.filter(m => !m.recommendedFormat.includes('강의') && !m.recommendedFormat.includes('특강'));
  }

  if (isNoFace) {
    models = models.map(m => ({
      ...m,
      matchReason: `${m.matchReason} (얼굴 노출 부담 없는 비대면/텍스트/자료 기반)`,
      scores: {
        ...m.scores,
        difficulty: Math.max(1, m.scores.difficulty - 1)
      }
    }));
  }

  return models;
}

export function getFunnelOptions(situation: UserSituation): FunnelOption[] {
  const goal = situation.primaryGoal;

  return [
    {
      type: 'validation',
      title: '검증형 퍼널',
      subtitle: '사전 질문 ➔ 유료 미니 서비스 ➔ 후기·개선',
      description: '고객의 진짜 통증을 1:1로 확인하며 소규모로 판매하고 피드백을 수집하는 퍼널입니다.',
      bestSuitedFor: '첫 유료 고객 결제를 가장 빠르게 경험하고 반응을 확인하고 싶은 분',
      prepNeeded: ['고객 사전 진단 질문지 (5개)', '60분 미니 서비스 구성안', '후기 수집 양식'],
      cautions: ['무료 상담으로 흘러가지 않도록 사전 질문 확인 후 유료 서비스로 연결되는 선을 명확히 하세요.'],
      isRecommended: goal === 'first_paying_customer',
      recommendReason: '가장 시급한 목표인 첫 유료 결제 검증에 최적화된 퍼널입니다.'
    },
    {
      type: 'lead_gen',
      title: '리드 수집형 퍼널',
      subtitle: '무료 체크리스트 ➔ 연락처 확보 ➔ 저가 제안 ➔ 핵심 서비스',
      description: '무료 유용한 자료를 제공해 잠재 고객의 접점을 모은 후 단계별로 결제를 유도하는 퍼널입니다.',
      bestSuitedFor: '블로그, 인스타 등 기존 유입 채널이 있거나 잠재 고객 명단을 차근차근 모으고 싶은 분',
      prepNeeded: ['3~5페이지 PDF 체크리스트', '자료 신청 구글 폼/카카오 폼', '신청 안내 메시지'],
      cautions: ['자료만 받고 반응이 없는 상황을 방지하기 위해 자료 신청 48시간 내 저가 상품 안내를 함께 전달하세요.'],
      isRecommended: goal === 'increase_customers' || !!situation.channels,
      recommendReason: '기존 유입 채널을 살려 잠재 고객 명단을 지속적으로 쌓을 수 있습니다.'
    },
    {
      type: 'workshop',
      title: '워크숍형 퍼널',
      subtitle: '소규모 실습 특강 ➔ 실습 완성 ➔ 심화 케어 연계',
      description: '실습 과정을 함께 진행해 신뢰를 다진 뒤, 지속 관리가 필요한 고객을 심화 서비스로 연결합니다.',
      bestSuitedFor: '이론 설명보다 실습을 같이 하여 결과물을 만들어줄 때 가치가 큰 분야',
      prepNeeded: ['60분 실습 교안', '신청용 간이 안내서', '실습 후 심화 연계 혜택안'],
      cautions: ['복잡한 이론보다 한 가지 명확한 결과물을 완성하는 데만 집중하세요.'],
      isRecommended: goal === 'monthly_side_income',
      recommendReason: '소수 참가자 모집으로 참가가치와 후속 서비스 연계를 동시에 기대할 수 있습니다.'
    },
    {
      type: 'local_repeat',
      title: '지역·단골형 퍼널',
      subtitle: '지역 채널/기존 인맥 ➔ 첫 체험 제안 ➔ 정기 관리',
      description: '당근마켓, 오프라인 모임, 기존 고객 접점을 활용해 가까운 고객에게 첫 서비스를 경험하게 합니다.',
      bestSuitedFor: '지역 기반 소상공인, 오프라인 서비스, 인적 네트워크 활용이 가능한 분',
      prepNeeded: ['지역 전용 특별 안내문', '첫 이용 혜택 쿠폰', '재방문 케어 안내서'],
      cautions: ['단순 일회성 할인이 아니라 정기 관리로 연결될 수 있는 장치를 마련하세요.'],
      isRecommended: situation.channels?.includes('당근') || situation.channels?.includes('오프라인'),
      recommendReason: '광고비 없이 가까운 지역 채널을 활용해 즉각적인 반응을 얻을 수 있습니다.'
    },
    {
      type: 'digital_prod',
      title: '디지털 상품형 퍼널',
      subtitle: '미니 가이드/양식 ➔ 첫 결제 ➔ 심화 자료 또는 케어',
      description: '가이드북, 노션 양식 등 파일 형태로 첫 결제를 유도하고 효율적 구조를 테스트합니다.',
      bestSuitedFor: '얼굴 노출 부담 없이 시간 대비 효율적인 디지털 서비스를 구상하는 분',
      prepNeeded: ['바로 활용 가능한 파일 원본', '활용 가이드 1페이지', '판매 안내 링크'],
      cautions: ['디지털 상품은 사서 바로 쓸 수 있는 완성도가 핵심입니다. 설명서를 꼼꼼히 첨부하세요.'],
      isRecommended: situation.faceExposure === 'not_allowed' || goal === 'reduce_repetitive_work',
      recommendReason: '얼굴 노출 부담 없이 시간 대비 효율적인 자산 구조를 테스트할 수 있습니다.'
    }
  ];
}

export function generateDemoBlueprint(
  situation: UserSituation,
  model: RevenueModel,
  funnelType: FunnelType
): ExecutionBlueprint {
  const career = situation.career || '실무 경험';
  const skills = situation.skills || '보유 기술';
  const target = model.targetCustomer;
  const problem = model.customerProblem || model.problemSolved || '해결이 필요한 문제';
  const offer = model.name;
  const hours = situation.availableHours || 5;

  const targetTopic = attachPostposition(target, '은/는');

  return {
    hypothesis: {
      providerRole: `${career} (${skills})`,
      targetCustomer: target,
      customerProblem: problem,
      proposedOffer: offer,
      transformation: '시행착오 없이 명확한 관리 기준 수립',
      oneLiner: `${targetTopic} ${attachPostposition(problem, '을/를')} 겪을 때, ${career} 경험을 바탕으로 한 ${offer}를 제공하여 시행착오를 줄인다.`
    },
    smallestValidation: {
      weeklyActions: [
        '타깃 고객이 서식하는 채널(소모임/오픈채팅/블로그)에 대표적인 통증 관련 글 1개 게시하기',
        '관심을 보인 잠재 고객 3명에게 사전 질문지를 전달하고 실제 반응 확인하기',
        '피드백을 바탕으로 1페이지 분량의 유료 서비스 안내서 작성하기'
      ],
      channels: [
        situation.channels ? `현재 활용 중인 채널 (${situation.channels})` : '주요 네이버 블로그 / 인스타그램 / 오픈채팅',
        '타깃 고객 모임 채널 (당근 동네생활 / 소모임 / 카페)'
      ],
      validationQuestions: [
        '이 문제를 해결하기 위해 최근 3개월 내에 돈이나 시간을 써보신 적이 있나요?',
        '이 서비스나 가이드가 있다면 가장 먼저 확인하고 싶은 항목은 무엇인가요?',
        '이 서비스의 참고 가격 범위(예: 3만원~5만원대, 가격 검증 필요)에 대해 어떻게 느끼시나요?'
      ],
      passCriteria: '안내서 노출 후 3명 이상 질문 문의 접수 또는 1명 이상 실제 유료 예약 결제 시 통과'
    },
    salesFlow: [
      {
        stepNumber: 1,
        stepName: '관심 유입 및 문제 환기',
        productOrOffer: '문제 해결 체크리스트 / 사전 진단 질문지',
        referencePrice: '0원 (무료 유입)',
        cta: '무료 체크리스트 받기 / 사전 질문지 작성',
        operationMethod: '소셜 미디어 게시물 또는 커뮤니티 안내글',
        recommendedChannel: situation.channels || '네이버 블로그 / 인스타그램'
      },
      {
        stepNumber: 2,
        stepName: '첫 유료 검증 제안',
        productOrOffer: offer,
        referencePrice: '30,000원 ~ 50,000원 (가격 검증 필요)',
        cta: '선착순 5명 한정 맞춤 서비스 신청하기',
        operationMethod: '1페이지 안내서 또는 구글 폼',
        recommendedChannel: '카카오톡 1:1 오픈채팅 / 구글 폼'
      },
      {
        stepNumber: 3,
        stepName: '서비스 제공 및 후기 수집',
        productOrOffer: '60분 맞춤 서비스 진행 + 실습/리포트 전달',
        referencePrice: '첫 유료 결제 포함',
        cta: '솔직한 후기 작성 시 추가 체크리스트 증정',
        operationMethod: '온라인 줌(Zoom) 또는 텍스트 리포트 전달',
        recommendedChannel: '줌 / 노션 / 카카오톡'
      },
      {
        stepNumber: 4,
        stepName: '심화 연계 안내',
        productOrOffer: '지속 케어 및 심화 프로그램 안내',
        referencePrice: '150,000원 ~ 300,000원 (가격 검증 필요)',
        cta: '다음 단계 심화 케어 신청 문의',
        operationMethod: '만족한 고객 대상 개인화 제안',
        recommendedChannel: '1:1 메시지 / 이메일'
      }
    ],
    fourteenDayPlan: [
      {
        dayRange: 'Day 1 ~ 2',
        actionTitle: '타깃 고객 정의 및 핵심 오퍼 한 줄 작성',
        details: '공급자의 경력과 구분된 결제 고객의 통증 및 서비스 범위를 문서로 정리',
        completionCriteria: '한 줄 가설 문서 완성 및 검증 질문 3개 정리'
      },
      {
        dayRange: 'Day 3 ~ 4',
        actionTitle: '무료 체크리스트 & 사전 질문지 구글 폼 생성',
        details: '고객이 쉽게 답할 수 있는 5가지 질문으로 진단 폼 생성',
        completionCriteria: '진단지 링크 생성 및 테스트 제출 완료'
      },
      {
        dayRange: 'Day 5 ~ 7',
        actionTitle: '첫 유입 콘텐츠 2개 작성 및 채널 배포',
        details: `주당 ${hours}시간의 예산에 맞춰 블로그 또는 SNS 게시물 배포`,
        completionCriteria: '콘텐츠 게시 완료 및 댓글/조회수 반응 기록'
      },
      {
        dayRange: 'Day 8 ~ 9',
        actionTitle: '유료 서비스 1페이지 안내서 작성',
        details: '서비스 범위, 제공물, 가격 범위(가격 검증 필요 명시) 작성',
        completionCriteria: '안내서 완성 및 신청 버튼 작동 확인'
      },
      {
        dayRange: 'Day 10 ~ 12',
        actionTitle: '관심 고객 대상 1:1 제안 및 예약 접수',
        details: '사전 질문 제출 고객 3명에게 1:1 메시지로 혜택 안내',
        completionCriteria: '최소 1명 이상 실제 유료 결제 또는 가격 피드백 수집'
      },
      {
        dayRange: 'Day 13 ~ 14',
        actionTitle: '첫 검증 결과 회고 및 사업 가설 수정',
        details: '고객 반응과 피드백을 종합하여 다음 실행 방향 수정',
        completionCriteria: '실행 회고록 작성 및 다음 2주 목표 수립'
      }
    ],
    artifacts: {
      firstTouchpoint: {
        titles: [
          `[무료] ${career} 전문가가 알려주는 초보자를 위한 3가지 시행착오 체크리스트`,
          `혼자 고민하지 마세요: 10분 만에 끝내는 현 상태 셀프 진단표`,
          `주 ${hours}시간 투자로 첫 유료 결제를 반응 검증하는 작은 가이드`
        ],
        structure: [
          '1. 문제 제기: 지금 겪는 어려움의 진짜 이유',
          '2. 핵심 진단: 5가지 항목으로 보는 현재 상태',
          '3. 실천 팁: 당장 이번 주 적용할 수 있는 1가지 팁',
          '4. 다음 단계: 1:1 맞춤 서비스로 정확히 해결하기'
        ],
        cta: '👉 지금 1분 셀프 진단표 작성하고 맞춤 가이드 받기'
      },
      firstProductOffer: {
        scope: `${offer} — 60분 1:1 맞춤 케어 및 실행 가이드 제공`,
        deliverables: [
          '60분 1:1 맞춤 서비스 세션 (또는 텍스트 리포트)',
          '당장 실행할 3가지 행동 가이드 리포트',
          '실무에 바로 활용하는 체크리스트 1종'
        ],
        excludedScope: [
          '직접 대행 및 전체 외주 작업 (별도 대행 패키지 문의)',
          '법률·세무·의료 관련 전문 판단',
          '단기 수익 보장 및 수치 확언'
        ],
        priceValidationQuestions: [
          '이 60분 맞춤 서비스와 리포트에 3만원~5만원 가격 범위가 제시된다면 어떻게 느끼시나요? (가격 검증 필요)',
          '어떤 내용이 추가되면 더 높은 가치의 서비스로 느껴지실 것 같나요?'
        ]
      },
      landingPageDraft: {
        problemHeadline: `"${problem} 때문에 혼자 고민하며 시간을 보내고 계신가요?"`,
        targetAudience: `• ${target}\n• 시행착오를 줄이고 확실한 가이드를 원하는 사람`,
        solutionPitch: `${career} 경험에서 검증된 노하우로 감으로 하던 방식을 확실한 구조로 정리해 드립니다.`,
        deliverablesList: [
          '현재 상황 파악 및 통증 원인 진단',
          '첫 유료 결제를 만들기 위한 가장 작은 실행 단계 설계',
          '바로 적용 가능한 맞춤 체크리스트 제공'
        ],
        processSteps: [
          '1단계: 사전 진단 질문지 작성 (3분)',
          '2단계: 60분 1:1 서비스 진행',
          '3단계: 맞춤 실행 리포트 수령 및 실행'
        ],
        finalCta: '🚀 이번 주 선착순 3명 한정 검증가로 신청하기'
      },
      contentTopics: [
        {
          id: 1,
          channel: situation.channels || '블로그/인스타그램',
          topic: `${target} 초보자가 가장 흔히 하는 실수 3가지`,
          keyPoint: '실무 경험에서 얻은 현실적인 조언 제시'
        },
        {
          id: 2,
          channel: situation.channels || '블로그/인스타그램',
          topic: `${skills} 노하우: 이것 하나만 바꿔도 작업 효율 상승`,
          keyPoint: '바로 적용 가능한 구체적 팁 공유'
        },
        {
          id: 3,
          channel: situation.channels || '블로그/인스타그램',
          topic: '첫 유료 서비스를 준비하며 깨달은 전제 3가지',
          keyPoint: '진정성 있는 비하인드 스토리 공개'
        },
        {
          id: 4,
          channel: situation.channels || '블로그/인스타그램',
          topic: '무료 상담과 유료 서비스의 결정적 차이',
          keyPoint: '유료 가치와 전문성 차별화 전달'
        },
        {
          id: 5,
          channel: situation.channels || '블로그/인스타그램',
          topic: `주 ${hours}시간으로 첫 유료 고객 반응을 검증하는 법`,
          keyPoint: '작은 단위 검증의 중요성 강조'
        },
        {
          id: 6,
          channel: situation.channels || '블로그/인스타그램',
          topic: '사소하다고 생각한 내 경험이 남에게 유료 가치가 되는 순간',
          keyPoint: '타깃 고객의 동기부여 및 공감대 형성'
        },
        {
          id: 7,
          channel: situation.channels || '블로그/인스타그램',
          topic: '직접 써보고 검증한 필수 체크리스트 추천',
          keyPoint: '실용적인 도구 소개로 공유 유도'
        },
        {
          id: 8,
          channel: situation.channels || '블로그/인스타그램',
          topic: '첫 고객을 만나기 전 반드시 확인해야 할 3가지 질문',
          keyPoint: '검증 질문의 중요성과 사전 준비 안내'
        },
        {
          id: 9,
          channel: situation.channels || '블로그/인스타그램',
          topic: '완벽주의 버리고 일주일 만에 첫 오퍼 만드는 법',
          keyPoint: '빠른 실행과 최소 검증의 중요성'
        },
        {
          id: 10,
          channel: situation.channels || '블로그/인스타그램',
          topic: `Q&A: ${skills} 관련 자주 묻는 질문 총정리`,
          keyPoint: '고객의 자주 묻는 통증을 다뤄 신뢰 구축'
        }
      ],
      consultationReadiness: {
        preQuestions: [
          '현재 해결하고 싶은 가장 긴급한 문제는 무엇인가요?',
          '이 문제를 해결하기 위해 시도해본 방식과 어려움은 무엇인가요?',
          '이번 사업 검증에 주당 입력 가능한 시간과 예산은 얼마인가요?',
          '피하고 싶은 사업 방식이 있으신가요?',
          '검증 성공으로 얻고자 하는 첫 목표 수치(예: 유료 고객 1명 결제)는 무엇인가요?'
        ],
        ctaNotice: '💡 위 질문 5가지에 대한 답을 미리 생각해보시면 1:1 상담 시 훨씬 정확한 맞춤 퍼널을 설계해드릴 수 있습니다.'
      }
    }
  };
}
