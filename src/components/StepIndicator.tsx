import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number; // 1 to 5
  onStepClick: (step: number) => void;
  maxAccessibleStep: number;
}

const STEPS = [
  { step: 1, label: '상황 입력', sub: '경력·기술' },
  { step: 2, label: '수익모델 비교', sub: '8~10개 아이템' },
  { step: 3, label: '퍼널 선택', sub: '첫 고객 확보' },
  { step: 4, label: '실행 구조', sub: '가설·14일 계획' },
  { step: 5, label: '상세 자료', sub: '카피·랜딩 draft' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  maxAccessibleStep,
}) => {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white overflow-x-auto py-3 px-4 no-scrollbar">
      <div className="max-w-5xl mx-auto flex items-center justify-between min-w-[580px]">
        {STEPS.map((s, idx) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const isAccessible = s.step <= maxAccessibleStep;

          return (
            <React.Fragment key={s.step}>
              {/* Connector Line */}
              {idx > 0 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    currentStep >= s.step ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                />
              )}

              {/* Step Item */}
              <button
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && onStepClick(s.step)}
                className={`flex items-center gap-2 group transition-all text-left ${
                  !isAccessible ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white ring-4 ring-blue-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.step}
                </div>
                <div>
                  <div
                    className={`text-xs font-semibold whitespace-nowrap ${
                      isCurrent
                        ? 'text-white'
                        : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </div>
                  <div className="text-[10px] text-slate-500 hidden sm:block whitespace-nowrap">
                    {s.sub}
                  </div>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};
