import React, { useState } from 'react';
import { RevenueModel } from '@/lib/types';
import { Info } from 'lucide-react';

interface PositioningMapProps {
  models: RevenueModel[];
  selectedModelId?: string;
  onSelectModel: (modelId: string) => void;
}

export const PositioningMap: React.FC<PositioningMapProps> = ({
  models,
  selectedModelId,
  onSelectModel,
}) => {
  const [hoveredModel, setHoveredModel] = useState<RevenueModel | null>(null);

  // Grid dimensions
  const width = 600;
  const height = 400;
  const padding = 55;

  // Axis bounds (1 to 5)
  const minX = 1;
  const maxX = 5;
  const minY = 1;
  const maxY = 5;

  const mapX = (val: number) => {
    return padding + ((val - minX) / (maxX - minX)) * (width - 2 * padding);
  };

  const mapY = (val: number) => {
    // Y-axis inverted for SVG (5 at top, 1 at bottom)
    return height - padding - ((val - minY) / (maxY - minY)) * (height - 2 * padding);
  };

  // Cost burden 1 (low cost) -> radius 22px; Cost burden 5 (high cost) -> radius 10px
  const getRadius = (costBurden: number) => {
    const clamped = Math.min(5, Math.max(1, costBurden));
    return 24 - (clamped - 1) * 3.2;
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <span>📊 수익모델 포지셔닝 맵</span>
            <span className="text-xs font-normal text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              실시간 맵
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            점의 크기가 클수록 초기비용 부담이 적은 아이템입니다. 점을 클릭하면 해당 아이템이 선택됩니다.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-blue-500 inline-block border border-white"></span>
            <span>비용 부담 적음 (큰 점)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            <span>비용 부담 큼 (작은 점)</span>
          </span>
        </div>
      </div>

      {/* SVG Map Container */}
      <div className="relative w-full overflow-hidden bg-slate-950/60 rounded-xl border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[420px] select-none"
        >
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map((val) => {
            const x = mapX(val);
            const y = mapY(val);
            return (
              <React.Fragment key={val}>
                {/* Vertical grid line */}
                <line
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={height - padding}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                {/* Horizontal grid line */}
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                {/* X labels */}
                <text
                  x={x}
                  y={height - padding + 20}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {val}점
                </text>
                {/* Y labels */}
                <text
                  x={padding - 15}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="end"
                >
                  {val}점
                </text>
              </React.Fragment>
            );
          })}

          {/* Axes Lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding + 15}
            y2={height - padding}
            stroke="#64748b"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={padding}
            y2={padding - 15}
            stroke="#64748b"
            strokeWidth="2"
          />

          {/* Axis Title Labels */}
          <text
            x={width / 2}
            y={height - 10}
            fill="#e2e8f0"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
          >
            👉 실행 난이도 (1: 쉬움 ➔ 5: 어려움)
          </text>
          <text
            x={15}
            y={height / 2}
            fill="#e2e8f0"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90 15 ${height / 2})`}
          >
            👆 첫 고객 검증 용이성 (1: 어려움 ➔ 5: 쉬움)
          </text>

          {/* Recommended Sweet Spot Quadrant Highlight (Low diff, High validation) */}
          <rect
            x={mapX(1)}
            y={mapY(5)}
            width={mapX(3) - mapX(1)}
            height={mapY(3) - mapY(5)}
            fill="#3b82f6"
            fillOpacity="0.08"
            rx="8"
          />
          <text
            x={mapX(2)}
            y={mapY(4.6)}
            fill="#60a5fa"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            opacity="0.8"
          >
            ★ 추천 영역 (쉬운 실행 & 빠른 검증)
          </text>

          {/* Model Bubbles */}
          {models.map((m, idx) => {
            const x = mapX(m.scores.difficulty);
            const y = mapY(m.scores.validationEase);
            const r = getRadius(m.scores.costBurden);
            const isSelected = selectedModelId === m.id;
            const isHovered = hoveredModel?.id === m.id;

            return (
              <g
                key={m.id}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectModel(m.id)}
                onMouseEnter={() => setHoveredModel(m)}
                onMouseLeave={() => setHoveredModel(null)}
              >
                {/* Selection / Hover Glow Ring */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={r + 6}
                    fill="none"
                    stroke={isSelected ? '#3b82f6' : '#60a5fa'}
                    strokeWidth="2.5"
                    className="animate-pulse"
                  />
                )}

                {/* Bubble Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={isSelected ? '#2563eb' : isHovered ? '#3b82f6' : '#1e293b'}
                  stroke={isSelected ? '#60a5fa' : '#475569'}
                  strokeWidth={isSelected ? '3' : '1.5'}
                />

                {/* Index Number */}
                <text
                  x={x}
                  y={y + 4}
                  fill="#ffffff"
                  fontSize={r > 16 ? '12' : '10'}
                  fontWeight="bold"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover / Selection Rationale Card */}
      {hoveredModel ? (
        <div className="bg-blue-950/80 border border-blue-800/80 rounded-xl p-3.5 text-xs text-slate-200 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-blue-300 text-sm">
              #{models.findIndex((m) => m.id === hoveredModel.id) + 1}. {hoveredModel.name}
            </span>
            <span className="text-[11px] text-blue-400 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700/50">
              클릭 시 선택
            </span>
          </div>
          <p className="text-slate-300 mb-2">{hoveredModel.matchReason}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400">실행 난이도: </span>
              <strong className="text-white">{hoveredModel.scores.difficulty}점</strong>
            </div>
            <div>
              <span className="text-slate-400">첫고객 검증: </span>
              <strong className="text-white">{hoveredModel.scores.validationEase}점</strong>
            </div>
            <div>
              <span className="text-slate-400">초기비용 부담: </span>
              <strong className="text-white">{hoveredModel.scores.costBurden}점</strong>
            </div>
            <div>
              <span className="text-slate-400">반복운영 부담: </span>
              <strong className="text-white">{hoveredModel.scores.operationBurden}점</strong>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-start gap-1">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>{hoveredModel.scoreRationale}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-2 text-xs text-slate-500 italic">
          💡 점 위에 마우스를 올리면 평가 이유를 볼 수 있습니다. (★ 표시 영역은 실행 난이도가 낮고 첫 고객 검증이 빠른 최적 영역입니다)
        </div>
      )}
    </div>
  );
};
