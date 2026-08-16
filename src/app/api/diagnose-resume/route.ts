import { NextResponse } from "next/server";
import { diagnoseResume } from "@/lib/ai/diagnose-resume";
import { diagnoseRequestSchema } from "@/lib/types/diagnose";
import {
  AiQuotaExceededError,
  prepareAiUsage,
  recordAiUsage,
} from "@/lib/supabase/usage";

export const maxDuration = 90;

export async function POST(request: Request) {
  let usage: Awaited<ReturnType<typeof prepareAiUsage>> = null;
  try {
    const body = await request.json();
    const parsed = diagnoseRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "请求参数无效",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    usage = await prepareAiUsage("diagnose");
    const result = await diagnoseResume(parsed.data);
    await recordAiUsage(usage, "succeeded");
    return NextResponse.json(result);
  } catch (error) {
    await recordAiUsage(usage, "failed").catch(() => undefined);
    if (error instanceof AiQuotaExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    const message =
      error instanceof Error ? error.message : "服务器内部错误";
    console.error("[diagnose-resume]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
