"use client";

import type { DiagnoseResponse } from "@/lib/types/diagnose";

type DimensionScore = DiagnoseResponse["dimensionScores"][number];

interface DimensionRadarChartProps {
  dimensions: DimensionScore[];
  className?: string;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: cx + radius * Math.sin(angleRad),
    y: cy - radius * Math.cos(angleRad),
  };
}

function splitLabel(text: string, maxChars = 5): string[] {
  if (text.length <= maxChars) return [text];
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    lines.push(text.slice(i, i + maxChars));
  }
  return lines.slice(0, 2);
}

function scoreStrokeClass(avg: number): string {
  if (avg >= 75) return "stroke-emerald-600";
  if (avg >= 50) return "stroke-amber-600";
  return "stroke-rose-600";
}

function scoreFillClass(avg: number): string {
  if (avg >= 75) return "fill-emerald-600/15";
  if (avg >= 50) return "fill-amber-600/15";
  return "fill-rose-600/15";
}

export function DimensionRadarChart({
  dimensions,
  className,
}: DimensionRadarChartProps) {
  const n = dimensions.length;
  if (n < 3) return null;

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 96;
  const labelR = maxR + 28;
  const levels = [0.25, 0.5, 0.75, 1];

  const angles = dimensions.map((_, i) => (i / n) * Math.PI * 2);
  const avg =
    dimensions.reduce((sum, d) => sum + d.score, 0) / Math.max(n, 1);

  const gridPolygons = levels.map((level) =>
    angles
      .map((angle) => {
        const { x, y } = polarToCartesian(cx, cy, maxR * level, angle);
        return `${x},${y}`;
      })
      .join(" "),
  );

  const valuePoints = angles.map((angle, i) => {
    const r = (Math.min(100, Math.max(0, dimensions[i].score)) / 100) * maxR;
    return polarToCartesian(cx, cy, r, angle);
  });
  const valuePolygon = valuePoints.map((p) => `${p.x},${p.y}`).join(" ");

  const axisLines = angles.map((angle) => {
    const end = polarToCartesian(cx, cy, maxR, angle);
    return { x2: end.x, y2: end.y };
  });

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto h-auto w-full max-w-[320px]"
        role="img"
        aria-label={`多维度评分雷达图，均分 ${Math.round(avg)}`}
      >
        {gridPolygons.map((points, i) => (
          <polygon
            key={`grid-${i}`}
            points={points}
            className="fill-none stroke-border"
            strokeWidth={i === levels.length - 1 ? 1.25 : 1}
          />
        ))}

        {axisLines.map((line, i) => (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={line.x2}
            y2={line.y2}
            className="stroke-border/80"
            strokeWidth={1}
          />
        ))}

        <polygon
          points={valuePolygon}
          className={`${scoreFillClass(avg)} ${scoreStrokeClass(avg)}`}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {valuePoints.map((point, i) => (
          <circle
            key={`dot-${i}`}
            cx={point.x}
            cy={point.y}
            r={3}
            className={scoreStrokeClass(avg).replace("stroke-", "fill-")}
          />
        ))}

        {dimensions.map((d, i) => {
          const labelPos = polarToCartesian(cx, cy, labelR, angles[i]);
          const lines = splitLabel(d.dimension);
          const anchor =
            Math.abs(Math.sin(angles[i])) < 0.35
              ? "middle"
              : Math.sin(angles[i]) > 0
                ? "start"
                : "end";
          const startDy = -((lines.length - 1) * 6);

          return (
            <text
              key={`label-${d.dimension}`}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor={anchor}
              className="fill-foreground text-[10px] font-medium"
            >
              {lines.map((line, lineIdx) => (
                <tspan
                  key={lineIdx}
                  x={labelPos.x}
                  dy={lineIdx === 0 ? startDy : 12}
                >
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
