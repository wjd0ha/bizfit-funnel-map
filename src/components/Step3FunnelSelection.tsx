import React, { useState } from 'react';
import { FunnelOption, FunnelType, RevenueModel, UserSituation } from '@/lib/types';
import { getFunnelOptions } from '@/lib/demoData';
import { Sparkles, ArrowRight, CheckCircle2, ShieldAlert, Check, HelpCircle } from 'lucide-react';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface Step3FunnelSelectionProps {
  situation: UserSituation;
  selectedModel: RevenueModel;
  selectedFunnelType?: FunnelType;
  onSelectFunnel: (funnelType: FunnelType) => void;
  onBackToStep2: () => void;
  isLoading: boolean;
}

export const Step3FunnelSelection: React.FC<Step3FunnelSelectionProps> = ({
  situation,
  selectedModel,
  selectedFunnelType,
  onSelectFunnel,
  onBackToStep2,
  isLoading,
}) => {
  const funnelOptions: FunnelOption[] = getFunnelOptions(situation);
  const [currentSelected, setCurrentSelected] = useState<FunnelType>(
    selectedFunnelType || funnelOptions.find(f => f.isRecommended)?.type || 'validation'
  );

  const activeFunnel = funnelOptions.find(f => f.type === currentSelected) || funnelOptions[0];

  const handleConfirm = () => {
    onSelectFunnel(currentSelected);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Intro Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 3 — 첫 고객 확보 방식 선택</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          어떻게 첫 결제 고객을 유도할까요?
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
          선택하신 <strong className="text-slate-900">[{selectedModel.name}]</strong> 아이템을<br className="hidden sm:inline" />
          가장 효과적으로 검증하고 고객이 결제하게 만들 5가지 퍼널 방식을 제안합니다.
        </p>
      </div>

      {/* Selected Model Summary Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-800 shadow-md">
        <div>
          <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">
            Step 2에서 선택한 수익모델
          </span>
          <h3 className="font-extrabold text-base text-white mt-0.5">
            {selectedModel.name}
          </h3>
          <p className="text-xs text-slate-400">
            {selectedModel.targetCustomer} / {selectedModel.recommendedFormat}
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToStep2}
          className="text-xs text-slate-300 hover:text-white underline underline-offset-4 shrink-0"
        >
          아이템 변경하기
        </button>
      </div>

      {/* 5 Funnel Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
          <span>5가지 첫 고객 확보 퍼널 패턴</span>
          <span className="text-xs text-slate-500 font-normal">AI 추천 및 직접 선택 지원</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funnelOptions.map((funnel) => {
            const isSelected = currentSelected === funnel.type;

            return (
              <div
                key={funnel.type}
                onClick={() => setCurrentSelected(funnel.type)}
                className={`rounded-2xl border p-5 transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-white ring-4 ring-blue-500/15 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  {/* Recommended Badge & Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900 text-base">
                      {funnel.title}
                    </span>
                    {funnel.isRecommended && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI 추천
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {funnel.subtitle}
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {funnel.description}
                  </p>

                  {/* Suitability */}
                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700">
                    <span className="font-bold text-slate-900">✅ 잘 맞는 상황: </span>
                    {funnel.bestSuitedFor}
                  </div>
                </div>

                {/* Selection Footer */}
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSelected(funnel.type);
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>선택된 퍼널 방식입니다</span>
                      </>
                    ) : (
                      <span>이 방식 선택하기</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Funnel Detail Box */}
      {activeFunnel && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-white">
              선택한 [{activeFunnel.title}] 사전 가이드
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-800/80 rounded-xl p-3.5 space-y-2 border border-slate-700/60">
              <span className="font-bold text-blue-300 flex items-center gap-1">
                📌 먼저 준비할 것 ({activeFunnel.prepNeeded.length}개):
              </span>
              <ul className="space-y-1 text-slate-300 pl-1">
                {activeFunnel.prepNeeded.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-950/40 rounded-xl p-3.5 space-y-2 border border-amber-800/40">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                ⚠️ 주의할 점:
              </span>
              <ul className="space-y-1 text-slate-300 pl-1">
                {activeFunnel.cautions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Safety Disclaimer */}
      <SafetyDisclaimer />

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBackToStep2}
          className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all"
        >
          ← 수익모델 선택으로 돌아가기
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={handleConfirm}
          className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>실행 구조 설계 중...</span>
            </span>
          ) : (
            <>
              <span>Step 4: 실행 구조 결과 확인하기</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
