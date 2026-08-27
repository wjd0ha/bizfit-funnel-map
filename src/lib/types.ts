export type GoalType = 
  | 'first_paying_customer' 
  | 'monthly_side_income' 
  | 'increase_customers' 
  | 'reduce_repetitive_work';

export type FaceExposureType = 'allowed' | 'not_allowed' | 'flexible';

export interface UserSituation {
  // Mandatory
  career: string;              // 경력/직업/해본 일
  skills: string;              // 잘하는 일/보유기술/부탁받는 일
  primaryGoal: GoalType;       // 우선 목표

  // Optional
  channels?: string;           // 현재 고객 접점
  availableHours?: number;     // 주당 가능 시간 (시간)
  budget?: string;             // 초기 예산
  faceExposure?: FaceExposureType; // 얼굴 노출
  existingContent?: string;    // 보유 자료/포트폴리오
  dislikedConditions?: string; // 피하고 싶은 방식/조건
}

export interface RevenueModelScore {
  difficulty: number;        // 실행 난이도 (1=쉬움 ~ 5=어려움)
  costBurden: number;        // 초기비용 부담 (1=낮음 ~ 5=높음)
  validationEase: number;    // 첫 고객 검증 용이성 (1=어려움 ~ 5=쉬움)
  operationBurden: number;   // 반복 운영 부담 (1=낮음 ~ 5=높음)
}

export interface RevenueModel {
  id: string;
  name: string;                // 상품/서비스 이름
  targetCustomer: string;       // 대상 고객
  problemSolved: string;        // 해결 문제
  recommendedFormat: string;   // 추천 형태 (진단, 1:1 서비스, 템플릿, 워크숍 등)
  matchReason: string;         // 이 사용자에게 맞는 이유
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
    targetCustomer: string;
    problemSolved: string;
    proposedOffer: string;
    transformation: string;
    oneLiner: string;
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
