import {
  UserSituation,
  RevenueModel,
  FunnelOption,
  ExecutionBlueprint,
  FunnelType
} from './types';

/**
 * Dynamic demo data generator that tailors revenue models, funnels, and blueprints
 * according to user inputs without requiring an external AI API key.
 */

export function generateDemoModels(
  situation: UserSituation,
  filterCondition?: string
): RevenueModel[] {
  const careerSnippet = situation.career || '실무 경험';
  const skillSnippet = situation.skills || '보유 전문 지식';
  const isNoFace = situation.faceExposure === 'not_allowed' || filterCondition?.includes('얼굴 노출 없이');
  const isLowBudget = (situation.budget && situation.budget.includes('30')) || filterCondition?.includes('30만원');
  const isNoLecture = filterCondition?.includes('강의는 제외');

  const baseModels: RevenueModel[] = [
    {
      id: 'model-1',
      name: `${skillSnippet} 맞춤 진단 & 1:1 체크업 서비스`,
      targetCustomer: `${careerSnippet} 분야 문제로 시간을 낭비 중인 초보 실무자 및 소상공인`,
      problemSolved: '어디서부터 개선해야 할지 모르는 막막함과 자원 낭비 해결',
      recommendedFormat: '1:1 온라인 줌 진단 (60분)',
      matchReason: `${situation.career} 경력과 보유 기술을 활용하여 즉각적인 가치를 제공할 수 있는 가장 가벼운 진단 형태입니다.`,
      preparationItems: ['진단 질문지 (Google Form)', '60분 진단 체크리스트 템플릿', '노션 결과 리포트 양식'],
      prepDuration: '2~3일',
      scores: {
        difficulty: 2,
        costBurden: 1,
        validationEase: 5,
        operationBurden: 3,
      },
      scoreRationale: '기존 지식을 바탕으로 바로 제공 가능하여 비용이 들지 않고, 소수 고객 대상 진단이라 반응 검증이 매우 빠릅니다.',
      riskOrAssumption: '고객이 단순 무료 상담이 아닌 "유료 진단"으로 가치를 느낄 만한 명확한 사전 체크리스트가 준비되어야 합니다.',
    },
    {
      id: 'model-2',
      name: `${skillSnippet} 핵심 실무 체크리스트 & 가이드북`,
      targetCustomer: '빠른 시간 내 결과물을 내고 싶지만 노하우가 부족한 입문자',
      problemSolved: '시착오에 드는 10시간 이상의 시행착오 비용 단축',
      recommendedFormat: '디지털 PDF 가이드 (20~30p)',
      matchReason: '직접 상담하지 않고 콘텐츠 형태로 전달할 수 있어 시간 효율성이 뛰어납니다.',
      preparationItems: ['전자책 작성용 노션/워드 문서', '표지 및 요약 가이드 PDF', '판매용 링크'],
      prepDuration: '3~5일',
      scores: {
        difficulty: 2,
        costBurden: 1,
        validationEase: 4,
        operationBurden: 1,
      },
      scoreRationale: '한 번 작성해두면 자동 전달이 가능하여 운영 부담이 극도로 적고 제작 비용이 거의 0원입니다.',
      riskOrAssumption: '단순 정보 전달을 넘어 "바로 실행할 수 있는 양식/템플릿"이 포함되어야 결제 전환이 일어납니다.',
    },
    {
      id: 'model-3',
      name: `${careerSnippet} 경험 기반 1인 실습형 소규모 워크숍`,
      targetCustomer: '혼자 공부하면 포기하기 쉬운 예비 창업자 및 직장인',
      problemSolved: '혼자 실습하기 힘든 과정을 2시간 만에 같이 완성하기',
      recommendedFormat: isNoFace ? '화면 공유 중심의 소규모 줌 라이브 실습' : '3~5인 소규모 실습 워크숍',
      matchReason: '단순 강의가 아닌 "완성물"을 갖고 돌아가게 만들어 수강생 만족도와 후기 확보가 용이합니다.',
      preparationItems: ['2시간 실습 교안 슬라이드', '실습용 템플릿 파일', '사후 Q&A 오픈채팅방'],
      prepDuration: '5일',
      scores: {
        difficulty: 3,
        costBurden: 1,
        validationEase: 4,
        operationBurden: 3,
      },
      scoreRationale: '소수 인원으로 진행하여 검증이 빠르고, 실습 완성이라는 확실한 가치를 전달합니다.',
      riskOrAssumption: '모객 채널이 없으면 첫 3~5명의 모객에 다소 시간이 걸릴 수 있어 기존 채널 활용이 필요합니다.',
    },
    {
      id: 'model-4',
      name: `맞춤형 ${skillSnippet} 대행 & 세팅 패키지`,
      targetCustomer: '직접 할 시간이 없거나 전문적인 결과를 빠르게 원하는 초기 사업자',
      problemSolved: '복잡한 세팅과 작업을 전문가에게 위임하여 시간 절약',
      recommendedFormat: '외주 대행 / 초도 세팅 서비스 (건당/월간)',
      matchReason: '건당 수임 단가가 높아 적은 고객 수로도 단기 매출 검증이 가능한 확실한 서비스입니다.',
      preparationItems: ['작업 범위를 명확히 한 상품 소개서', '작업 요청 양식', '계약/결제 메일 양식'],
      prepDuration: '3일',
      scores: {
        difficulty: 3,
        costBurden: 1,
        validationEase: 4,
        operationBurden: 4,
      },
      scoreRationale: '직접 노동이 들어가므로 운영 부담은 있으나, 초기 고객 1~2명 확보 시 가장 높은 단가를 형성합니다.',
      riskOrAssumption: '작업 범위(Scope)를 명확히 정의하지 않으면 추가 요청으로 노동 시간이 과도해질 수 있습니다.',
    },
    {
      id: 'model-5',
      name: `${careerSnippet} 전용 노션 / 엑셀 자동화 템플릿`,
      targetCustomer: '반복적인 정리 및 관리 업무로 스트레스받는 1인 사업자',
      problemSolved: '매일 1시간 이상 소요되는 문서·데이터 정리 시간 단축',
      recommendedFormat: '노션/엑셀 대시보드 템플릿 + 10분 사용 설명 영상',
      matchReason: '얼굴 노출이 필요 없고, 제작 후 복제 및 전달만으로 매출이 발생하는 전형적인 디저털 자산 모델입니다.',
      preparationItems: ['완성형 노션/엑셀 템플릿', '화면 녹화 가이드 (Loom/OBS)', '샘플 적용 데이터'],
      prepDuration: '4~7일',
      scores: {
        difficulty: 2,
        costBurden: 1,
        validationEase: 3,
        operationBurden: 1,
      },
      scoreRationale: '초기 템플릿 제작 후 유지보수 비용과 시간이 거의 들지 않아 부업/부수입에 적합합니다.',
      riskOrAssumption: '템플릿만 제공하기보다 "실제 활용 팁"과 "예시 데이터"를 풍부하게 포함해야 차별화됩니다.',
    },
    {
      id: 'model-6',
      name: `1:1 집중 밀착 코칭 & 리포트 피드백`,
      targetCustomer: '체계적으로 문제를 해결하며 성과를 내고 싶은 심화 고객',
      problemSolved: '의지 부족 및 혼자 고심하며 막히는 구간을 1:1로 피드백 받아 빠르게 통과',
      recommendedFormat: '2주/4주 밀착 피드백 (카카오톡 모니터링 + 주 1회 코칭)',
      matchReason: '진단 서비스나 미니 상품 구매 고객 중 핵심 10%를 심화 상품으로 전환시키기 매우 유리합니다.',
      preparationItems: ['주차별 달성 커리큘럼', '데일리 질문 양식', '피드백 노션 페이지'],
      prepDuration: '5일',
      scores: {
        difficulty: 3,
        costBurden: 1,
        validationEase: 3,
        operationBurden: 4,
      },
      scoreRationale: '소수 회원제로만 운영하여 깊은 고관여 가치를 제공하며 고단가 구조 생성이 가능합니다.',
      riskOrAssumption: '고객의 적극적인 실행 의지가 전제되어야 하므로 사전 진단을 통한 고객 선별이 필요합니다.',
    },
    {
      id: 'model-7',
      name: `${skillSnippet} 문제 해결용 카드뉴스 & 템플릿 팩`,
      targetCustomer: 'SNS 및 홍보 마케팅 자료가 필요한 소상공인 및 개인 브랜드',
      problemSolved: '디자인 및 문구 작성 능력이 부족한 고민 해결',
      recommendedFormat: '캔바(Canva) 편집 가능 템플릿 20종 세트',
      matchReason: '쉽게 수정 가능한 링크 형태 전달로 구매자의 만족도가 극대화되는 디지털 가공품입니다.',
      preparationItems: ['Canva 템플릿 공유 링크', '사용 폰트/컬러 가이드', '복사 및 수정 설명서'],
      prepDuration: '3~4일',
      scores: {
        difficulty: 2,
        costBurden: 1,
        validationEase: 3,
        operationBurden: 1,
      },
      scoreRationale: '제작 난이도가 낮고 초저예산으로 준비가 가능합니다.',
      riskOrAssumption: '단순 템플릿을 넘어 target 고객의 특정 업종에 맞춤화된 문구 예시가 포함되어야 합니다.',
    },
    {
      id: 'model-8',
      name: `기업 / 단체 대상 ${careerSnippet} 출강 & 미니 세미나`,
      targetCustomer: '임직원 실무 역량 강화나 회원 대상 특강이 필요한 단체 및 기관',
      problemSolved: '전문성을 갖춘 실무자의 생생한 현장 경험 지식 이식',
      recommendedFormat: '90분 특강 / 실무 세미나',
      matchReason: 'B2B/기관 대상 단가가 높아 적은 횟수로 확실한 목표 매출 달성이 가능합니다.',
      preparationItems: ['강의 제안서 (PDF 3장)', '포트폴리오 요약본', '강의안 슬라이드'],
      prepDuration: '7일',
      scores: {
        difficulty: 4,
        costBurden: 1,
        validationEase: 2,
        operationBurden: 2,
      },
      scoreRationale: '제안서 작성 및 B2B 제안 단계가 필요하여 검증 난이도는 있으나 성공 시 신뢰도가 대폭 상승합니다.',
      riskOrAssumption: 'B2B 의사결정권자에게 어필할 수 있는 명확한 세미나 기대 효과 수치가 필요합니다.',
    },
    {
      id: 'model-9',
      name: `${skillSnippet} 문제 진단용 Q&A 온디맨드 텍스트 컨설팅`,
      targetCustomer: '실시간 통화나 미팅이 부담스럽고, 비동기 텍스트 피드백을 선호하는 사람',
      problemSolved: '시간 제약 없이 궁금할 때 질문하고 24시간 내 전문 답변 받기',
      recommendedFormat: '카카오톡 1:1 오픈채팅 / 크몽 텍스트 피드백',
      matchReason: '본업이나 직장 생활과 병행하며 남는 시간에 답변을 작성할 수 있어 부담이 적습니다.',
      preparationItems: ['질문 제출 양식 (Google Form)', '답변 템플릿 양식'],
      prepDuration: '1~2일',
      scores: {
        difficulty: 1,
        costBurden: 1,
        validationEase: 5,
        operationBurden: 2,
      },
      scoreRationale: '1~2일 안에 즉시 시작할 수 있어 가장 빠르게 유료 결제 가능성을 검증할 수 있습니다.',
      riskOrAssumption: '답변 품질에 대한 기대 수준을 명확히 하고 질문 범위를 제한해야 효율적입니다.',
    }
  ];

  // Apply quick filters if specified
  let filtered = baseModels;

  if (isNoLecture) {
    filtered = filtered.filter(m => !m.recommendedFormat.includes('강의') && !m.recommendedFormat.includes('특강'));
  }

  if (isNoFace) {
    filtered = filtered.map(m => ({
      ...m,
      matchReason: m.matchReason + ' (얼굴 노출이 필요 없는 비대면/디지털 자료 중심 구조)',
      scores: {
        ...m.scores,
        difficulty: Math.max(1, m.scores.difficulty - 1)
      }
    }));
  }

  if (isLowBudget) {
    filtered = filtered.map(m => ({
      ...m,
      scores: {
        ...m.scores,
        costBurden: 1
      }
    }));
  }

  return filtered;
}

