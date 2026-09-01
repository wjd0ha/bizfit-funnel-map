import { UserSituation, RevenueModel, ExecutionBlueprint, FunnelType } from './types';
import { generateDemoModels, generateDemoBlueprint } from './demoData';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash';

const SAFETY_GUARDRAILS = `
[Bizfit AI 절대 안전 지침 & 톤앤매너]
1. 공급자(입력자)의 경력과 최종 결제 고객을 절대 혼동하지 마십시오.
   - 예: "7년 차 반려견 미용사"는 서비스를 제공하는 공급자(providerProfile)입니다.
   - 고객(targetCustomer)은 "반려견 위생 관리가 어려운 초보 보호자"처럼 별도로 작성해야 합니다.
2. 사용자가 입력하지 않은 역량(노션, 엑셀, 캔바, 영상, 출강, 광고 등)을 전제로 한 아이템을 절대 함부로 추천하지 마십시오.
   - 사용자가 해당 역량을 입력했을 때만 해당 템플릿/강의 형태를 추천하십시오.
3. 다음 금지 표현 및 이와 유사한 성과의 확언/과장 광고 문구를 절대 사용하지 마십시오:
   - "자동 수익", "확실한 목표 매출", "월 N만원 가능", "1주 내 문제 해결", "N시간 절약", "성공 보장", "선정률 상승", "망할 걱정 없는"
4. 조사 어색함(예: "을(를)", "(이)가") 및 번역체를 완전히 제거하고 정중하고 전문적인 자연스러운 한국어 사업 문장으로 다듬으십시오.
5. 가격은 확정값이 아니라 반드시 "참고 범위 / 가격 검증 필요"로 표현하십시오.
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

당신은 1인사업자 및 초보 창업자를 돕는 비즈니스 가설 설계 전문 AI "Bizfit"입니다.
다음 사용자 조건에 맞는 실행 가능한 수익모델 8개~10개를 JSON 배열로 생성해 주십시오.

[공급자(사용자) 입력 정보]
- 경력/직업: ${situation.career}
- 잘하는 일/기술: ${situation.skills}
- 우선 목표: ${situation.primaryGoal}
- 현재 고객 접점: ${situation.channels || '없음/초기'}
- 주당 가능 시간: ${situation.availableHours || 5}시간
- 초기 예산: ${situation.budget || '최저 예산'}
- 얼굴 노출: ${situation.faceExposure || '상관없음'}
- 보유 자료: ${situation.existingContent || '없음'}
- 피하고 싶은 조건: ${situation.dislikedConditions || '없음'}
${filterCondition ? `- 추가 필터 조건: ${filterCondition}` : ''}

[필수 JSON output 구조]
[
  {
    "id": "model-1",
    "name": "상품 또는 서비스 이름",
    "providerProfile": {
      "careerSummary": "입력자의 경력 및 전문성 요약",
      "coreSkills": ["핵심 기술 1", "핵심 기술 2"]
    },
    "targetCustomer": "실제 돈을 내는 구매 고객 (공급자의 경력과 절대 혼동 금지!)",
    "customerProblem": "고객이 느끼는 구체적 문제 및 통증",
    "recommendedFormat": "추천 형태 (1:1 진단, 케어 코칭, 세팅 대행 등)",
    "matchReason": "이 사용자의 경력/기술이 서비스에 잘 맞는 이유",
    "preparationItems": ["필요 준비물 3개"],
    "prepDuration": "준비 기간 (예: 3일)",
    "scores": {
      "difficulty": 1~5점 (실행 난이도: 1이 쉬움),
      "costBurden": 1~5점 (초기비용 부담: 1이 적음),
      "validationEase": 1~5점 (첫고객 검증 용이성: 5가 쉬움),
      "operationBurden": 1~5점 (반복운영 부담: 1이 적음)
    },
    "scoreRationale": "점수 이유",
    "riskOrAssumption": "확인해야 할 위험 또는 전제"
  }
]

JSON형식만 반환하십시오.
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

    if (!res.ok) throw new Error(`Gemini API HTTP Error: ${res.status}`);

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
사용자가 선택한 수익모델과 퍼널 방식을 바탕으로 실행 구조 결과 및 5개 상세 실행 자료를 JSON으로 생성해 주십시오.

[선택 수익모델]
- 모델명: ${selectedModel.name}
- 공급자 역량: ${selectedModel.providerProfile?.careerSummary || situation.career}
- 실제 결제 고객: ${selectedModel.targetCustomer}
- 해결 문제: ${selectedModel.customerProblem || selectedModel.problemSolved}
- 추천 형태: ${selectedModel.recommendedFormat}

[선택 퍼널 방식]: ${funnelType}
[사용자 상황]: 주당 ${situation.availableHours || 5}시간 가능 / 예산: ${situation.budget || '최저'}

[필수 JSON Output 구조]
{
  "hypothesis": {
    "providerRole": "공급자 전문성",
    "targetCustomer": "결제 고객",
    "customerProblem": "고객 문제",
    "proposedOffer": "제안 상품",
    "transformation": "고객 변화",
    "oneLiner": "자연스러운 한 줄 가설"
  },
  "smallestValidation": {
    "weeklyActions": ["이번 주 실행 행동 3개"],
    "channels": ["고객 접점 채널 1~2개"],
    "validationQuestions": ["고객 검증 질문 3개"],
    "passCriteria": "통과 기준"
  },
  "salesFlow": [
    {
      "stepNumber": 1,
      "stepName": "단계 이름",
      "productOrOffer": "상품/오퍼",
      "referencePrice": "참고 가격 (반드시 '가격 검증 필요' 명시)",
      "cta": "CTA 문구",
      "operationMethod": "운영 방식",
      "recommendedChannel": "추천 채널"
    }
  ],
  "fourteenDayPlan": [
    {
      "dayRange": "Day 1~2",
      "actionTitle": "행동 제목",
      "details": "세부 내용",
      "completionCriteria": "완료 기준"
    }
  ],
  "artifacts": {
    "firstTouchpoint": { "titles": ["제목 3안"], "structure": ["구성 4개"], "cta": "CTA" },
    "firstProductOffer": { "scope": "범위", "deliverables": ["제공물"], "excludedScope": ["제외범위"], "priceValidationQuestions": ["검증질문"] },
    "landingPageDraft": { "problemHeadline": "헤드라인", "targetAudience": "타깃", "solutionPitch": "해결책", "deliverablesList": ["제공물"], "processSteps": ["절차"], "finalCta": "CTA" },
    "contentTopics": [ { "id": 1, "channel": "채널", "topic": "주제", "keyPoint": "포인트" } ],
    "consultationReadiness": { "preQuestions": ["질문 5개"], "ctaNotice": "안내" }
  }
}

JSON형식만 반환하십시오.
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
