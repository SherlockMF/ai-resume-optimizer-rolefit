"use client";

import { ONLINE_RESUME_THEMES } from "@/lib/online-resume/themes";
import type { OnlineResumeThemeId } from "@/lib/types/online-resume";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  value: OnlineResumeThemeId;
  onChange: (id: OnlineResumeThemeId) => void;
};

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ONLINE_RESUME_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-left transition-colors",
            value === theme.id
              ? "border-foreground bg-muted/60"
              : "border-border hover:bg-muted/40",
          )}
        >
          <p className="text-sm font-medium">{theme.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {theme.description}
          </p>
        </button>
      ))}
    </div>
  );
}
