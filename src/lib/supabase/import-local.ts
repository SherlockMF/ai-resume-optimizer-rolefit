import type { SupabaseClient } from "@supabase/supabase-js";
import type { BackupBundle } from "@/lib/storage/backup";
import type { HistoryRecord } from "@/lib/storage/history";
import type { ResumeVersion } from "@/lib/storage/versions";

type JsonRecord = Record<string, unknown>;

type CloudImportPayload = {
  profile: {
    id: string;
    default_current_role: string | null;
    default_target_role: string | null;
    preferences: JsonRecord;
  };
  resumes: JsonRecord[];
  jobTargets: JsonRecord[];
  optimizationRuns: JsonRecord[];
  resumeVersions: JsonRecord[];
  applications: JsonRecord[];
  applicationEvents: JsonRecord[];
};

function historyTitle(record: HistoryRecord): string {
  return record.title || record.meta.targetRole || "未命名简历";
}

function historyJobTarget(record: HistoryRecord, userId: string): JsonRecord {
  return {
    id: record.id,
    user_id: userId,
    target_role: record.meta.targetRole,
    target_company: record.meta.targetCompany ?? null,
    target_industry: record.meta.targetIndustry ?? null,
    job_description: record.inputs.fullJd ?? record.inputs.jdPreview,
    created_at: record.createdAt,
  };
}

function historyResume(record: HistoryRecord, userId: string): JsonRecord {
  return {
    id: record.id,
    user_id: userId,
    title: historyTitle(record),
    source_text: record.inputs.fullResume ?? record.inputs.resumePreview,
    created_at: record.createdAt,
  };
}

function historyRun(record: HistoryRecord, userId: string): JsonRecord {
  return {
    id: record.id,
    user_id: userId,
    resume_id: record.id,
    job_target_id: record.id,
    title: historyTitle(record),
    status: record.refine ? "refined" : "diagnosed",
    input_snapshot: {
      originalResumeText: record.inputs.fullResume ?? record.inputs.resumePreview,
      targetJobDescription: record.inputs.fullJd ?? record.inputs.jdPreview,
      ...record.meta,
      language: "zh-CN",
    },
    diagnosis_result: record.diagnose,
    refine_result: record.refine ?? null,
    follow_up_answers: {},
    extras: record.extras ?? {},
    is_pinned: record.pinned,
    created_at: record.createdAt,
  };
}

function versionRow(version: ResumeVersion, userId: string): JsonRecord {
  return {
    id: version.id,
    user_id: userId,
    optimization_run_id: version.historyId,
    label: version.label,
    human_resume: version.humanResume,
    ats_resume: version.atsResume,
    summary: version.summary,
    match_score: version.matchScore ?? null,
    keywords_matched: version.keywordsMatched ?? [],
    keywords_missing: version.keywordsMissing ?? [],
    application_reason: version.applicationReason ?? null,
    is_pinned: version.isPinned,
    created_at: version.createdAt,
  };
}

function fallbackVersionRow(record: HistoryRecord, userId: string): JsonRecord | null {
  if (!record.refine) return null;

  return {
    id: record.id,
    user_id: userId,
    optimization_run_id: record.id,
    label: historyTitle(record),
    human_resume: record.optimizedResume ?? record.refine.optimizedResumeHuman,
    ats_resume: record.refine.optimizedResumeAts,
    summary: (record.optimizedResume ?? record.refine.optimizedResumeHuman).slice(0, 300),
    match_score: record.matchScore ?? record.diagnose.jdMatch?.overall ?? null,
    keywords_matched: record.diagnose.keywords?.matched ?? [],
    keywords_missing: record.diagnose.keywords?.missing ?? [],
    application_reason: record.diagnose.applicationStrategy?.reason ?? null,
    is_pinned: false,
    created_at: record.createdAt,
  };
}

