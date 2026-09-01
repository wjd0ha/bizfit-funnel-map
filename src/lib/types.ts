export type GoalType = 
  | 'first_paying_customer' 
  | 'monthly_side_income' 
  | 'increase_customers' 
  | 'reduce_repetitive_work';

export type FaceExposureType = 'allowed' | 'not_allowed' | 'flexible';

export interface UserSituation {
  // Mandatory
  career: string;              // 공급자(입력자)의 경력/직업/실무 경험
  skills: string;              // 공급자의 보유 기술/잘하는 일/부탁받는 일
  primaryGoal: GoalType;       // 우선 목표

  // Optional
  channels?: string;           // 현재 고객 접점
  availableHours?: number;     // 주당 가능 시간 (시간)
  budget?: string;             // 초기 예산
  faceExposure?: FaceExposureType; // 얼굴 노출 여부
  existingContent?: string;    // 보유 자료/포트폴리오
  dislikedConditions?: string; // 피하고 싶은 방식/조건
}

export interface RevenueModelScore {
  difficulty: number;        // 실행 난이도 (1=쉬움 ~ 5=어려움)
  costBurden: number;        // 초기비용 부담 (1=낮음 ~ 5=높음)
  validationEase: number;    // 첫 고객 검증 용이성 (1=어려움 ~ 5=쉬움)
  operationBurden: number;   // 반복 운영 부담 (1=낮음 ~ 5=높음)
}

export interface ProviderProfile {
  careerSummary: string;     // 공급자의 실무 역량/경력 요약
  coreSkills: string[];      // 공급자가 보유한 핵심 기술
}

export interface RevenueModel {
  id: string;
  name: string;                // 상품 또는 서비스 이름
  providerProfile: ProviderProfile; // 공급자 역량 (입력자의 전문성)
  targetCustomer: string;       // 실제 결제 고객 (공급자와 분리된 구매 주체)
  customerProblem: string;      // 고객이 느끼는 구체적 통증 및 문제
  problemSolved?: string;       // 하위 호환용 고객 문제
  recommendedFormat: string;   // 추천 형태 (1:1 진단, 케어 클래스, 세팅 대행, 템플릿 등)
  matchReason: string;         // 이 사용자의 경력/기술이 이 서비스에 적합한 이유
  preparationItems: string[];  // 필요한 준비물
  prepDuration: string;        // 준비 기간
  scores: RevenueModelScore;   // 1~5점 평가
  scoreRationale: string;      // 점수 부여 이유
  riskOrAssumption: string;    // 확인해야 할 위험 또는 전제
}

export type FunnelType = 
  | 'validation'   // 검증형
  | 'lead_gen'     // 리드 수집형
  | 'workshop'     // 워크숍형
  | 'local_repeat' // 지역·단골형
  | 'digital_prod';// 디지털 상품형

export interface FunnelOption {
  type: FunnelType;
  title: string;
  subtitle: string;
  description: string;
  bestSuitedFor: string;
  prepNeeded: string[];
  cautions: string[];
  isRecommended?: boolean;
  recommendReason?: string;
}

export interface SalesFlowStep {
  stepNumber: number;
  stepName: string;
  productOrOffer: string;
  referencePrice: string;     // 참고 가격 ("가격 검증 필요" 명시)
  cta: string;
  operationMethod: string;
  recommendedChannel: string;
}

export interface FourteenDayAction {
  dayRange: string;           // 예: Day 1~2
  actionTitle: string;
  details: string;
  completionCriteria: string; // 완료 기준
}

export interface ExecutionBlueprint {
  // A. 한 줄 사업 가설
  hypothesis: {
    providerRole: string;        // 공급자의 역할/전문성
    targetCustomer: string;      // 결제 고객
    customerProblem: string;     // 해결하려는 문제
    proposedOffer: string;       // 제안 상품/서비스
    transformation: string;      // 고객이 얻는 실질적 변화
    oneLiner: string;            // 자연스러운 한 줄 사업 가설 문장
  };

  // B. 가장 작은 검증 계획
  smallestValidation: {
    weeklyActions: string[];     // 이번 주 실행 행동 3개
    channels: string[];          // 고객 접점 채널 1~2개
    validationQuestions: string[];// 고객 검증 질문 3개
    passCriteria: string;        // 수정 가능한 통과 기준
  };

  // C. 고객 유입과 판매 흐름
  salesFlow: SalesFlowStep[];

  // D. 14일 실행 계획
  fourteenDayPlan: FourteenDayAction[];

  // Step 5 상세 실행 자료
  artifacts: {
    firstTouchpoint: {
      titles: string[];         // 제목 3안
      structure: string[];      // 구성
      cta: string;              // CTA
    };
    firstProductOffer: {
      scope: string;            // 서비스/상품 범위
      deliverables: string[];   // 제공물
      excludedScope: string[];  // 제외 범위
      priceValidationQuestions: string[]; // 가격 검증 질문
    };
    landingPageDraft: {
      problemHeadline: string;
      targetAudience: string;
      solutionPitch: string;
      deliverablesList: string[];
      processSteps: string[];
      finalCta: string;
    };
    contentTopics: Array<{
      id: number;
      channel: string;
      topic: string;
      keyPoint: string;
    }>;
    consultationReadiness: {
      preQuestions: string[];   // 상담 전 질문 5개
      ctaNotice: string;
    };
  };
}

export interface SavedBizfitMap {
  id: string;
  createdAt: string;
  updatedAt: string;
  situation: UserSituation;
  models: RevenueModel[];
  selectedModelId?: string;
  selectedFunnelType?: FunnelType;
  blueprint?: ExecutionBlueprint;
  isDemoMode: boolean;
}
