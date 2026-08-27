import { UserSituation, RevenueModel, ExecutionBlueprint, FunnelType } from './types';
import { generateDemoModels, generateDemoBlueprint } from './demoData';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash';

const SAFETY_GUARDRAILS = `
[AI 안전 규칙 & 톤앤매너]
1. 사용자가 입력하지 않은 경력, 고객 사례, 수익, 자격, 통계를 절대 지어내거나 허위로 생성하지 마십시오.
2. "월 N만원 가능", "자동 수익", "망할 걱정 없는", "선정률 상승" 같은 근거 없는 과장/과장광고 표현을 절대 사용하지 마십시오.
3. 서비스 결과는 확정된 수익 답이 아니라 "실행 가설" 및 "확인이 필요한 전제"로 정중하고 전문적인 톤으로 제시하십시오.
4. 네이비/블루 브랜드 감성에 부합하는 명확하고 쉬운 한국어로 작성하십시오.
5. 가격 표기 시 "가격 검증 필요" 문구를 함께 포함하십시오.
`;

export async function fetchRevenueModels(
  situation: UserSituation,
  filterCondition?: string
): Promise<{ models: RevenueModel[]; isDemo: boolean }> {
  if (!GEMINI_API_KEY) {
    console.log('[Bizfit Gemini] GEMINI_API_KEY not found. Using Demo Mode.');
    return { models: generateDemoModels(situation, filterCondition), isDemo: true };
  }

  try {
    const prompt = `
${SAFETY_GUARDRAILS}

당신은 1인사업자 및 초보 창업자를 돕는 전문 비즈니스 가설 설계 AI "Bizfit"입니다.
다음 사용자 조건에 맞는 실행 가능한 수익모델 8개~10개를 JSON 배열로 생성해 주십시오.

[사용자 상황]
- 직무/경력: ${situation.career}
- 잘하는 일/보유기술: ${situation.skills}
- 우선 목표: ${situation.primaryGoal}
- 현재 고객 접점: ${situation.channels || '없음/초기'}
- 주당 가능 시간: ${situation.availableHours || 5}시간
- 초기 예산: ${situation.budget || '최저 예산'}
- 얼굴 노출: ${situation.faceExposure || '상관없음'}
- 보유 자료: ${situation.existingContent || '없음'}
- 피하고 싶은 조건: ${situation.dislikedConditions || '없음'}
${filterCondition ? `- 추가 필터 재생성 조건: ${filterCondition}` : ''}

[필수 JSON output 구조]
각 아이템 객체는 다음 키를 포함해야 합니다:
- id: string (예: "model-1")
- name: string (상품/서비스 이름)
- targetCustomer: string (대상 고객)
- problemSolved: string (해결 문제)
- recommendedFormat: string (추천 형태: 진단, 1:1, 템플릿, 워크숍 등)
- matchReason: string (이 사용자에게 맞는 이유)
- preparationItems: string[] (필요 준비물 3개)
- prepDuration: string (준비 기간, 예: 3일)
- scores: {
    difficulty: number (1~5점, 실행 난이도: 1이 가장 쉬움),
    costBurden: number (1~5점, 초기비용 부담: 1이 가장 적음),
    validationEase: number (1~5점, 첫 고객 검증 용이성: 5가 가장 쉬움),
    operationBurden: number (1~5점, 반복 운영 부담: 1이 가장 적음)
  }
- scoreRationale: string (점수 이유)
- riskOrAssumption: string (확인해야 할 위험 또는 전제)

JSON형식만 반환하세요: [ {...}, {...} ]
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
        })
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No text returned from Gemini API');

    const parsed: RevenueModel[] = JSON.parse(rawText);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { models: parsed, isDemo: false };
    }

    throw new Error('Parsed models is not a valid non-empty array');
  } catch (err) {
    console.warn('[Bizfit Gemini] API call failed. Falling back to Demo Mode:', err);
    return { models: generateDemoModels(situation, filterCondition), isDemo: true };
  }
}

export async function fetchExecutionBlueprint(
  situation: UserSituation,
  selectedModel: RevenueModel,
  funnelType: FunnelType
): Promise<{ blueprint: ExecutionBlueprint; isDemo: boolean }> {
  if (!GEMINI_API_KEY) {
    return { blueprint: generateDemoBlueprint(situation, selectedModel, funnelType), isDemo: true };
  }

  try {
    const prompt = `
${SAFETY_GUARDRAILS}

당신은 Bizfit AI 비즈니스 퍼널 설계 전문가입니다.
사용자가 선택한 수익모델과 퍼널 방식을 바탕으로 4개 영역의 실행 구조 결과 및 5개 상세 실행 자료(Step 5)를 JSON으로 생성해 주십시오.

[선택 수익모델]
- 모델명: ${selectedModel.name}
- 대상고객: ${selectedModel.targetCustomer}
- 해결문제: ${selectedModel.problemSolved}
- 추천형태: ${selectedModel.recommendedFormat}

[선택 퍼널 방식]: ${funnelType}
[사용자 상황]: 주당 ${situation.availableHours || 5}시간 가능 / 예산: ${situation.budget || '최저'} / 채널: ${situation.channels || '초기'}

[필수 JSON Output 구조 (ExecutionBlueprint 인터페이스와 일치)]
{
  "hypothesis": {
    "targetCustomer": string,
    "problemSolved": string,
    "proposedOffer": string,
    "transformation": string,
    "oneLiner": string
  },
  "smallestValidation": {
    "weeklyActions": string[] (이번주 실행 3개),
    "channels": string[] (채널 1~2개),
    "validationQuestions": string[] (검증 질문 3개),
    "passCriteria": string
  },
  "salesFlow": [
    {
      "stepNumber": number,
      "stepName": string,
      "productOrOffer": string,
      "referencePrice": string (반드시 '가격 검증 필요' 포함),
      "cta": string,
      "operationMethod": string,
      "recommendedChannel": string
    }
  ],
  "fourteenDayPlan": [
    {
      "dayRange": string (예: Day 1~2),
      "actionTitle": string,
      "details": string,
      "completionCriteria": string
    }
  ],
  "artifacts": {
    "firstTouchpoint": {
      "titles": string[] (제목 3안),
      "structure": string[] (구성단계 4개),
      "cta": string
    },
    "firstProductOffer": {
      "scope": string,
      "deliverables": string[],
      "excludedScope": string[],
      "priceValidationQuestions": string[]
    },
    "landingPageDraft": {
      "problemHeadline": string,
      "targetAudience": string,
      "solutionPitch": string,
      "deliverablesList": string[],
      "processSteps": string[],
      "finalCta": string
    },
    "contentTopics": [
      { "id": 1, "channel": string, "topic": string, "keyPoint": string },
      ... 10개 항목
    ],
    "consultationReadiness": {
      "preQuestions": string[] (질문 5개),
      "ctaNotice": string
    }
  }
}

JSON형식만 반환하세요.
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
        })
      }
    );

    if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('No content from Gemini');

    const blueprint: ExecutionBlueprint = JSON.parse(rawText);
    return { blueprint, isDemo: false };
  } catch (err) {
    console.warn('[Bizfit Gemini] Blueprint API failed. Using demo blueprint:', err);
    return { blueprint: generateDemoBlueprint(situation, selectedModel, funnelType), isDemo: true };
  }
}
