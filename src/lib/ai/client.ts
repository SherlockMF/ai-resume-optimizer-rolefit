import {
  MOCK_DIAGNOSE,
  MOCK_OUTREACH,
  MOCK_PORTFOLIO,
  MOCK_REFINE,
  MOCK_TRANSLATE,
} from "@/lib/ai/mock-data";

/**
 * 可替换的 LLM 客户端封装层。
 * 通过环境变量切换 Provider，勿在业务代码中硬编码模型名称。
 *
 * LLM_PROVIDER: openai | mock
 * LLM_API_KEY: API 密钥
 * LLM_BASE_URL: 可选，兼容 OpenAI 格式的第三方端点
 * LLM_MODEL: 模型 ID（由 Provider 决定，不在代码中写死）
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface LLMClient {
  complete(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): Promise<string>;
}

function getEnv(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;
  // 去掉 .env 里误写的引号
  return raw.replace(/^["']|["']$/g, "");
}

/** 兼容用户把完整 /chat/completions 写进 BASE_URL 的情况 */
function normalizeBaseUrl(url: string): string {
  let base = url.replace(/\/$/, "");
  if (base.endsWith("/chat/completions")) {
    base = base.slice(0, -"/chat/completions".length);
  }
  return base;
}

class OpenAICompatibleClient implements LLMClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private isDeepSeek: boolean;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.model = model;
    this.isDeepSeek = /deepseek\.com/i.test(this.baseUrl);
  }

  async complete(
    messages: ChatMessage[],
    options?: CompletionOptions,
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.4,
      // Netlify 函数时限较短；结构化输出无需过大 completion
      max_tokens: options?.maxTokens ?? 4096,
    };

    if (options?.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    // DeepSeek V4 默认开启 thinking，会把 token 耗在 reasoning 上且极易超时
    if (this.isDeepSeek) {
      body.thinking = { type: "disabled" };
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.cause instanceof Error
            ? `${error.message}（${error.cause.message}）`
            : error.message
          : "网络错误";
      const hint =
        /eacces|198\.18\./i.test(detail)
          ? " 常见原因：本机代理（Clash 等 Fake-IP）拦截了 Node 进程，请对 api.deepseek.com 设置直连后重启 npm run dev。"
          : "";
      throw new Error(`无法连接 LLM 服务 ${this.baseUrl}：${detail}.${hint}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `LLM API 请求失败 (${response.status}): ${errorText.slice(0, 500)}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          reasoning_content?: string | null;
        };
      }>;
    };

    const message = data.choices?.[0]?.message;
    const content = message?.content?.trim();
    if (content) return content;

    // 智谱等模型偶发把正文放在 reasoning_content
    const reasoning = message?.reasoning_content?.trim();
    if (reasoning) return reasoning;

    throw new Error("LLM API 返回内容为空");
  }
}

/** MVP 演示：无 API Key 时返回结构化示例，便于本地开发 */
class MockLLMClient implements LLMClient {
  async complete(messages: ChatMessage[]): Promise<string> {
    const userContent =
      messages.find((m) => m.role === "user")?.content ?? "";

    const hasResume =
      userContent.includes("简历") ||
      userContent.includes("候选人") ||
      userContent.length > 200;

    if (!hasResume) {
      throw new Error("Mock 模式需要有效的简历与 JD 输入");
    }

    if (
      userContent.includes("请生成适合 Boss") ||
      userContent.includes("【生成平台】")
    ) {
      return JSON.stringify(MOCK_OUTREACH);
    }

    if (userContent.includes("将中文简历本地化")) {
      return JSON.stringify(MOCK_TRANSLATE);
    }

    if (userContent.includes("项目作品集顾问")) {
      return JSON.stringify(MOCK_PORTFOLIO);
    }

    if (
      userContent.includes("此前诊断结果") ||
      userContent.includes("用户对追问的回答")
    ) {
      return JSON.stringify(MOCK_REFINE);
    }

    if (userContent.includes("请返回诊断 JSON")) {
      return JSON.stringify(MOCK_DIAGNOSE);
    }

    return JSON.stringify(MOCK_DIAGNOSE);
  }
}

function logDevLLM(
  provider: string,
  model: string,
  durationMs: number,
  routeHint: string,
) {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[LLM]", { provider, model, durationMs, route: routeHint });
}

function withDevLogging(
  inner: LLMClient,
  provider: string,
  model: string,
): LLMClient {
  return {
    async complete(messages, options) {
      const start = Date.now();
      const routeHint =
        messages.find((m) => m.role === "user")?.content.slice(0, 40) ?? "unknown";
      try {
        return await inner.complete(messages, options);
      } finally {
        logDevLLM(provider, model, Date.now() - start, routeHint);
      }
    },
  };
}

let cachedClient: LLMClient | null = null;

export function createLLMClient(): LLMClient {
  if (cachedClient) return cachedClient;

  const provider = getEnv("LLM_PROVIDER") ?? "mock";
  const apiKey = getEnv("LLM_API_KEY");
  const baseUrl =
    getEnv("LLM_BASE_URL") ?? "https://api.openai.com/v1";
  const model = getEnv("LLM_MODEL") ?? "gpt-4o-mini";

  if (provider === "mock" || !apiKey) {
    cachedClient = withDevLogging(new MockLLMClient(), "mock", "mock");
    return cachedClient;
  }

  if (provider === "openai" || provider === "compatible") {
    cachedClient = withDevLogging(
      new OpenAICompatibleClient(apiKey, baseUrl, model),
      provider,
      model,
    );
    return cachedClient;
  }

  throw new Error(
    `不支持的 LLM_PROVIDER: ${provider}。请使用 openai、compatible 或 mock。`,
  );
}

export function resetLLMClientCache(): void {
  cachedClient = null;
}
