import React from 'react';
import { Compass, RotateCcw, Sparkles, Database } from 'lucide-react';

interface HeaderProps {
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onReset: () => void;
  hasSavedData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isDemoMode,
  onToggleDemoMode,
  onReset,
  hasSavedData
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand Header & Taglines */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                Bizfit <span className="text-blue-400 font-normal">Funnel Map</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                V1
              </span>
            </div>
            <p className="text-xs text-slate-300 hidden sm:block">
              내 경험을, 고객이 결제하는 사업 구조로 정리합니다.
            </p>
          </div>
        </div>

        {/* Tagline & Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2 text-xs">
          <span className="text-slate-400 text-xs hidden lg:inline">
            감으로 하던 사업을 구조로 정리합니다.
          </span>

          {/* Mode Toggle Button */}
          <button
            onClick={onToggleDemoMode}
            type="button"
            className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              isDemoMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
            title="클릭하여 AI 모드와 데모 모드를 전환할 수 있습니다."
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isDemoMode ? '데모 체험 모드' : '실시간 AI 모드'}</span>
          </button>

          {/* Saved Data Status */}
          {hasSavedData && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
              <Database className="w-3 h-3 text-blue-400" />
              <span>저장됨</span>
            </span>
          )}

          {/* Reset Button */}
          <button
            onClick={onReset}
            type="button"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1"
            title="입력 데이터 및 가설 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">처음부터</span>
          </button>
        </div>
      </div>
    </header>
  );
};
