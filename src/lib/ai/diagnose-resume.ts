import { createLLMClient } from "@/lib/ai/client";
import { parseAiJson } from "@/lib/ai/extract-json";
import { normalizeDiagnoseResponse } from "@/lib/ai/normalize";
import { buildDiagnosePrompt } from "@/lib/ai/prompts";
import { getProfileDimensions, resolveRoleProfile } from "@/lib/optimizer/role-profiles";
import {
  diagnoseResponseSchema,
  type DiagnoseRequest,
  type DiagnoseResponse,
} from "@/lib/types/diagnose";

export async function diagnoseResume(
  input: DiagnoseRequest,
): Promise<DiagnoseResponse> {
  const client = createLLMClient();
  const { system, user } = buildDiagnosePrompt(input);

  const raw = await client.complete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.35, maxTokens: 4500, jsonMode: true },
  );

  const parsed = parseAiJson(raw, diagnoseResponseSchema);
  const profile = resolveRoleProfile(input.targetRole);
  const fallbackDimensions = getProfileDimensions(profile);
  return normalizeDiagnoseResponse(parsed, fallbackDimensions);
}
