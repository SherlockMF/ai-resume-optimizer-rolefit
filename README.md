# RoleFit

面向转行求职者的中文 AI 简历匹配与面试转化工具。把经历对齐目标岗位（**Role Fit**），提高拿面试的概率。

当前版本 **v0.4** · **[更新日志](./CHANGELOG.md)** · 应用内说明：`/changelog`

默认示例场景：**城市规划师 → AI 产品经理**；v0.4 起支持任意转行起点与目标角色。

## 产品定位

**不是把简历写得更漂亮，而是提高拿面试的概率。**

围绕「诊断 → 量化追问 → 终稿 → 投递跟进」做成一套本地优先的求职工作台，而不是一次性润色。

### 核心能力

| 能力 | 说明 |
|------|------|
| 岗位匹配诊断 | 多维度评分、JD 关键词覆盖、能力缺口、投递策略 |
| 自定义转行路径 | 当前 / 目标角色可自由填写；内置转行模板一键填充 |
| 目标语境 | 可选填目标公司 / 行业，影响诊断与话术 |
| JD 输入 | 粘贴文本，或尝试从链接抓取（失败时请改粘贴） |
| 量化追问向导 | 补充真实数据后再生成终稿；可跳过生成保守版 |
| ATS 检测 | 兼容性清单，降低被系统筛掉的风险 |
| 逐条经历优化 | 问题 / 追问 / 面试风险 / 修改理由 |
| 面试准备 | 追问预测与回答提纲 |
| 双版本简历 | 人工阅读版 + ATS 投递版，可本地编辑 |
| 导出 | Markdown / ATS 文本、Word（`.docx`）、打印预览 PDF |
| 投递辅助 | Boss / LinkedIn / 邮件话术（按需生成） |
| 国际化材料 | 英文简历 + LinkedIn Headline / About（按需生成） |
| 作品集 | 经历扩展为 Markdown case（按需生成） |
| 岗位版本 | 多 JD 终稿存档，勾选 2 个并排对比 |
| 投递看板 | 待投递 / 已投递 / 面试中 / Offer / 已拒绝；桌面端可拖拽改状态 |
| 本地历史 | 侧栏最近 5 条，可置顶；支持 JSON 备份 / 导入 |

## 技术栈

- **框架**：Next.js App Router（16.x）、React 19、TypeScript
- **UI**：Tailwind CSS 4、shadcn/ui、Base UI
- **表单**：React Hook Form + Zod
- **LLM**：可替换客户端 `src/lib/ai/client.ts`（mock / OpenAI 兼容，如智谱 GLM）
- **存储**：浏览器本地 `src/lib/storage/`（history / versions / applications / backup）
- **文件**：PDF / DOCX 解析；`docx` 导出 Word

## 快速开始

```bash
npm install
cp .env.example .env.local
npm run dev
```

启动时从 **3000** 起自动找空端口（至 3010），并在终端打印最终访问地址。

| 命令 | 说明 |
|------|------|
| `npm run dev` | 首选 3000，占用则自动递增 |
| `npm run dev:3002` | 固定从 3002 起找空端口 |
| `npm run dev:kill` | 结束 3000–3010 上的残留 Node/Next 进程（Windows 可用） |

### 页面

| 路径 | 说明 |
|------|------|
| `/` | 产品介绍与入口 |
| `/optimizer` | 诊断 → 追问 → 终稿主流程 |
| `/versions` | 多岗位版本管理与对比 |
| `/applications` | 投递进度看板 |
| `/changelog` | 面向用户的版本说明 |

（端口以终端打印为准，上表以 `http://localhost:3000` 为例。）

### LLM 配置（智谱 GLM-5.1 示例）

在 `.env.local` 中配置：

```env
LLM_PROVIDER=compatible
LLM_API_KEY=你的智谱API密钥
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_MODEL=glm-5.1

# 可选：页脚展示
NEXT_PUBLIC_LLM_PROVIDER=compatible
NEXT_PUBLIC_LLM_MODEL=glm-5.1
```

未配置 Key、或 `LLM_PROVIDER=mock` 时走 mock 模式，可完整走通「诊断 → 追问 → 终稿」。

其他 OpenAI 兼容服务（DeepSeek 等）同样设置 `LLM_PROVIDER=compatible` 与对应 `LLM_BASE_URL` / `LLM_MODEL` 即可。完整注释见 [`.env.example`](./.env.example)。

## Supabase 用户与同步

未登录时数据仅存在浏览器 `localStorage`。

**登录后以 Supabase 为唯一数据源**：会清空本机业务数据并拉取该账号云端数据；之后诊断、终稿、版本与投递看板的变更会自动写穿到云端。登出时清空本地业务缓存。

### 在线求职主页（2.0）

- 工作台：`/online-resume`、`/online-resume/new`、`/online-resume/[id]/edit`
- 公开页：`/p/[slug]`（无需登录）
- 另执行 [`supabase/migrations/20260821000000_online_resume_pages.sql`](./supabase/migrations/20260821000000_online_resume_pages.sql)