export function getFunnelOptions(situation: UserSituation): FunnelOption[] {
  const goal = situation.primaryGoal;

  return [
    {
      type: 'validation',
      title: '검증형 퍼널',
      subtitle: '문제 인터뷰 ➔ 유료 미니 서비스 ➔ 후기·개선',
      description: '고객의 진짜 통증(Pain Point)을 직접 1:1로 확인하면서 작게 판매하고 후기를 모으는 퍼널입니다.',
      bestSuitedFor: '첫 유료 고객을 가장 빠르게 확보하고 아이템의 반응을 직접 확인하고 싶은 분',
      prepNeeded: ['고객 문제 진단 질문지 (5개)', '60분 미니 서비스 구성안', '후기 작성 요청 양식'],
      cautions: ['무료 상담으로 흘러가지 않도록 10분 무료 인터뷰 후 유료 진단으로 넘어가는 경계선을 설정하세요.'],
      isRecommended: goal === 'first_paying_customer',
      recommendReason: '현재 가장 시급한 목표인 "첫 유료 고객 결제 검증"에 최적화된 퍼널입니다.'
    },
    {
      type: 'lead_gen',
      title: '리드 수집형 퍼널',
      subtitle: '무료 체크리스트 ➔ 연락처/이메일 확보 ➔ 저가 상품 ➔ 핵심 서비스',
      description: '무료 유용한 자료를 제공하여 잠재 고객의 접점(카카오 채널, 이메일)을 모은 뒤 단계별로 판매하는 퍼널입니다.',
      bestSuitedFor: '블로그, 인스타 등 기존 콘텐츠 채널이 있거나 지속적인 고객 명단을 쌓고 싶은 분',
      prepNeeded: ['3-5페이지 미니 PDF 체크리스트', '자료 신청 폼 (Stibee/Google Form)', '자동 응답 메일/메시지'],
      cautions: ['무료 자료만 받아가고 구매하지 않는 체리피커를 막기 위해 리드DB 확보 후 48시간 내 저가 제안을 보내야 합니다.'],
      isRecommended: goal === 'increase_customers' || !!situation.channels,
      recommendReason: '이미 보유한 유입 채널을 살려 잠재 고객 명단을 지속적으로 축적할 수 있습니다.'
    },
    {
      type: 'workshop',
      title: '워크숍형 퍼널',
      subtitle: '무료 또는 저가 특강 ➔ 소규모 실습 ➔ 심화 프로그램',
      description: '1~2시간의 실습 특강으로 신뢰를 구축한 뒤, 혼자 해결하기 어려워하는 고객을 1:1이나 심화반으로 연결합니다.',
      bestSuitedFor: '설명만 하는 것보다 실제로 같이 만들어주거나 실습 과정을 보여줄 때 가치가 큰 분야',
      prepNeeded: ['60분 실습 강의안', '신청용 간이 랜딩페이지', '특강 종료 후 심화 수강 혜택안'],
      cautions: ['특강에서 너무 많은 이론을 다루지 마시고, "한 가지 명확한 문제 해결"에만 집중하세요.'],
      isRecommended: goal === 'monthly_side_income',
      recommendReason: '특강 1회당 소수 인원을 모아 확실한 참가 수익과 후속 전환을 동시에 기대할 수 있습니다.'
    },
    {
      type: 'local_repeat',
      title: '지역·단골형 퍼널',
      subtitle: '기존 고객/지역 채널 ➔ 체험·재방문 제안 ➔ 정기 관리',
      description: '당근마켓, 오프라인 모임, 기존 인맥을 활용해 가까운 고객에게 첫 체험을 제공하고 단골로 전환합니다.',
      bestSuitedFor: '지역 기반 소상공인, 오프라인 서비스, 인적 네트워크 활용이 가능한 분',
      prepNeeded: ['지역/인맥 전용 특별 안내문', '첫 방문/첫 이용 할인 쿠폰', '재이용 혜택 카드'],
      cautions: ['단순 일회성 할인이 아니라 정기적인 케어나 구독 형태로 전환될 수 있는 장치를 마련하세요.'],
      isRecommended: situation.channels?.includes('당근') || situation.channels?.includes('오프라인'),
      recommendReason: '온라인 광고비 없이 가까운 지역 접점을 활용해 즉각적인 고객 반응을 얻을 수 있습니다.'
    },
    {
      type: 'digital_prod',
      title: '디지털 상품형 퍼널',
      subtitle: '미니 템플릿 ➔ 첫 결제 ➔ 심화 템플릿 또는 교육',
      description: '템플릿, 노션 양식, 가이드북 등 디지털 파일로 1만원~3만원대 첫 결제를 유도하고 자동 수익 구조를 테스트합니다.',
      bestSuitedFor: '얼굴 노출이 부담스럽고, 직접적인 시간 투입을 줄이면서 부수입을 얻고자 하는 분',
      prepNeeded: ['사용 가능한 템플릿 원본 파일', '템플릿 활용 10분 가이드', '디지털 판매용 스토어/링크'],
      cautions: ['디지털 상품은 "사서 바로 쓸 수 있는 완성도"가 핵심입니다. 설명서를 꼼꼼히 첨부하세요.'],
      isRecommended: situation.faceExposure === 'not_allowed' || goal === 'reduce_repetitive_work',
      recommendReason: '얼굴 노출 부담 없이 시간 대비 효율적인 부수입 자산을 구축할 수 있습니다.'
    }
  ];
}

