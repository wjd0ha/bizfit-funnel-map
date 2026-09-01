import React, { useState } from 'react';
import { ExecutionBlueprint, RevenueModel, UserSituation } from '@/lib/types';
import { Sparkles, ArrowRight, CheckSquare, Target, HelpCircle, Layers, Calendar, Copy, Check, UserCheck } from 'lucide-react';
import { copyToClipboard } from '@/lib/exportUtils';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface Step4BlueprintResultProps {
  situation: UserSituation;
  model: RevenueModel;
  blueprint: ExecutionBlueprint;
  onProceedToStep5: () => void;
  onBackToStep3: () => void;
}

export const Step4BlueprintResult: React.FC<Step4BlueprintResultProps> = ({
  situation,
  model,
  blueprint,
  onProceedToStep5,
  onBackToStep3,
}) => {
  const [copied, setCopied] = useState(false);
  const [completedWeeklyActions, setCompletedWeeklyActions] = useState<number[]>([]);

  const handleCopyHypothesis = async () => {
    const text = `[Bizfit 한 줄 사업 가설]\n"${blueprint.hypothesis.oneLiner}"\n\n- 공급자 역량: ${blueprint.hypothesis.providerRole || situation.career}\n- 결제 고객: ${blueprint.hypothesis.targetCustomer}\n- 고객의 통증: ${blueprint.hypothesis.customerProblem || model.customerProblem}\n- 제안 상품: ${blueprint.hypothesis.proposedOffer}\n- 고객 변화: ${blueprint.hypothesis.transformation}\n\n* 본 결과는 실행 가설입니다. 실제 수요 및 가격은 고객 반응을 통해 별도로 검증하세요.`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleAction = (idx: number) => {
    setCompletedWeeklyActions((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Intro Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 4 — 실행 구조 결과</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bizfit Funnel Map 실행 로드맵
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
          공급자 경력과 결제 고객을 명확히 구분한 실행 가설과 14일 검증 단계입니다.
        </p>
      </div>

      {/* Safety Disclaimer Banner */}
      <SafetyDisclaimer />

      {/* SECTION A: One-line Business Hypothesis Hero */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            <h2 className="font-extrabold text-lg text-white">A. 한 줄 사업 가설 (Hypothesis)</h2>
          </div>
          <button
            type="button"
            onClick={handleCopyHypothesis}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copied ? '가설 복사됨!' : '가설 복사하기'}</span>
          </button>
        </div>

        {/* Hero One-Liner Box */}
        <div className="bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-700/50 rounded-2xl p-5 sm:p-6 text-center space-y-2">
          <span className="text-xs font-bold text-blue-300 uppercase tracking-widest">Execution Hypothesis</span>
          <p className="text-lg sm:text-xl font-bold text-white leading-relaxed">
            “{blueprint.hypothesis.oneLiner}”
          </p>
        </div>

        {/* 5 Structural Components Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block font-semibold mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-300" />
              공급자 역량
            </span>
            <span className="text-slate-200 font-medium">{blueprint.hypothesis.providerRole || situation.career}</span>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-blue-400 block font-semibold mb-1 flex items-center gap-1">
              🎯 결제 고객
            </span>
            <span className="text-slate-200 font-medium">{blueprint.hypothesis.targetCustomer}</span>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block font-semibold mb-1 flex items-center gap-1">
              💡 고객 통증
            </span>
            <span className="text-slate-200 font-medium">{blueprint.hypothesis.customerProblem || model.customerProblem}</span>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block font-semibold mb-1 flex items-center gap-1">
              📦 제안 상품
            </span>
            <span className="text-slate-200 font-medium">{blueprint.hypothesis.proposedOffer}</span>
          </div>

          <div className="bg-slate-800/70 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 block font-semibold mb-1 flex items-center gap-1">
              ✨ 고객의 변화
            </span>
            <span className="text-slate-200 font-medium">{blueprint.hypothesis.transformation}</span>
          </div>
        </div>
      </section>

      {/* SECTION B: Smallest Validation Plan */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-base text-slate-900">
            B. 가장 작은 검증 계획 (MVP Plan)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly 3 Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              이번 주 실행 행동 3개 (클릭 시 체크)
            </h3>
            <div className="space-y-2">
              {blueprint.smallestValidation.weeklyActions.map((action, idx) => {
                const isDone = completedWeeklyActions.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleAction(idx)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isDone
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-blue-50/40 border-blue-100 text-slate-800 hover:border-blue-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        isDone ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3" />}
                    </div>
                    <span>{action}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation Questions & Channels */}
          <div className="space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-1">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                고객 검증 질문 3개:
              </h3>
              <ul className="space-y-1.5 pl-1">
                {blueprint.smallestValidation.validationQuestions.map((q, i) => (
                  <li key={i} className="text-slate-700 flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold">Q{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">📢 접점 채널:</span>
              <p className="text-slate-600">{blueprint.smallestValidation.channels.join(' / ')}</p>

              <span className="font-bold text-slate-900 block pt-1">🎯 통과 기준 (가설 검증):</span>
              <p className="text-blue-700 font-semibold">{blueprint.smallestValidation.passCriteria}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: Customer Acquisition & Sales Flow Pipeline */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-base text-slate-900">
            C. 고객 유입 및 판매 흐름 ({blueprint.salesFlow.length}단계 퍼널)
          </h2>
        </div>

        {/* Pipeline Steps */}
        <div className="space-y-4">
          {blueprint.salesFlow.map((step) => (
            <div
              key={step.stepNumber}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 relative hover:border-blue-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {step.stepNumber}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{step.stepName}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    {step.referencePrice}
                  </span>
                  <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {step.recommendedChannel}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">제공 상품/오퍼</span>
                  <strong className="text-slate-800">{step.productOrOffer}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">CTA (행동유도)</span>
                  <strong className="text-blue-700">{step.cta}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">운영 방식</span>
                  <strong className="text-slate-800">{step.operationMethod}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION D: 14-Day Action Roadmap */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">
              D. 14일 실행 계획
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            투입 가능 시간: <strong className="text-slate-800">주 {situation.availableHours || 5}시간</strong> 기준
          </span>
        </div>

        <div className="space-y-3">
          {blueprint.fourteenDayPlan.map((plan, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1 sm:w-1/4 shrink-0">
                <span className="inline-block px-2.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[11px]">
                  {plan.dayRange}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{plan.actionTitle}</h3>
              </div>

              <div className="space-y-1 sm:flex-1">
                <p className="text-slate-700">{plan.details}</p>
                <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block font-semibold">
                  ✓ 완료 기준: {plan.completionCriteria}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBackToStep3}
          className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all"
        >
          ← 퍼널 선택 수정
        </button>

        <button
          type="button"
          onClick={onProceedToStep5}
          className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <span>Step 5: 상세 실행 자료 (카피/랜딩 draft) 확인</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
