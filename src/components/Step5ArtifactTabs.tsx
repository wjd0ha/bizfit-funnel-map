import React, { useState } from 'react';
import { ExecutionBlueprint, RevenueModel, UserSituation } from '@/lib/types';
import { Sparkles, Copy, Download, Save, Check, FileText, Layout, MessageSquareText, HelpCircle, ShoppingBag } from 'lucide-react';
import { copyToClipboard, generateMarkdownReport } from '@/lib/exportUtils';
import { saveMapToStorage } from '@/lib/storage';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface Step5ArtifactTabsProps {
  situation: UserSituation;
  model: RevenueModel;
  blueprint: ExecutionBlueprint;
  isDemoMode: boolean;
  onRestart: () => void;
}

type TabType = 'touchpoint' | 'offer' | 'landing' | 'content' | 'consultation';

export const Step5ArtifactTabs: React.FC<Step5ArtifactTabsProps> = ({
  situation,
  model,
  blueprint,
  isDemoMode,
  onRestart,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('touchpoint');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const artifacts = blueprint.artifacts;

  const handleCopyFullReport = async () => {
    const md = generateMarkdownReport(situation, model, blueprint);
    const success = await copyToClipboard(md);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownReport(situation, model, blueprint);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bizfit_Funnel_Map_${model.name.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToLocal = () => {
    const success = saveMapToStorage({
      id: `map-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      situation,
      models: [model],
      selectedModelId: model.id,
      blueprint,
      isDemoMode,
    });
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Intro Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 5 — 상세 실행 자료 (Artifacts)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          실행에 바로 쓸 5가지 핵심 카피 & 템플릿
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
          바로 카피하여 SNS, 랜딩페이지, 1:1 메시지에 활용하실 수 있도록 정리했습니다.
        </p>
      </div>

      {/* Control Actions Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800 shadow-md">
        <div>
          <h3 className="font-bold text-sm text-white">Bizfit Funnel Map 결과 저장 & 내보내기</h3>
          <p className="text-xs text-slate-400">보고서 전체를 복사하거나 파일로 다운로드하세요.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSaveToLocal}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5 text-blue-400" />}
            <span>{saved ? '로컬 저장 완료' : '브라우저 저장'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyFullReport}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copied ? '전체 복사됨!' : '전체 복사'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.MD 다운로드</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-2">
        {[
          { id: 'touchpoint', label: '1. 첫 접점 자료', icon: FileText },
          { id: 'offer', label: '2. 첫 유료 상품', icon: ShoppingBag },
          { id: 'landing', label: '3. 랜딩페이지 초안', icon: Layout },
          { id: 'content', label: '4. 유입 콘텐츠 (10선)', icon: MessageSquareText },
          { id: 'consultation', label: '5. Bizfit 상담 전환', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* Tab 1: First Touchpoint */}
      {activeTab === 'touchpoint' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">📄 1. 첫 접점 자료 (미니 카피 & 구조)</h3>
            <p className="text-xs text-slate-500">고객이 부담 없이 첫 관심을 가질 수 있는 무료 체크리스트/진단안입니다.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">📌 매력적인 제목 3안:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium">
                {artifacts.firstTouchpoint.titles.map((t, idx) => (
                  <li key={idx} className="bg-white p-2 rounded border border-slate-100">{t}</li>
                ))}
              </ol>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">📐 자료 구성 단계:</span>
              <ul className="space-y-1 text-slate-700">
                {artifacts.firstTouchpoint.structure.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-blue-900 space-y-1">
              <span className="font-bold block">🚀 강렬한 CTA (행동유도 문구):</span>
              <p className="font-bold text-sm text-blue-700">{artifacts.firstTouchpoint.cta}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: First Paid Offer */}
      {activeTab === 'offer' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">🛍️ 2. 첫 유료 상품 명세서</h3>
            <p className="text-xs text-slate-500">첫 유료 결제 시 명확한 서비스 범위와 포함/제외 사항을 정의합니다.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block">📦 제공 상품 및 서비스 범위:</span>
              <p className="text-slate-800 font-semibold">{artifacts.firstProductOffer.scope}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-900 block">✅ 포함되는 제공물 (Deliverables):</span>
                <ul className="space-y-1 text-emerald-800">
                  {artifacts.firstProductOffer.deliverables.map((d, i) => (
                    <li key={i}>• {d}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 space-y-2">
                <span className="font-bold text-rose-900 block">🚫 제외 범위 (Explicitly Excluded):</span>
                <ul className="space-y-1 text-rose-800">
                  {artifacts.firstProductOffer.excludedScope.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 space-y-2">
              <span className="font-bold block">💡 가격 검증 질문 2가지:</span>
              <ul className="space-y-1">
                {artifacts.firstProductOffer.priceValidationQuestions.map((q, i) => (
                  <li key={i}>Q{i + 1}. {q}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Landing Page Draft */}
      {activeTab === 'landing' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">💻 3. 랜딩페이지 카피 초안 (Draft)</h3>
            <p className="text-xs text-slate-500">노션페이지나 간이 가입 폼에 사용할 수 있는 설득형 6단계 구조 카피입니다.</p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-5 text-xs font-mono">
            <div>
              <span className="text-blue-400 font-bold block mb-1">1. 헤드라인 (Problem Headline)</span>
              <p className="text-base font-sans font-bold text-white leading-snug">
                {artifacts.landingPageDraft.problemHeadline}
              </p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-blue-400 font-bold block mb-1">2. 대상 (Target Audience)</span>
              <p className="text-slate-300 whitespace-pre-line font-sans">{artifacts.landingPageDraft.targetAudience}</p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-blue-400 font-bold block mb-1">3. 해결 방식 (Solution Pitch)</span>
              <p className="text-slate-200 font-sans">{artifacts.landingPageDraft.solutionPitch}</p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-blue-400 font-bold block mb-1">4. 핵심 제공물 (Deliverables)</span>
              <ul className="list-disc list-inside text-slate-300 font-sans space-y-0.5">
                {artifacts.landingPageDraft.deliverablesList.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-blue-400 font-bold block mb-1">5. 진행 방법 (Process Steps)</span>
              <ul className="text-slate-300 font-sans space-y-1">
                {artifacts.landingPageDraft.processSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-blue-400 font-bold block mb-1">6. 최종 CTA</span>
              <div className="bg-blue-600 text-white font-sans font-bold text-sm p-3 rounded-xl text-center">
                {artifacts.landingPageDraft.finalCta}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 10 Content Topics */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">📣 4. 고객 유입 콘텐츠 주제 10선</h3>
            <p className="text-xs text-slate-500">사용자의 채널과 전문성에 맞춘 소셜 미디어/블로그 콘텐츠 주제 아이디어입니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {artifacts.contentTopics.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-100">
                    Topic #{c.id} ({c.channel})
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-xs leading-snug">{c.topic}</h4>
                <p className="text-slate-500 text-[11px]">💡 포인트: {c.keyPoint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Bizfit Consultation Readiness */}
      {activeTab === 'consultation' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm animate-fadeIn">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">💬 5. Bizfit 상담 전환 전 질문 5개</h3>
            <p className="text-xs text-slate-500">실제 고객과 1:1 상담 진행 전 점검할 필수 5가지 체크리스트입니다.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-2">
              {artifacts.consultationReadiness.preQuestions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-slate-800 font-medium pt-0.5">{q}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-900 text-xs font-medium space-y-1">
              <p>{artifacts.consultationReadiness.ctaNotice}</p>
            </div>
          </div>
        </div>
      )}

      {/* Safety Disclaimer */}
      <SafetyDisclaimer />

      {/* Bottom Action Footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onRestart}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-all"
        >
          🔄 다른 조건으로 처음부터 다시 시작
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyFullReport}
            className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '전체 보고서 복사 완료!' : '전체 결과 복사하기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
