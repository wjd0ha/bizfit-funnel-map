import { ExecutionBlueprint, RevenueModel, UserSituation } from './types';

export function generateMarkdownReport(
  situation: UserSituation,
  model: RevenueModel,
  blueprint: ExecutionBlueprint
): string {
  const h = blueprint.hypothesis;
  const v = blueprint.smallestValidation;
  const f = blueprint.salesFlow;
  const p = blueprint.fourteenDayPlan;
  const a = blueprint.artifacts;

  return `
# 📌 Bizfit Funnel Map 실행 보고서

> **안안심 안내**: 이 결과는 실행 가설입니다. 실제 수요, 가격, 법적·정책적 조건은 고객 반응과 최신 기준을 별도로 확인하세요.

---

## 1. 공급자(나)의 경력 및 실행 조건
- **공급자 경력**: ${situation.career}
- **보유 기술**: ${situation.skills}
- **우선 목표**: ${situation.primaryGoal}
- **주당 투입 시간**: ${situation.availableHours || '자율'}시간
- **초기 예산**: ${situation.budget || '최소 예산'}
- **현재 접점 채널**: ${situation.channels || '없음/신규'}

---

## 2. 선택 수익모델 (공급자 ➔ 결제 고객 구조)
- **아이템명**: ${model.name}
- **공급자 역량**: ${model.providerProfile?.careerSummary || situation.career}
- **🎯 실제 결제 고객**: ${model.targetCustomer}
- **💡 고객의 통증/문제**: ${model.customerProblem || model.problemSolved}
- **추천 형태**: ${model.recommendedFormat}
- **경력 연결 이유**: ${model.matchReason}
- **확인 필요 전제**: ${model.riskOrAssumption}

---

## 3. 한 줄 사업 가설
> "${h.oneLiner}"

- **공급자 역량**: ${h.providerRole || situation.career}
- **결제 고객**: ${h.targetCustomer}
- **고객 통증**: ${h.customerProblem || model.customerProblem}
- **제안 상품**: ${h.proposedOffer}
- **고객 변화**: ${h.transformation}

---

## 4. 가장 작은 검증 계획 (MVP)
### 이번 주 실행 행동 3개:
${v.weeklyActions.map((act, i) => `${i + 1}. ${act}`).join('\n')}

### 추천 고객 접점 채널:
${v.channels.map(ch => `- ${ch}`).join('\n')}

### 고객 검증 질문 3개:
${v.validationQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### 통과 기준:
- ${v.passCriteria}

---

## 5. 고객 유입 및 판매 흐름
${f.map(step => `
### Step ${step.stepNumber}. ${step.stepName}
- **상품/오퍼**: ${step.productOrOffer}
- **참고 가격**: ${step.referencePrice}
- **CTA (행동유도)**: ${step.cta}
- **운영 방식**: ${step.operationMethod}
- **추천 채널**: ${step.recommendedChannel}
`).join('\n')}

---

## 6. 14일 실행 계획
${p.map(item => `
### ${item.dayRange}: ${item.actionTitle}
- **세부 내용**: ${item.details}
- **완료 기준**: ${item.completionCriteria}
`).join('\n')}

---

## 7. 상세 실행 자료 (Artifacts)

### A. 첫 접점 자료
- **제목 3안**:
${a.firstTouchpoint.titles.map((t, i) => `  ${i + 1}. ${t}`).join('\n')}
- **구성**:
${a.firstTouchpoint.structure.map(s => `  - ${s}`).join('\n')}
- **CTA**: ${a.firstTouchpoint.cta}

### B. 첫 유료 상품
- **범위**: ${a.firstProductOffer.scope}
- **제공물**:
${a.firstProductOffer.deliverables.map(d => `  - ${d}`).join('\n')}
- **제외 범위**:
${a.firstProductOffer.excludedScope.map(e => `  - ${e}`).join('\n')}
- **가격 검증 질문**:
${a.firstProductOffer.priceValidationQuestions.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}

### C. 랜딩페이지 초안
- **헤드라인**: ${a.landingPageDraft.problemHeadline}
- **타깃**: ${a.landingPageDraft.targetAudience}
- **해결책**: ${a.landingPageDraft.solutionPitch}
- **제공물**:
${a.landingPageDraft.deliverablesList.map(d => `  - ${d}`).join('\n')}
- **진행 절차**:
${a.landingPageDraft.processSteps.map(s => `  - ${s}`).join('\n')}
- **최종 CTA**: ${a.landingPageDraft.finalCta}

### D. 유입 콘텐츠 주제 10선
${a.contentTopics.map(c => `- **[${c.channel}]** ${c.topic} (${c.keyPoint})`).join('\n')}

### E. Bizfit 상담 전환 질문 5개
${a.consultationReadiness.preQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

* ${a.consultationReadiness.ctaNotice}
`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}
