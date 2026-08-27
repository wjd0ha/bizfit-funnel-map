'use client';

import React, { useState, useEffect } from 'react';
import {
  UserSituation,
  RevenueModel,
  FunnelType,
  ExecutionBlueprint,
} from '@/lib/types';
import { loadMapFromStorage, clearMapFromStorage } from '@/lib/storage';
import { Header } from '@/components/Header';
import { StepIndicator } from '@/components/StepIndicator';
import { Step1InputForm } from '@/components/Step1InputForm';
import { Step2ModelComparison } from '@/components/Step2ModelComparison';
import { Step3FunnelSelection } from '@/components/Step3FunnelSelection';
import { Step4BlueprintResult } from '@/components/Step4BlueprintResult';
import { Step5ArtifactTabs } from '@/components/Step5ArtifactTabs';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<number>(1);

  const [situation, setSituation] = useState<UserSituation>({
    career: '',
    skills: '',
    primaryGoal: 'first_paying_customer',
    availableHours: 5,
    budget: '10만원 이하',
    faceExposure: 'flexible',
  });

  const [models, setModels] = useState<RevenueModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<RevenueModel | null>(null);
  const [selectedFunnelType, setSelectedFunnelType] = useState<FunnelType | undefined>();
  const [blueprint, setBlueprint] = useState<ExecutionBlueprint | null>(null);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSavedData, setHasSavedData] = useState<boolean>(false);

  // Restore saved state from LocalStorage on mount
  useEffect(() => {
    const saved = loadMapFromStorage();
    if (saved && saved.situation && saved.models && saved.models.length > 0) {
      setSituation(saved.situation);
      setModels(saved.models);
      setHasSavedData(true);

      if (saved.selectedModelId) {
        const found = saved.models.find((m) => m.id === saved.selectedModelId);
        if (found) setSelectedModel(found);
      }
      if (saved.selectedFunnelType) {
        setSelectedFunnelType(saved.selectedFunnelType);
      }
      if (saved.blueprint) {
        setBlueprint(saved.blueprint);
        setCurrentStep(4);
        setMaxAccessibleStep(5);
      } else {
        setCurrentStep(2);
        setMaxAccessibleStep(2);
      }
    }
  }, []);

  // Reset function
  const handleReset = () => {
    if (window.confirm('입력된 모든 데이터와 사업 가설을 초기화하시겠습니까?')) {
      clearMapFromStorage();
      setSituation({
        career: '',
        skills: '',
        primaryGoal: 'first_paying_customer',
        availableHours: 5,
        budget: '10만원 이하',
        faceExposure: 'flexible',
      });
      setModels([]);
      setSelectedModel(null);
      setSelectedFunnelType(undefined);
      setBlueprint(null);
      setCurrentStep(1);
      setMaxAccessibleStep(1);
      setHasSavedData(false);
      setError(null);
    }
  };

  // Toggle Demo Mode
  const handleToggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  // Step 1 Submit -> Fetch Models (Step 2)
  const handleStep1Submit = async (inputSituation: UserSituation) => {
    setSituation(inputSituation);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: inputSituation,
          forceDemo: isDemoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '수익모델 분석 중 오류가 발생했습니다.');
      }

      setModels(data.models);
      if (data.models.length > 0) {
        setSelectedModel(data.models[0]);
      }
      setCurrentStep(2);
      setMaxAccessibleStep((prev) => Math.max(prev, 2));
    } catch (err: any) {
      console.error(err);
      setError(err.message || '서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Regenerate Models with condition
  const handleRegenerateModels = async (filterCondition: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation,
          filterCondition,
          forceDemo: isDemoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '조건 재생성 중 오류가 발생했습니다.');
      }

      setModels(data.models);
      if (data.models.length > 0) {
        setSelectedModel(data.models[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '재생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Model Select -> Step 3
  const handleSelectModel = (model: RevenueModel) => {
    setSelectedModel(model);
    setCurrentStep(3);
    setMaxAccessibleStep((prev) => Math.max(prev, 3));
  };

  // Step 3 Funnel Select -> Fetch Blueprint (Step 4)
  const handleSelectFunnel = async (funnelType: FunnelType) => {
    if (!selectedModel) return;
    setSelectedFunnelType(funnelType);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation,
          selectedModel,
          funnelType,
          forceDemo: isDemoMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '실행 구조 생성 중 오류가 발생했습니다.');
      }

      setBlueprint(data.blueprint);
      setCurrentStep(4);
      setMaxAccessibleStep((prev) => Math.max(prev, 5));
    } catch (err: any) {
      console.error(err);
      setError(err.message || '실행 구조 생성 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <Header
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onReset={handleReset}
        hasSavedData={hasSavedData}
      />

      {/* 5-Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
        maxAccessibleStep={maxAccessibleStep}
      />

      {/* Global Error Banner */}
      {error && (
        <div className="max-w-3xl mx-auto mt-4 px-4">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-600 font-bold text-xs hover:underline"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Main Step Content Container */}
      <main className="flex-1 pb-16">
        {currentStep === 1 && (
          <Step1InputForm
            initialValues={situation}
            onSubmit={handleStep1Submit}
            isLoading={isLoading}
            isDemoMode={isDemoMode}
          />
        )}

        {currentStep === 2 && (
          <Step2ModelComparison
            models={models}
            selectedModelId={selectedModel?.id}
            onSelectModel={handleSelectModel}
            onRegenerateWithCondition={handleRegenerateModels}
            onBackToStep1={() => setCurrentStep(1)}
            isLoading={isLoading}
            isDemoMode={isDemoMode}
          />
        )}

        {currentStep === 3 && selectedModel && (
          <Step3FunnelSelection
            situation={situation}
            selectedModel={selectedModel}
            selectedFunnelType={selectedFunnelType}
            onSelectFunnel={handleSelectFunnel}
            onBackToStep2={() => setCurrentStep(2)}
            isLoading={isLoading}
          />
        )}

        {currentStep === 4 && selectedModel && blueprint && (
          <Step4BlueprintResult
            situation={situation}
            model={selectedModel}
            blueprint={blueprint}
            onProceedToStep5={() => setCurrentStep(5)}
            onBackToStep3={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && selectedModel && blueprint && (
          <Step5ArtifactTabs
            situation={situation}
            model={selectedModel}
            blueprint={blueprint}
            isDemoMode={isDemoMode}
            onRestart={() => setCurrentStep(1)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center space-y-2">
        <div className="max-w-4xl mx-auto px-4">
          <p className="font-semibold text-slate-300">Bizfit Funnel Map V1</p>
          <p className="text-slate-500">
            내 경험을, 고객이 결제하는 사업 구조로 정리합니다. | 본 서비스는 실행 가설 생성 도구입니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
