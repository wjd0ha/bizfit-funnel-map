import React, { useState } from 'react';
import { UserSituation, GoalType, FaceExposureType } from '@/lib/types';
import { Sparkles, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SafetyDisclaimer } from './SafetyDisclaimer';

interface Step1InputFormProps {
  initialValues: UserSituation;
  onSubmit: (situation: UserSituation) => void;
  isLoading: boolean;
  isDemoMode: boolean;
}

export const Step1InputForm: React.FC<Step1InputFormProps> = ({
  initialValues,
  onSubmit,
  isLoading,
  isDemoMode,
}) => {
  const [career, setCareer] = useState(initialValues.career || '');
  const [skills, setSkills] = useState(initialValues.skills || '');
  const [primaryGoal, setPrimaryGoal] = useState<GoalType>(
    initialValues.primaryGoal || 'first_paying_customer'
  );

  const [channels, setChannels] = useState(initialValues.channels || '');
  const [availableHours, setAvailableHours] = useState<number>(
    initialValues.availableHours || 5
  );
  const [budget, setBudget] = useState(initialValues.budget || '10만원 이하');
  const [faceExposure, setFaceExposure] = useState<FaceExposureType>(
    initialValues.faceExposure || 'flexible'
  );
  const [existingContent, setExistingContent] = useState(
    initialValues.existingContent || ''
  );
  const [dislikedConditions, setDislikedConditions] = useState(
    initialValues.dislikedConditions || ''
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!career.trim()) {
      errs.career = '실제 경험하신 직무나 경험을 1문장 이상 입력해 주세요.';
    }
    if (!skills.trim()) {
      errs.skills = '잘하는 일이나 주변에서 자주 요청받는 지식을 입력해 주세요.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      career,
      skills,
      primaryGoal,
      channels: channels.trim() || undefined,
      availableHours,
      budget,
      faceExposure,
      existingContent: existingContent.trim() || undefined,
      dislikedConditions: dislikedConditions.trim() || undefined,
    });
  };

  // Channel Quick Tags
  const quickChannels = ['네이버 블로그', '인스타그램', '당근 동네생활', '카카오톡 채널', '유튜브', '오프라인 단골/인맥'];
  const handleToggleChannelTag = (tag: string) => {
    if (channels.includes(tag)) {
      setChannels(
        channels
          .split(',')
          .map(c => c.trim())
          .filter(c => c !== tag)
          .join(', ')
      );
    } else {
      setChannels(channels ? `${channels}, ${tag}` : tag);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Intro Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 — 사업 상황 입력</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          당신의 경험과 조건을 알려주세요
        </h1>
        <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
          거창한 사업계획서나 큰 자본 없이도 시작할 수 있습니다.<br className="hidden sm:inline" />
          현재 가지고 계신 실무 경험, 시간, 예산 안에서 검증 가능한 사업 가설을 만듭니다.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              필수 입력 사항
            </h2>
            <span className="text-xs text-red-500 font-medium">* 필수</span>
          </div>

          {/* 1. Career / Job */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              1. 경력 · 직업 또는 실제 해본 일 <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500">
              예시: 3년 차 마케터, 카페 운영 경험, 엑셀/노션 정리 실무, 아동 미술 지도, 부동산 중개 보조 등
            </p>
            <input
              type="text"
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              placeholder="예: 5년 차 온라인 쇼핑몰 상세페이지 제작 및 운영 담당자"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.career
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                  : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {errors.career && (
              <p className="text-xs text-red-600 font-medium">{errors.career}</p>
            )}
          </div>

          {/* 2. Skills / Favors */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">
              2. 잘하는 일 · 보유 기술 · 반복해서 부탁받는 일 <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500">
              예시: 카드뉴스 제작, 엑셀 수식 및 대시보드, 글쓰기 피드백, 블로그 세팅, 단골 고객 상담
            </p>
            <textarea
              rows={3}
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="예: 노션으로 업무 체크리스트 만들기, 캔바로 깔끔한 포스터 제작, 초보자용 블로그 글쓰기 지도"
              className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.skills
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                  : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {errors.skills && (
              <p className="text-xs text-red-600 font-medium">{errors.skills}</p>
            )}
          </div>

          {/* 3. Primary Goal */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-800">
              3. 우선 목표 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'first_paying_customer',
                  label: '첫 유료 고객 검증',
                  desc: '가장 빠르게 1명의 첫 구매 고객 만들기',
                },
                {
                  id: 'monthly_side_income',
                  label: '월 부수입 창출',
                  desc: '주당 소수 시간 투자로 추가 수익 올리기',
                },
                {
                  id: 'increase_customers',
                  label: '기존 고객 증가',
                  desc: '이미 시작한 서비스의 고객 유입 확대',
                },
                {
                  id: 'reduce_repetitive_work',
                  label: '반복 업무 감소 & 디지털 자산화',
                  desc: '시간을 직접 안 써도 되는 템플릿/자료 판매',
                },
              ].map((item) => {
                const isSelected = primaryGoal === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPrimaryGoal(item.id as GoalType)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Optional Inputs Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              선택 입력 사항 (더 정밀한 퍼널 설계를 위한 조건)
            </h2>
            <span className="text-xs text-slate-500">선택</span>
          </div>

          {/* 4. Channels with Quick Tags */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              현재 활용 가능한 고객 접점 (채널)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {quickChannels.map((tag) => {
                const active = channels.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleChannelTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {active ? `✓ ${tag}` : `+ ${tag}`}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={channels}
              onChange={(e) => setChannels(e.target.value)}
              placeholder="예: 네이버 블로그 (이웃 300명), 인스타그램, 당근마켓"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 5. Hours & Budget Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                주당 투입 가능한 시간: <span className="text-blue-600 font-bold">{availableHours}시간</span>
              </label>
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>주 2시간 (최소)</span>
                <span>주 15시간</span>
                <span>주 30시간 (전업)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                초기 실행 예산
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0원 (무자본 검증)">0원 (무자본 검증)</option>
                <option value="10만원 이하">10만원 이하 (가벼운 툴/소액 소모비)</option>
                <option value="30만원 이하">30만원 이하 (샘플 제작 및 홍보)</option>
                <option value="50만원 이상">50만원 이상</option>
              </select>
            </div>
          </div>

          {/* 6. Face Exposure */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              얼굴 노출 가능 여부
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'allowed', label: '가능 (노출 가능)' },
                { id: 'not_allowed', label: '얼굴 노출 없이' },
                { id: 'flexible', label: '유연하게 선택' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFaceExposure(opt.id as FaceExposureType)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    faceExposure === opt.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 7. Existing Content & Disliked Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                보유 중인 자료 · 콘텐츠
              </label>
              <input
                type="text"
                value={existingContent}
                onChange={(e) => setExistingContent(e.target.value)}
                placeholder="예: 정리해둔 엑셀 서식, 업무 매뉴얼 파일"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                피하고 싶은 방식 또는 조건
              </label>
              <input
                type="text"
                value={dislikedConditions}
                onChange={(e) => setDislikedConditions(e.target.value)}
                placeholder="예: 강의 제외, 실시간 전화상담 부담, 오프라인 미팅 제외"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Privacy Assurance Notice */}
        <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Bizfit은 개인정보, 사업자번호, 계좌 정보를 수집하지 않습니다. 입력한 내용은 가설 분석에만 사용됩니다.
          </span>
        </div>

        {/* Safety Disclaimer */}
        <SafetyDisclaimer variant="card" />

        {/* Submit Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>수익모델 8~10개 후보 분석 중...</span>
              </span>
            ) : (
              <>
                <span>다음: 수익모델 후보 비교하기 (8~10개 분석)</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
