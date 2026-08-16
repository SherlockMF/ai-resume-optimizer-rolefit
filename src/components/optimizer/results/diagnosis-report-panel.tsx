"use client";

import type { DiagnoseResponse } from "@/lib/types/diagnose";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { DimensionRadarChart } from "./dimension-radar-chart";

interface DiagnosisReportPanelProps {
  data: DiagnoseResponse;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 75
      ? "text-emerald-600"
      : score >= 50
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/30 px-8 py-6">
      <span className={`text-5xl font-semibold tabular-nums ${color}`}>
        {score}
      </span>
      <span className="mt-1 text-xs text-muted-foreground">综合评分 / 100</span>
    </div>
  );
}

function BulletList({
  title,
  items,
  variant = "default",
}: {
  title: string;
  items: string[];
  variant?: "default" | "risk";
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2 text-sm text-muted-foreground leading-relaxed"
          >
            <span
              className={
                variant === "risk"
                  ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500"
                  : "mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/30"
              }
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const worthLabel = {
  high: "建议投递",
  medium: "谨慎投递",
  low: "不建议主投",
} as const;

export function DiagnosisReportPanel({ data }: DiagnosisReportPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <ScoreRing score={data.overallScore} />
        <div>
          <h4 className="mb-2 text-sm font-medium">匹配度总结</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {data.matchSummary}
          </p>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="mb-4 text-sm font-medium">多维度评分</h4>
        <DimensionRadarChart
          dimensions={data.dimensionScores}
          className="mb-6 rounded-xl border border-border/80 bg-muted/20 px-2 py-4"
        />
        <div className="space-y-4">
          {data.dimensionScores.map((d) => (
            <div key={d.dimension} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{d.dimension}</span>
                <span className="tabular-nums font-medium">{d.score}</span>
              </div>
              <Progress value={d.score} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{d.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BulletList title="主要优势" items={data.strengths} />
        <BulletList title="主要问题" items={data.issues} />
      </div>

      {data.lowValuePatterns.length > 0 && (
        <Card className="border-border/80 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">低价值表达模式</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {data.lowValuePatterns.map((p, i) => (
                <li key={i}>· {p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <BulletList
        title="转行风险点"
        items={data.careerChangeRisks}
        variant="risk"
      />

      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <h4 className="mb-2 text-sm font-medium">HR 模拟评价</h4>
        <p className="text-sm leading-relaxed text-muted-foreground italic">
          「{data.hrEvaluation}」
        </p>
      </div>

      <Card className="border-border/80 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">投递策略</CardTitle>
          <CardDescription>
            {worthLabel[data.applicationStrategy.worthApplying]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {data.applicationStrategy.reason}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
