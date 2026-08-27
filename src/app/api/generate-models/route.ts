import { NextRequest, NextResponse } from 'next/server';
import { fetchRevenueModels } from '@/lib/gemini';
import { UserSituation } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const situation: UserSituation = body.situation;
    const filterCondition: string | undefined = body.filterCondition;
    const forceDemo: boolean = body.forceDemo || false;

    if (!situation || !situation.career || !situation.skills) {
      return NextResponse.json(
        { error: '필수 입력 항목(경력, 보유 기술)이 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (forceDemo) {
      const { generateDemoModels } = await import('@/lib/demoData');
      return NextResponse.json({
        models: generateDemoModels(situation, filterCondition),
        isDemo: true
      });
    }

    const result = await fetchRevenueModels(situation, filterCondition);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in /api/generate-models:', error);
    return NextResponse.json(
      { error: '수익모델 생성 중 오류가 발생했습니다. 데모 모드로 시도합니다.' },
      { status: 500 }
    );
  }
}
