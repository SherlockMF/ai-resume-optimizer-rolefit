"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RotateCcw, Sparkles, Wand2, Kanban, Database, Globe } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { ResumeInput } from "@/components/optimizer/resume-input";
import { JobDescriptionInput } from "@/components/optimizer/job-description-input";
import { TargetContextInput } from "@/components/optimizer/target-context-input";
import { FollowUpForm } from "@/components/optimizer/follow-up-form";
import { ResultsTabs } from "@/components/optimizer/results/results-tabs";
import { HistorySidebar } from "@/components/optimizer/history-sidebar";
import { WizardSteps, type WizardStep } from "@/components/optimizer/wizard-steps";
import { DiagnoseSummaryBanner } from "@/components/optimizer/diagnose-summary-banner";
import {
  CollapseToggle,
  CollapsibleInputSection,
} from "@/components/optimizer/collapsible-input-section";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  optimizeResumeRequestSchema,
  type OptimizeResumeRequest,
} from "@/lib/types/resume-optimization";
import type { DiagnoseResponse } from "@/lib/types/diagnose";
import type { RefineResponse } from "@/lib/types/refine";
import {
  load,
  save,
  saveDiagnoseDraft,
  update,
  type HistoryRecord,
} from "@/lib/storage/history";
import type { HistoryExtras } from "@/lib/storage/helpers";
import { saveVersionFromHistory } from "@/lib/storage/versions";
import { createFromHistory } from "@/lib/storage/applications";
import { buildFollowUpFields } from "@/lib/optimizer/follow-up-questions";
import { SAMPLE_FORM } from "@/lib/optimizer/sample-data";
import { seedDemoLocalStorage } from "@/lib/demo/seed-local";
import { OptimizerProgress } from "@/components/optimizer/optimizer-progress";
import { ROLE_PRESETS } from "@/lib/optimizer/role-presets";

type FormValues = OptimizeResumeRequest;

function getWizardStep(
  diagnose: DiagnoseResponse | null,
  refine: RefineResponse | null,
  showFollowUp: boolean,
): WizardStep {
  if (refine) return "done";
  if (showFollowUp && diagnose) return "followup";
  if (diagnose) return "diagnose";
  return "input";
}

function resetSession(
  setters: {
    setDiagnose: (v: DiagnoseResponse | null) => void;
    setRefine: (v: RefineResponse | null) => void;
    setShowFollowUp: (v: boolean) => void;
    setHumanResume: (v: string) => void;
    setAtsResume: (v: string) => void;
    setActiveHistoryId: (v: string | null) => void;
    setFollowUpAnswers: (v: Record<string, string>) => void;
    setInputCollapsed: (v: boolean) => void;
  },
) {
  setters.setDiagnose(null);
  setters.setRefine(null);
  setters.setShowFollowUp(false);
  setters.setHumanResume("");
  setters.setAtsResume("");
  setters.setActiveHistoryId(null);
  setters.setFollowUpAnswers({});
  setters.setInputCollapsed(false);
}