1. 创建 Supabase 项目，在 SQL Editor 执行 [`supabase/migrations/20260816000000_rolefit_core.sql`](./supabase/migrations/20260816000000_rolefit_core.sql) 与 online resume migration。
2. 在 Supabase Auth 的 URL Configuration 中添加本地与生产回调地址，例如 `http://localhost:3000/auth/callback`、`http://localhost:3002/auth/callback` 和 `https://lomivex.top/auth/callback`（以及 `https://www.lomivex.top/auth/callback`）。
3. 在 `.env.local` 与部署平台环境变量中设置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_你的公开密钥
```

不要在浏览器环境变量中填写 `service_role` 或其他私密密钥。迁移已为业务表开启 RLS；请保留 `public` schema 的 Data API 访问配置，以便已登录用户通过受限策略同步自己的数据。

已登录用户每个自然月默认有 10 次 AI 调用额度；未登录用户仍可按本地试用流程使用产品。`ai_usage_events` 只记录功能类型、次数、模型和状态，不保存简历、JD、prompt 或模型全文。

「数据管理」仍支持 JSON 备份，以及手动「重新拉取云端」/「用本地覆盖云端」（危险操作）。

## 使用流程

1. 打开 `/optimizer`，粘贴或上传简历（PDF / DOCX）+ 目标 JD；可选填目标岗位 / 公司 / 行业，或套用转行模板  
2. **开始匹配诊断** → 查看诊断 / JD 匹配 / ATS 等结果  
3. 回答 **量化追问**（可跳过，生成保守版）  
4. 生成终稿 → 编辑双版本简历、导出 Word / PDF；按需打开投递辅助 / 英文 / 作品集 Tab  
5. **加入投递看板**，或在 **岗位版本** 页对比不同 JD 的终稿  

## API

| 路由 | 说明 |
|------|------|
| `POST /api/diagnose-resume` | Step1 诊断 |
| `POST /api/refine-resume` | Step2 终稿（含 `diagnose` + `followUpAnswers`） |
| `POST /api/fetch-jd` | 从 URL 尝试抓取 JD 文本 |
| `POST /api/generate-outreach` | Boss / LinkedIn / 邮件话术（lazy） |
| `POST /api/translate-resume` | 英文简历 + LinkedIn（lazy） |
| `POST /api/generate-portfolio` | 作品集 Markdown（lazy） |
| `POST /api/optimize-resume` | 已废弃，内部转发 diagnose |

投递辅助、英文版、作品集仅在打开对应 Tab 时调用，结果会缓存在本地历史中。

## 目录结构（摘要）

```
src/
  app/                 # 页面与 API Routes
  components/          # 优化器、看板、版本对比等 UI
  lib/ai/              # LLM 客户端与 prompt
  lib/storage/         # 本地 history / versions / applications / backup
scripts/               # 开发端口探测与清理
```

## 部署（Netlify）

线上地址：**https://lomivex.top**（`www.lomivex.top` 为别名）  
备用：https://rolefit-254.netlify.app

- 配置：[`netlify.toml`](./netlify.toml)
- 自动发布：推送 `main` → [GitHub Actions](./.github/workflows/deploy-netlify.yml) → Netlify
- 后台：https://app.netlify.com/projects/rolefit-254/settings/domain

在域名注册商处把 DNS 指到 Netlify 后，证书才会签发：

| 主机记录 | 类型 | 值 |
|----------|------|-----|
| `@`（根域名） | A | `75.2.60.5` |
| `www` | CNAME | `rolefit-254.netlify.app` |

若注册商支持 ALIAS/ANAME，根域名也可指向 `apex-loadbalancer.netlify.com`。DNS 生效后 HTTPS 会自动开通。

默认 `LLM_PROVIDER=mock`（无需 Key）。接真实模型时，在 Netlify → Environment variables 或 GitHub Secrets 对应环境里设置 `LLM_*` / `NEXT_PUBLIC_LLM_*`。

## 支付（Waffo Pancake，测试环境）

- 订阅页：`/billing`
- 结账 API：`POST /api/billing/checkout`（需登录）
- Webhook：`POST /api/webhooks/waffo`（原始 body 验签）
- 环境变量见 [`.env.example`](./.env.example)：`WAFFO_MERCHANT_ID`、`WAFFO_PRIVATE_KEY`（或 `WAFFO_PRIVATE_KEY_BASE64`）、商品 ID、以及服务端 `SUPABASE_SERVICE_ROLE_KEY`
- 首次创建测试订阅商品：配置私钥后执行 `npm run waffo:setup`，把打印出的 `PROD_` 写入环境变量
- 仪表盘登记 Webhook：`https://lomivex.top/api/webhooks/waffo`（测试模式）
- 测试卡：`4576 7500 0000 0110`（成功）/ `4576 7500 0000 0220`（失败）

## 原则

- 不编造经历，只做转译与结构化  
- 对过度包装给出面试风险提示  
- 用户需确认所有数据真实性后再投递  
- 数据默认仅存浏览器本地；可用备份功能导出 JSON，避免清缓存丢失  
