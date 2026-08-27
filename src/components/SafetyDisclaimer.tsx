import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface SafetyDisclaimerProps {
  variant?: 'banner' | 'card';
}

export const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({ variant = 'banner' }) => {
  if (variant === 'card') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Bizfit AI 서비스 기준 및 안심 안내</span>
        </div>
        <p className="leading-relaxed">
          • 이 서비스는 수익을 보장하거나 자동 수익을 약속하지 않습니다.<br />
          • 결과로 제시되는 내용은 사용자 조건 기반의 <strong>실행 가설</strong>입니다.<br />
          • 법률·세무·의료·정부지원사업 등 전문 판단은 최신 법령 및 전문가 확인이 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-y border-amber-200 py-3 px-4 text-amber-900 text-xs sm:text-sm font-medium flex items-start sm:items-center justify-center gap-2.5 shadow-inner">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
      <p className="text-center leading-snug">
        “이 결과는 실행 가설입니다. 실제 수요, 가격, 법적·정책적 조건은 고객 반응과 최신 기준을 별도로 확인하세요.”
      </p>
    </div>
  );
};