export function generateDemoBlueprint(
  situation: UserSituation,
  model: RevenueModel,
  funnelType: FunnelType
): ExecutionBlueprint {
  const target = model.targetCustomer;
  const problem = model.problemSolved;
  const offer = model.name;
  const hours = situation.availableHours || 5;

  return {
    hypothesis: {
      targetCustomer: target,
      problemSolved: problem,
      proposedOffer: offer,
      transformation: '시행착오와 시간 낭비 없이 1주 내 문제 해결',
      oneLiner: `"${target}"의 "${problem}"을(를) "${offer}"을(를) 통해 해결하고, 시행착오 시간을 단축시킨다.`
    },
    smallestValidation: {
      weeklyActions: [
        '타깃 고객이 모인 채널(블로그/소모임/오픈채팅)에 문제 진단 관련 글 1개 게시하기',
        '관심을 보인 잠재 고객 3명에게 1:1 무료 사전 질문지 전달 및 의견 수렴하기',
        '사전 검증 피드백을 바탕으로 1페이지 분량의 유료 서비스 안내문 작성하기'
      ],
      channels: [
        situation.channels ? `현재 활용 중인 채널 (${situation.channels})` : '주요 블로그 / 인스타그램 / 카카오톡 오픈채팅',
        '타깃 고객이 서식하는 커뮤니티 (당근 동네생활 / 직장인 소모임)'
      ],
      validationQuestions: [
        '이 문제를 해결하기 위해 최근 3개월 내에 돈이나 시간을 써보신 적이 있나요?',
        '만약 이 해결 방법(템플릿/진단)이 있다면 가장 먼저 확인하고 싶은 항목은 무엇인가요?',
        '이 서비스의 참고 가격 범위(예: 3만~5만원대)에 대해 어떻게 느끼시나요?'
      ],
      passCriteria: '일주일 간 안내문 노출 후 3명 이상 질문 문의 접수 또는 1명 이상 사전 예약/유료 결제 시 통과'
    },
    salesFlow: [
      {
        stepNumber: 1,
        stepName: '관심 유입 및 문제 환기',
        productOrOffer: '문제 해결 팁 요약 콘텐츠 / 무료 체크리스트',
        referencePrice: '0원 (무료 유입)',
        cta: '무료 진단 질문지 작성하기 / 체크리스트 다운로드',
        operationMethod: '소셜 미디어 게시물 또는 커뮤니티 게시글',
        recommendedChannel: situation.channels || '네이버 블로그 / 인스타그램'
      },
      {
        stepNumber: 2,
        stepName: '첫 유료 검증 제안',
        productOrOffer: offer,
        referencePrice: '30,000원 ~ 50,000원 (가격 검증 필요)',
        cta: '선착순 5명 한정 1:1 맞춤 진단 신청하기',
        operationMethod: '1페이지 안내 폼 또는 노션 랜딩페이지',
        recommendedChannel: '카카오톡 1:1 오픈채팅 / 구글 폼'
      },
      {
        stepNumber: 3,
        stepName: '서비스 제공 및 후기 확보',
        productOrOffer: '60분 진단 실행 + 맞춤 리포트 전달',
        referencePrice: '핵심 서비스 결제 포함',
        cta: '솔직한 후기 작성 시 추가 템플릿 무료 증정',
        operationMethod: '온라인 줌(Zoom) 또는 텍스트 리포트 전달',
        recommendedChannel: '줌 / 노션 / 카카오톡'
      },
      {
        stepNumber: 4,
        stepName: '심화 연계 또는 추천',
        productOrOffer: '4주 밀착 케어 or 템플릿 세트 업그레이드',
        referencePrice: '150,000원 ~ 300,000원 (가격 검증 필요)',
        cta: '다음 단계 심화 프로그램 신청 문의',
        operationMethod: '진단 후 만족한 고객 대상 개인화 제안',
        recommendedChannel: '1:1 메시지 / 이메일'
      }
    ],
    fourteenDayPlan: [
      {
        dayRange: 'Day 1 ~ 2',
        actionTitle: '타깃 페르소나 및 핵심 오퍼 한 줄 정의',
        details: '누구에게 어떤 문제를 해결해 줄지 1페이지 노션 문서로 정리',
        completionCriteria: '한 줄 가설 문서 완성 및 검증 질문 3개 작성 완료'
      },
      {
        dayRange: 'Day 3 ~ 4',
        actionTitle: '무료 체크리스트 & 사전 진단 질문지 제작',
        details: '구글 폼 또는 타입폼을 이용해 5가지 질문으로 구성된 진단지 생성',
        completionCriteria: '진단지 링크 생성 및 테스트 제출 완료'
      },
      {
        dayRange: 'Day 5 ~ 7',
        actionTitle: '첫 유입 콘텐츠 2개 작성 및 채널 배포',
        details: `주당 ${hours}시간의 예산에 맞춰 카드뉴스 또는 블로그 글 배포`,
        completionCriteria: '콘텐츠 게시 완료 및 댓글/조회수 반응 기록'
      },
      {
        dayRange: 'Day 8 ~ 9',
        actionTitle: '유료 서비스 1페이지 안내서(랜딩) 작성',
        details: '서비스 범위, 가격 범위(가격 검증 필요 표시), 신청 절차 명시',
        completionCriteria: '랜딩페이지/안내 노션 완성 및 신청 버튼 작동 확인'
      },
      {
        dayRange: 'Day 10 ~ 12',
        actionTitle: '초기 반응 고객 대상 1:1 제안 및 예약 접수',
        details: '관심 표명 고객 3~5명에게 직접 메시지로 첫 진단 혜택 전달',
        completionCriteria: '최소 1명 이상 실제 유료 예약 또는 구체적 가격 피드백 수집'
      },
      {
        dayRange: 'Day 13 ~ 14',
        actionTitle: '첫 검증 결과 회고 및 사업 가설 수정',
        details: '고객의 실제 반응, 거절 이유, 추가 요청사항을 종합하여 수정을 진행',
        completionCriteria: '실행 회고록 작성 및 다음 2주 검증 목표 수립'
      }
    ],
    artifacts: {
      firstTouchpoint: {
        titles: [
          `[무료] ${situation.career || '실무자'}가 꼭 피해야 할 3가지 시행착오 체크리스트`,
          `혼자 고심하지 마세요: 10분 만에 끝내는 ${situation.skills || '핵심 지식'} 셀프 진단표`,
          `월 ${hours}시간으로 첫 유료 고객을 만나는 가장 작은 검증 가이드`
        ],
        structure: [
          '1. 문제 제기: 당신이 지금 막히는 진짜 이유',
          '2. 핵심 진단: 5가지 항목으로 보는 현재 수준',
          '3. 해결 힌트: 당장 이번 주 적용할 수 있는 1가지 팁',
          '4. 다음 단계: 1:1 맞춤 진단으로 내 상황에 딱 맞게 풀기'
        ],
        cta: '👉 지금 1분 셀프 진단표 작성하고 맞춤 가이드 받기'
      },
      firstProductOffer: {
        scope: `${offer} - 60분 1:1 맞춤 진단 및 개선 실행 리포트 제공`,
        deliverables: [
          '60분 1:1 줌(Zoom) 맞춤 진단 세션 (또는 텍스트 피드백)',
          '진단 결과 및 당장 실행할 3가지 행동 리포트 (노션/PDF)',
          '작업에 바로 활용하는 필수 템플릿 1종'
        ],
        excludedScope: [
          '직접 대행 및 외주 작업 (별도 대행 패키지 문의 필요)',
          '법률·세무·회계 관련 전문 판단',
          '단기 수익 보장이나 구체적인 매출 수치 확언'
        ],
        priceValidationQuestions: [
          '이 60분 진단과 맞춤 리포트에 3만원~5만원 가격이 제시된다면 어떻게 느끼시나요?',
          '어떤 내용이 추가되면 10만원 이상의 고단가 서비스로 느껴지실 것 같나요?'
        ]
      },
      landingPageDraft: {
        problemHeadline: `"${problem} 때문에 혼자 고민하며 시간을 낭비하고 계신가요?"`,
        targetAudience: `• ${careerSnippet} 분야에서 확실한 가이드가 필요한 예비 1인사업자\n• 어디서부터 시작해야 할지 몰라 시행착오를 줄이고 싶은 사람`,
        solutionPitch: `${offer}을(를) 통해 감으로 하던 방식을 확실한 구조로 정리해 드립니다.`,
        deliverablesList: [
          '내 현재 상황 분석 및 통증 원인 정확한 진단',
          '첫 유료 고객을 만들기 위한 가장 작은 실행 단계 설계',
          '바로 적용 가능한 맞춤 템플릿 제공'
        ],
        processSteps: [
          '1단계: 사전 진단 질문지 작성 (3분)',
          '2단계: 60분 1:1 진단 또는 피드백 세션 진행',
          '3단계: 맞춤 실행 리포트 수령 및 이번 주 실행'
        ],
        finalCta: '🚀 이번 주 선착순 3명 한정 검증가로 신청하기'
      },
      contentTopics: [
        {
          id: 1,
          channel: situation.channels || '블로그/인스타그램',
          topic: `${careerSnippet} 초보자가 가장 흔히 하는 실수는?`,
          keyPoint: '실무 경험에서 얻은 현실적인 조언과 예방책 제시'
        },
        {
          id: 2,
          channel: situation.channels || '블로그/인스타그램',
          topic: `${skillSnippet} 노하우: 이것 하나만 바꿔도 시간 절반 단축`,
          keyPoint: '바로 적용 가능한 구체적 작업 팁 공유'
        },
        {
          id: 3,
          channel: situation.channels || '블로그/인스타그램',
          topic: '내가 첫 유료 서비스를 준비하며 깨달은 전제 3가지',
          keyPoint: '진정성 있는 비하인드 스토리와 준비 과정 공개'
        },
        {
          id: 4,
          channel: situation.channels || '블로그/인스타그램',
          topic: '무료 상담과 유료 진단의 결정적 차이',
          keyPoint: '유료 서비스 가치와 전문성 차별화 전달'
        },
        {
          id: 5,
          channel: situation.channels || '블로그/인스타그램',
          topic: '시간 부족한 직장인을 위한 주 5시간 부수입 구조 설계법',
          keyPoint: '현실적인 시간 배분과 작은 단위 검증 강조'
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
          topic: '직접 써보고 검증한 필수 템플릿 추천 3선',
          keyPoint: '실용적인 도구 소개로 유입 및 공유 유도'
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
          keyPoint: '빠른 실행과 최소 검증(MVP)의 중요성'
        },
        {
          id: 10,
          channel: situation.channels || '블로그/인스타그램',
          topic: `Q&A: ${skillSnippet} 관련 자주 묻는 질문 5가지 총정리`,
          keyPoint: '고객의 자주 묻는 통증을 직접 다뤄 신뢰도 구축'
        }
      ],
      consultationReadiness: {
        preQuestions: [
          '현재 해결하고 싶은 가장 긴급한 문제는 무엇인가요?',
          '이 문제를 해결하기 위해 시도해본 방식과 어려움은 무엇인가요?',
          '이번 사업 검증에 주당 입력 가능한 시간과 예산은 얼마인가요?',
          '피하고 싶은 사업 방식(예: 얼굴 노출, 과도한 영업 등)이 있으신가요?',
          '검증 성공으로 얻고자 하는 첫 목표 수치(예: 유료 고객 1명, 첫 매출 10만원 등)는 무엇인가요?'
        ],
        ctaNotice: '💡 위 질문 5가지에 대한 답을 미리 생각해보시면 1:1 상담 시 훨씬 정확한 맞춤 퍼널을 설계해드릴 수 있습니다.'
      }
    }
  };
}