export function buildCloudImportPayload(input: {
  userId: string;
  bundle: BackupBundle;
}): CloudImportPayload {
  const { userId, bundle } = input;
  const historyById = new Map(bundle.history.map((record) => [record.id, record]));
  const latest = bundle.history[0];
  const importedVersionIds = new Set(bundle.versions.map((version) => version.id));
  const versionByHistoryId = new Map(
    bundle.versions.map((version) => [version.historyId, version.id]),
  );
  const jobTargets = bundle.history.map((record) => historyJobTarget(record, userId));

  for (const application of bundle.applications) {
    if (application.historyId && historyById.has(application.historyId)) continue;
    jobTargets.push({
      id: application.id,
      user_id: userId,
      target_role: application.role,
      target_company: application.company,
      target_industry: null,
      job_description: `从本地投递记录导入：${application.company} · ${application.role}`,
      created_at: application.createdAt,
    });
  }

  const fallbackVersions = bundle.history
    .filter((record) => record.refine && !versionByHistoryId.has(record.id))
    .map((record) => fallbackVersionRow(record, userId))
    .filter((row): row is JsonRecord => row !== null);

  const importedAndFallbackVersionIds = new Set([
    ...importedVersionIds,
    ...fallbackVersions.map((version) => String(version.id)),
  ]);

  return {
    profile: {
      id: userId,
      default_current_role: latest?.meta.currentRole ?? null,
      default_target_role: latest?.meta.targetRole ?? null,
      preferences: { language: "zh-CN" },
    },
    resumes: bundle.history.map((record) => historyResume(record, userId)),
    jobTargets,
    optimizationRuns: bundle.history.map((record) => historyRun(record, userId)),
    resumeVersions: [
      ...bundle.versions
        .filter((version) => historyById.has(version.historyId))
        .map((version) => versionRow(version, userId)),
      ...fallbackVersions,
    ],
    applications: bundle.applications.map((application) => {
      const hasHistory = Boolean(
        application.historyId && historyById.has(application.historyId),
      );
      const versionId =
        application.versionId && importedAndFallbackVersionIds.has(application.versionId)
          ? application.versionId
          : application.historyId && importedAndFallbackVersionIds.has(application.historyId)
            ? application.historyId
            : null;

      return {
        id: application.id,
        user_id: userId,
        job_target_id: hasHistory ? application.historyId : application.id,
        resume_version_id: versionId,
        status: application.status,
        applied_at: application.appliedAt ?? null,
        notes: application.notes ?? null,
        created_at: application.createdAt,
        updated_at: application.updatedAt,
      };
    }),
    applicationEvents: bundle.applications.map((application) => ({
      id: application.id,
      user_id: userId,
      job_application_id: application.id,
      event_type: "created",
      next_status: application.status,
      occurred_at: application.createdAt,
      details: {
        imported_from: "localStorage",
        notes: application.notes ?? null,
      },
    })),
  };
}

async function upsert(
  client: SupabaseClient,
  table: string,
  rows: JsonRecord | JsonRecord[],
): Promise<void> {
  const { error } = await client.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`同步 ${table} 失败：${error.message}`);
}