function OptimizerPageContent() {
  const searchParams = useSearchParams();
  const historyFromUrlRef = useRef<string | null>(null);
  const [diagnose, setDiagnose] = useState<DiagnoseResponse | null>(null);
  const [refine, setRefine] = useState<RefineResponse | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<
    Record<string, string>
  >({});
  const [humanResume, setHumanResume] = useState("");
  const [atsResume, setAtsResume] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [extras, setExtras] = useState<HistoryExtras>({});
  const [addedToBoard, setAddedToBoard] = useState(false);
  const [retryAction, setRetryAction] = useState<"diagnose" | "refine" | "refine-skip" | null>(
    null,
  );
  const followUpRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(optimizeResumeRequestSchema),
    defaultValues: {
      originalResumeText: "",
      targetJobDescription: "",
      currentRole: "城市规划师",
      targetRole: "AI产品经理",
      targetCompany: "",
      targetIndustry: "",
      language: "zh-CN",
    },
  });

  const resumeText = form.watch("originalResumeText");
  const jdText = form.watch("targetJobDescription");
  const currentRole = form.watch("currentRole");
  const targetRole = form.watch("targetRole");
  const targetCompany = form.watch("targetCompany") ?? "";
  const targetIndustry = form.watch("targetIndustry") ?? "";
  const wizardStep = getWizardStep(diagnose, refine, showFollowUp);

  const bumpHistory = () => setHistoryKey((k) => k + 1);

  const scrollToFollowUp = () => {
    requestAnimationFrame(() => {
      followUpRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleFillSample = () => {
    form.reset(SAMPLE_FORM);
    setApiError(null);
  };

  const handleLoadFullDemo = () => {
    const bundle = seedDemoLocalStorage();
    form.reset(bundle.form);
    setDiagnose(bundle.diagnose);
    setRefine(bundle.refine);
    setFollowUpAnswers(bundle.followUpAnswers);
    setHumanResume(bundle.refine.optimizedResumeHuman);
    setAtsResume(bundle.refine.optimizedResumeAts);
    setExtras(bundle.extras);
    setActiveHistoryId(bundle.historyId);
    setShowFollowUp(false);
    setInputCollapsed(true);
    setAddedToBoard(false);
    setApiError(null);
    setRetryAction(null);
    historyFromUrlRef.current = bundle.historyId;
    bumpHistory();
  };

  const handleReset = () => {
    resetSession({
      setDiagnose,
      setRefine,
      setShowFollowUp,
      setHumanResume,
      setAtsResume,
      setActiveHistoryId,
      setFollowUpAnswers,
      setInputCollapsed,
    });
    setExtras({});
    setAddedToBoard(false);
    setApiError(null);
  };

  const handleDiagnose = form.handleSubmit(async (data) => {
    setApiError(null);
    setIsDiagnosing(true);
    setRefine(null);
    setHumanResume("");
    setAtsResume("");

    try {
      const response = await fetch("/api/diagnose-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "诊断失败，请稍后重试");
      }
      const result = json as DiagnoseResponse;
      setDiagnose(result);
      setFollowUpAnswers({});
      setShowFollowUp(true);
      setInputCollapsed(true);

      const draft = saveDiagnoseDraft({ inputs: data, diagnose: result });
      setActiveHistoryId(draft.id);
      bumpHistory();
      scrollToFollowUp();
      setRetryAction(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "未知错误");
      setRetryAction("diagnose");
    } finally {
      setIsDiagnosing(false);
    }
  });

  const runRefine = useCallback(
    async (skipFollowUp: boolean) => {
      if (!diagnose) return;
      const data = form.getValues();
      setApiError(null);
      setIsRefining(true);

      const answers = skipFollowUp ? {} : { ...followUpAnswers };

      if (!skipFollowUp) {
        buildFollowUpFields(diagnose).forEach((f) => {
          if (!answers[f.id]?.trim()) {
            answers[f.id] = "暂无精确数据";
          }
        });
      }

      try {
        const response = await fetch("/api/refine-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            diagnose,
            followUpAnswers: answers,
            skipFollowUp,
          }),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? "生成终稿失败，请稍后重试");
        }
        const result = json as RefineResponse;
        setRefine(result);
        setHumanResume(result.optimizedResumeHuman);
        setAtsResume(result.optimizedResumeAts);
        setShowFollowUp(false);

        if (activeHistoryId) {
          update(activeHistoryId, {
            refine: result,
            optimizedResume: result.optimizedResumeHuman,
            matchScore: diagnose.jdMatch.overall,
          });
          saveVersionFromHistory(activeHistoryId);
        } else {
          const record = save({
            inputs: data,
            diagnose,
            refine: result,
            optimizedResume: result.optimizedResumeHuman,
          });
          setActiveHistoryId(record.id);
          saveVersionFromHistory(record.id);
        }
        setAddedToBoard(false);
        bumpHistory();
        setRetryAction(null);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "未知错误");
        setRetryAction(skipFollowUp ? "refine-skip" : "refine");
      } finally {
        setIsRefining(false);
      }
    },
    [diagnose, followUpAnswers, form, activeHistoryId],
  );

  const handleRetry = () => {
    if (retryAction === "diagnose") void handleDiagnose();
    else if (retryAction === "refine-skip") void runRefine(true);
    else if (retryAction === "refine") void runRefine(false);
  };

  const applyRolePreset = (presetId: string | null) => {
    if (!presetId) return;
    const preset = ROLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    form.setValue("currentRole", preset.currentRole);
    form.setValue("targetRole", preset.targetRole);
    if (!form.getValues("targetJobDescription").trim()) {
      form.setValue("targetJobDescription", preset.sampleJd);
    }
  };

  const handleHistorySelect = useCallback((record: HistoryRecord) => {
    setActiveHistoryId(record.id);
    if (record.inputs.fullResume) {
      form.setValue("originalResumeText", record.inputs.fullResume);
    }
    if (record.inputs.fullJd) {
      form.setValue("targetJobDescription", record.inputs.fullJd);
    }
    if (record.meta) {
      form.setValue("currentRole", record.meta.currentRole ?? "城市规划师");
      form.setValue("targetRole", record.meta.targetRole);
      form.setValue("targetCompany", record.meta.targetCompany ?? "");
      form.setValue("targetIndustry", record.meta.targetIndustry ?? "");
    }
    setDiagnose(record.diagnose);
    setRefine(record.refine ?? null);
    setShowFollowUp(!record.refine);
    setInputCollapsed(!!record.diagnose);
    setHumanResume(
      record.optimizedResume ?? record.refine?.optimizedResumeHuman ?? "",
    );
    setAtsResume(record.refine?.optimizedResumeAts ?? "");
    setExtras(record.extras ?? {});
    setAddedToBoard(false);
    setApiError(null);
  }, [form]);

  useEffect(() => {
    const id = searchParams.get("historyId");
    if (!id || historyFromUrlRef.current === id) return;
    const record = load(id);
    if (record) {
      historyFromUrlRef.current = id;
      handleHistorySelect(record);
    }
  }, [searchParams, handleHistorySelect]);

  const handleHumanChange = (v: string) => {
    setHumanResume(v);
    if (activeHistoryId) {
      update(activeHistoryId, { optimizedResume: v });
      bumpHistory();
    }
  };

  const handleExtrasUpdate = (patch: Partial<HistoryExtras>) => {
    const next = { ...extras, ...patch };
    setExtras(next);
    if (activeHistoryId) {
      update(activeHistoryId, { extras: next });
    }
  };

  const handleAddToBoard = () => {
    if (!activeHistoryId) return;
    const app = createFromHistory(activeHistoryId);
    if (app) setAddedToBoard(true);
  };

  const formErrors = form.formState.errors;
  const loading = isDiagnosing || isRefining;

  const inputBlock = (
    <>
      <CollapseToggle
        collapsed={inputCollapsed}
        onToggle={() => setInputCollapsed((c) => !c)}
      />
      <TargetContextInput
        currentRole={currentRole}
        targetRole={targetRole}
        targetCompany={targetCompany}
        targetIndustry={targetIndustry}
        onCurrentRoleChange={(v) =>
          form.setValue("currentRole", v, { shouldValidate: true })
        }
        onTargetRoleChange={(v) =>
          form.setValue("targetRole", v, { shouldValidate: true })
        }
        onTargetCompanyChange={(v) => form.setValue("targetCompany", v)}
        onTargetIndustryChange={(v) => form.setValue("targetIndustry", v)}
        disabled={loading}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ResumeInput
          value={resumeText}
          onChange={(v) =>
            form.setValue("originalResumeText", v, { shouldValidate: true })
          }
          disabled={loading}
        />
        <JobDescriptionInput
          value={jdText}
          onChange={(v) =>
            form.setValue("targetJobDescription", v, { shouldValidate: true })
          }
          disabled={loading}
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              v0.4 · 转行工作台
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              AI 简历匹配优化
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              岗位匹配诊断 → 量化追问 → 风险排雷 → 面试准备
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <WizardSteps current={wizardStep} />
            {diagnose && (
              <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="size-3.5" />
                重新开始
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(260px,280px)_minmax(0,1fr)]">
          <div key={historyKey}>
            <HistorySidebar
              activeId={activeHistoryId}
              onSelect={handleHistorySelect}
            />
          </div>

          <div className="min-w-0 space-y-6">
            <form onSubmit={handleDiagnose} className="space-y-4">
              {!diagnose && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillSample}
                    disabled={loading}
                  >
                    <Wand2 className="size-3.5" />
                    填入示例简历
                  </Button>
                  <Select onValueChange={applyRolePreset}>
                    <SelectTrigger className="h-8 w-[220px] text-xs" disabled={loading}>
                      <SelectValue placeholder="套用转行模板" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_PRESETS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleLoadFullDemo}
                    disabled={loading}
                  >
                    <Database className="size-3.5" />
                    加载完整演示
                  </Button>
                </div>
              )}

              <CollapsibleInputSection
                collapsed={inputCollapsed && !!diagnose}
                onToggle={() => setInputCollapsed(false)}
                resumePreview={resumeText}
                jdPreview={jdText}
              >
                {inputBlock}
              </CollapsibleInputSection>

              {(formErrors.originalResumeText ||
                formErrors.targetJobDescription) && (
                <Alert variant="destructive">
                  <AlertTitle>请完善输入</AlertTitle>
                  <AlertDescription>
                    {formErrors.originalResumeText?.message ??
                      formErrors.targetJobDescription?.message}
                  </AlertDescription>
                </Alert>
              )}

              {(isDiagnosing || isRefining) && (
                <OptimizerProgress
                  active
                  mode={isDiagnosing ? "diagnose" : "refine"}
                />
              )}

              {apiError && (
                <Alert variant="destructive">
                  <AlertTitle>出错了</AlertTitle>
                  <AlertDescription className="flex flex-wrap items-center gap-2">
                    <span>{apiError}</span>
                    {retryAction && (
                      <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
                        重试
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {!diagnose && (
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={loading} size="lg">
                    {isDiagnosing ? (
                      <>
                        <Loader2 className="animate-spin" />
                        诊断分析中…
                      </>
                    ) : (
                      <>
                        <Sparkles />
                        开始匹配诊断
                      </>
                    )}
                  </Button>
                  {isDiagnosing && (
                    <p className="text-sm text-muted-foreground">
                      首次约 30–90 秒，请勿关闭页面
                    </p>
                  )}
                </div>
              )}

              {diagnose && !showFollowUp && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => {
                    setDiagnose(null);
                    setRefine(null);
                    setInputCollapsed(false);
                    setShowFollowUp(false);
                  }}
                >
                  修改简历后重新诊断
                </Button>
              )}
            </form>

            {diagnose && (
              <DiagnoseSummaryBanner data={diagnose} />
            )}

            {diagnose && showFollowUp && !refine && (
              <div ref={followUpRef}>
                <FollowUpForm
                  diagnose={diagnose}
                  answers={followUpAnswers}
                  onAnswersChange={setFollowUpAnswers}
                  onSubmit={() => runRefine(false)}
                  onSkip={() => runRefine(true)}
                  loading={isRefining}
                />
              </div>
            )}

            {diagnose && (
              <div className="border-t border-border/60 pt-8">
                <h2 className="mb-4 text-sm font-medium text-muted-foreground">
                  {refine ? "完整报告与终稿" : "诊断报告（完成追问后解锁终稿 Tab）"}
                </h2>
                <ResultsTabs
                  diagnose={diagnose}
                  refine={refine}
                  humanResume={humanResume}
                  atsResume={atsResume}
                  onHumanChange={handleHumanChange}
                  onAtsChange={setAtsResume}
                  formData={form.getValues()}
                  followUpAnswers={followUpAnswers}
                  extras={extras}
                  onExtrasUpdate={handleExtrasUpdate}
                  diagnoseOnly={!refine}
                />
              </div>
            )}

            {refine && activeHistoryId && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  终稿已就绪，可加入投递看板或生成在线求职主页
                </p>
                {addedToBoard ? (
                  <ButtonLink variant="outline" size="sm" href="/applications">
                    <Kanban className="size-3.5" />
                    已加入 · 去看板
                  </ButtonLink>
                ) : (
                  <Button type="button" size="sm" onClick={handleAddToBoard}>
                    <Kanban className="size-3.5" />
                    加入投递看板
                  </Button>
                )}
                <ButtonLink
                  variant="outline"
                  size="sm"
                  href={`/online-resume/new?historyId=${activeHistoryId}`}
                >
                  <Globe className="size-3.5" />
                  生成在线主页
                </ButtonLink>
              </div>
            )}

            {diagnose && refine && showFollowUp === false && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFollowUp(true)}
              >
                返回修改追问答案
              </Button>
            )}
          </div>
        </div>
      </main>
      {process.env.NODE_ENV === "development" && (
        <footer className="border-t border-border/60 py-3 text-center text-[10px] text-muted-foreground">
          开发模式 · LLM {process.env.NEXT_PUBLIC_LLM_PROVIDER ?? "mock"} /{" "}
          {process.env.NEXT_PUBLIC_LLM_MODEL ?? "—"}
        </footer>
      )}
    </div>
  );
}

export default function OptimizerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          加载中…
        </div>
      }
    >
      <OptimizerPageContent />
    </Suspense>
  );
}
