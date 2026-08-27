import { NextRequest, NextResponse } from 'next/server';
import { fetchExecutionBlueprint } from '@/lib/gemini';
import { UserSituation, RevenueModel, FunnelType } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const situation: UserSituation = body.situation;
    const selectedModel: RevenueModel = body.selectedModel;
    const funnelType: FunnelType = body.funnelType;
    const forceDemo: boolean = body.forceDemo || false;

    if (!situation || !selectedModel || !funnelType) {
      return NextResponse.json(
        { error: '필수 데이터(사용자 상황, 선택 아이템, 퍼널 방식)가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (forceDemo) {
      const { generateDemoBlueprint } = await import('@/lib/demoData');
      return NextResponse.json({
        blueprint: generateDemoBlueprint(situation, selectedModel, funnelType),
        isDemo: true
      });
    }

    const result = await fetchExecutionBlueprint(situation, selectedModel, funnelType);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/generate-blueprint:', error);
    return NextResponse.json(
      { error: '실행 구조 생성 중 오류가 발생했습니다. 데모 모드로 전환합니다.' },
      { status: 500 }
    );
  }
}
