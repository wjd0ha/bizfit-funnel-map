import React, { useState } from 'react';
import { RevenueModel } from '@/lib/types';
import { PositioningMap } from './PositioningMap';
import { Sparkles, ArrowRight, RefreshCw, Check, AlertCircle, Clock, Package, User, Target } from 'lucide-react';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface Step2ModelComparisonProps {
  models: RevenueModel[];
  selectedModelId?: string;
  onSelectModel: (model: RevenueModel) => void;
  onRegenerateWithCondition: (condition: string) => void;
  onBackToStep1: () => void;
  isLoading: boolean;
  isDemoMode: boolean;
}

export const Step2ModelComparison: React.FC<Step2ModelComparisonProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  onRegenerateWithCondition,
  onBackToStep1,
  isLoading,
  isDemoMode,
}) => {
  const [customCondition, setCustomCondition] = useState('');
  const selectedModel = models.find((m) => m.id === selectedModelId);

  const quickFilterPresets = [
    '예산 30만원 이하로',
    '강의는 제외',
    '얼굴 노출 없이',
    '온라인 전용',
    '주 5시간 이하로 가능한 모델만',
  ];

  const handleRegenerate = (condition: string) => {
    if (!condition.trim() || isLoading) return;
    onRegenerateWithCondition(condition);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Intro Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 2 — 수익모델 후보 비교 ({models.length}개 분석)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          공급자 경력 ➔ 실제 결제 고객 연결 구조
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
          입력하신 경력은 공급자(나)의 전문 가치로 정의되었으며, 실제 돈을 내는 구매 고객을 명확히 분리하여 설계했습니다.<br className="hidden sm:inline" />
          포지셔닝 맵과 점수를 비교하여 실행하고 싶은 아이템 1개를 선택해 주세요.
        </p>
      </div>

      {/* Positioning Map Section */}
      <PositioningMap
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={(id) => {
          const target = models.find((m) => m.id === id);
          if (target) onSelectModel(target);
        }}
      />

      {/* Regeneration Filter Control Bar */}
      <div className="bg-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
            조건에 맞춰 후보 다시 제안받기
          </span>
          <span className="text-[11px] text-slate-500">필터 칩 클릭 또는 직접 작성</span>
        </div>

        {/* Quick Chips */}
        <div className="flex flex-wrap gap-2">
          {quickFilterPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={isLoading}
              onClick={() => handleRegenerate(preset)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-xs text-slate-700 font-medium transition-all shadow-sm disabled:opacity-50"
            >
              + {preset}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customCondition}
            onChange={(e) => setCustomCondition(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegenerate(customCondition)}
            placeholder="예: 1:1 진단 위주로, 주말에만 실행 가능, 오프라인 위주"
            className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            disabled={isLoading || !customCondition.trim()}
            onClick={() => handleRegenerate(customCondition)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>재생성</span>
            )}
          </button>
        </div>
      </div>

      {/* Models Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            수익모델 목록 <span className="text-sm font-normal text-slate-500">({models.length}개 분석)</span>
          </h2>
          {selectedModel && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              선택됨: #{models.findIndex((m) => m.id === selectedModel.id) + 1}. {selectedModel.name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {models.map((item, idx) => {
            const isSelected = selectedModelId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectModel(item)}
                className={`rounded-2xl border p-5 transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-white ring-4 ring-blue-500/15 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {/* Header badge & Title */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                      Item #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {item.recommendedFormat}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {item.name}
                  </h3>

                  {/* Provider vs Customer Separation Box */}
                  <div className="bg-slate-50 rounded-xl p-3.5 text-xs space-y-2 text-slate-700 border border-slate-200">
                    <div className="flex items-start gap-1.5 pb-2 border-b border-slate-200/60">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-900 block">👤 공급자(나)의 전문 경력:</span>
                        <span className="text-slate-600">{item.providerProfile?.careerSummary || '입력 전문 경력'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5 pb-1">
                      <Target className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-blue-900 block">🎯 실제 결제 고객 (구매 주체):</span>
                        <span className="text-slate-800 font-medium">{item.targetCustomer}</span>
                      </div>
                    </div>

                    <div className="pl-5 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">💡 고객의 통증: </span>
                      {item.customerProblem || item.problemSolved}
                    </div>
                  </div>

                  {/* Why it fits */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">경력 연결 이유: </strong>
                    {item.matchReason}
                  </p>

                  {/* Scores Grid (1-5) */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900 text-white rounded-xl p-3 text-xs">
                    <div>
                      <span className="text-slate-400">실행 난이도: </span>
                      <strong className={item.scores.difficulty <= 2 ? 'text-emerald-400' : 'text-amber-400'}>
                        {item.scores.difficulty} / 5
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">첫고객 검증: </span>
                      <strong className={item.scores.validationEase >= 4 ? 'text-emerald-400' : 'text-amber-400'}>
                        {item.scores.validationEase} / 5
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">초기비용 부담: </span>
                      <strong className={item.scores.costBurden <= 2 ? 'text-emerald-400' : 'text-amber-400'}>
                        {item.scores.costBurden} / 5
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">반복운영 부담: </span>
                      <strong className={item.scores.operationBurden <= 2 ? 'text-emerald-400' : 'text-amber-400'}>
                        {item.scores.operationBurden} / 5
                      </strong>
                    </div>
                  </div>

                  {/* Prep items & duration */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      <span>준비물 ({item.preparationItems.length}개):</span>
                    </div>
                    <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5 pl-1">
                      {item.preparationItems.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>예상 준비 기간: <strong className="text-slate-700">{item.prepDuration}</strong></span>
                    </div>
                  </div>

                  {/* Risk or Assumption */}
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">확인할 전제/위험: </span>
                      {item.riskOrAssumption}
                    </div>
                  </div>
                </div>

                {/* Bottom Selection Button */}
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectModel(item);
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
                        <span>선택된 수익모델입니다</span>
                      </>
                    ) : (
                      <span>이 수익모델 선택하기</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Disclaimer */}
      <SafetyDisclaimer />

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBackToStep1}
          className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all"
        >
          ← 상황 입력으로 수정
        </button>

        <button
          type="button"
          disabled={!selectedModel || isLoading}
          onClick={() => selectedModel && onSelectModel(selectedModel)}
          className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <span>Step 3: 첫 고객 확보 퍼널 선택하기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