export async function importLocalData(
  client: SupabaseClient,
  input: { userId: string; bundle: BackupBundle },
): Promise<{
  history: number;
  versions: number;
  applications: number;
}> {
  const payload = buildCloudImportPayload(input);

  await upsert(client, "profiles", payload.profile);
  if (payload.resumes.length) await upsert(client, "resumes", payload.resumes);
  if (payload.jobTargets.length) await upsert(client, "job_targets", payload.jobTargets);
  if (payload.optimizationRuns.length) {
    await upsert(client, "optimization_runs", payload.optimizationRuns);
  }
  if (payload.resumeVersions.length) {
    await upsert(client, "resume_versions", payload.resumeVersions);
  }
  if (payload.applications.length) {
    await upsert(client, "job_applications", payload.applications);
  }
  if (payload.applicationEvents.length) {
    await upsert(client, "application_events", payload.applicationEvents);
  }

  return {
    history: input.bundle.history.length,
    versions: payload.resumeVersions.length,
    applications: input.bundle.applications.length,
  };
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

type CloudRows = {
  profile?: JsonRecord;
  runs: JsonRecord[];
  versions: JsonRecord[];
  jobTargets: JsonRecord[];
  applications: JsonRecord[];
};

export function buildBackupFromCloudRows(rows: CloudRows): BackupBundle {
  const targetsById = new Map(rows.jobTargets.map((target) => [String(target.id), target]));
  const versionsById = new Map(rows.versions.map((version) => [String(version.id), version]));
  const runIds = new Set(rows.runs.map((run) => String(run.id)));

  const history = rows.runs.map((run) => {
    const snapshot = asRecord(run.input_snapshot);
    const target = targetsById.get(String(run.job_target_id));
    const diagnosis = asRecord(run.diagnosis_result);
    const refineValue = run.refine_result;
    const refine = refineValue ? asRecord(refineValue) : undefined;
    const optimizedResume =
      asString(run.optimized_resume) ||
      asString(refine?.optimizedResumeHuman);

    return {
      id: asString(run.id),
      createdAt: asString(run.created_at, new Date().toISOString()),
      title: asString(run.title, asString(target?.target_role, "未命名记录")),
      pinned: run.is_pinned === true,
      meta: {
        currentRole: asString(snapshot.currentRole) || undefined,
        targetRole:
          asString(snapshot.targetRole) ||
          asString(target?.target_role, "目标岗位"),
        targetCompany:
          asString(snapshot.targetCompany) || asString(target?.target_company) || undefined,
        targetIndustry:
          asString(snapshot.targetIndustry) || asString(target?.target_industry) || undefined,
      },
      inputs: {
        resumePreview: asString(snapshot.originalResumeText),
        jdPreview: asString(snapshot.targetJobDescription),
        fullResume: asString(snapshot.originalResumeText) || undefined,
        fullJd: asString(snapshot.targetJobDescription) || undefined,
      },
      diagnose: diagnosis,
      refine,
      optimizedResume: optimizedResume || undefined,
      matchScore:
        asOptionalNumber(asRecord(diagnosis.jdMatch).overall) ??
        asOptionalNumber(diagnosis.overallScore),
      extras: asRecord(run.extras),
    } as unknown as HistoryRecord;
  });

  const versions = rows.versions.map(
    (version) =>
      ({
        id: asString(version.id),
        historyId: asString(version.optimization_run_id),
        label: asString(version.label, "简历版本"),
        targetRole: asString(version.target_role, "目标岗位"),
        targetCompany: undefined,
        targetIndustry: undefined,
        matchScore: asOptionalNumber(version.match_score),
        humanResume: asString(version.human_resume),
        atsResume: asString(version.ats_resume),
        summary: asString(version.summary),
        keywordsMatched: asStringArray(version.keywords_matched),
        keywordsMissing: asStringArray(version.keywords_missing),
        applicationReason: asString(version.application_reason) || undefined,
        createdAt: asString(version.created_at, new Date().toISOString()),
        isPinned: version.is_pinned === true,
      }) as ResumeVersion,
  );

  const applications = rows.applications.map((application) => {
    const targetId = asString(application.job_target_id);
    const target = targetsById.get(targetId);
    const versionId = asString(application.resume_version_id) || undefined;
    const version = versionId ? versionsById.get(versionId) : undefined;

    return {
      id: asString(application.id),
      company: asString(target?.target_company, "未填写公司"),
      role: asString(target?.target_role, "目标岗位"),
      status: asString(application.status, "wishlist") as
        | "wishlist"
        | "applied"
        | "interview"
        | "offer"
        | "rejected",
      historyId: runIds.has(targetId) ? targetId : undefined,
      versionId,
      matchScore: asOptionalNumber(version?.match_score),
      appliedAt: asString(application.applied_at) || undefined,
      notes: asString(application.notes) || undefined,
      createdAt: asString(application.created_at, new Date().toISOString()),
      updatedAt: asString(application.updated_at, new Date().toISOString()),
    };
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    history,
    versions,
    applications,
  };
}

async function selectRows(client: SupabaseClient, table: string): Promise<JsonRecord[]> {
  const { data, error } = await client.from(table).select("*");
  if (error) throw new Error(`读取 ${table} 失败：${error.message}`);
  return (data ?? []) as JsonRecord[];
}

export async function loadCloudBackup(client: SupabaseClient): Promise<BackupBundle> {
  const [profiles, runs, versions, jobTargets, applications] = await Promise.all([
    selectRows(client, "profiles"),
    selectRows(client, "optimization_runs"),
    selectRows(client, "resume_versions"),
    selectRows(client, "job_targets"),
    selectRows(client, "job_applications"),
  ]);

  return buildBackupFromCloudRows({
    profile: profiles[0],
    runs,
    versions,
    jobTargets,
    applications,
  });
}
