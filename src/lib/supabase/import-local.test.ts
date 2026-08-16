import { describe, expect, it } from "vitest";

const userId = "f0c1f8bd-832a-487d-9d2f-f01311826ed9";
const historyId = "ed3a2f37-9747-4890-9cd2-c2934ed86979";
const versionId = "c1eea6c7-389b-4950-8f97-2ed42a51ebfa";
const applicationId = "4d4b8b7c-59d1-4a1d-b12d-c785f55574f3";
const orphanApplicationId = "df6f5ceb-d0cb-4359-a54a-b8d3a566c012";

describe("buildCloudImportPayload", () => {
  it("preserves local relationships and creates targets for orphan applications", async () => {
    const modulePath = "./import-local";
    const syncModule = (await import(modulePath)) as {
      buildCloudImportPayload: (input: unknown) => {
        profile: { id: string; default_current_role: string | null };
        resumes: { id: string }[];
        jobTargets: { id: string; target_role: string }[];
        optimizationRuns: {
          id: string;
          resume_id: string;
          job_target_id: string;
          status: string;
        }[];
        resumeVersions: { id: string; optimization_run_id: string }[];
        applications: {
          id: string;
          job_target_id: string;
          resume_version_id: string | null;
        }[];
        applicationEvents: { id: string; job_application_id: string }[];
      };
    };

    const payload = syncModule.buildCloudImportPayload({
      userId,
      bundle: {
        version: 1,
        exportedAt: "2026-08-16T00:00:00.000Z",
        history: [
          {
            id: historyId,
            createdAt: "2026-08-15T00:00:00.000Z",
            title: "RoleFit",
            pinned: false,
            meta: {
              currentRole: "城市规划师",
              targetRole: "AI产品经理",
              targetCompany: "RoleFit",
              targetIndustry: "AI",
            },
            inputs: {
              resumePreview: "简历",
              jdPreview: "职位描述",
              fullResume: "完整简历",
              fullJd: "完整 JD",
            },
            diagnose: { overallScore: 82 },
            refine: {
              optimizedResumeHuman: "人工阅读版",
              optimizedResumeAts: "ATS 版",
            },
            optimizedResume: "人工阅读版",
            matchScore: 82,
            extras: { portfolio: { markdown: "作品集" } },
          },
        ],
        versions: [
          {
            id: versionId,
            historyId,
            label: "RoleFit · AI产品经理",
            targetRole: "AI产品经理",
            targetCompany: "RoleFit",
            targetIndustry: "AI",
            matchScore: 82,
            humanResume: "人工阅读版",
            atsResume: "ATS 版",
            summary: "摘要",
            keywordsMatched: ["产品"],
            keywordsMissing: ["SQL"],
            applicationReason: "匹配",
            createdAt: "2026-08-15T00:00:00.000Z",
            isPinned: false,
          },
        ],
        applications: [
          {
            id: applicationId,
            company: "RoleFit",
            role: "AI产品经理",
            status: "applied",
            historyId,
            versionId,
            matchScore: 82,
            appliedAt: "2026-08-15",
            notes: "已投递",
            createdAt: "2026-08-15T00:00:00.000Z",
            updatedAt: "2026-08-15T00:00:00.000Z",
          },
          {
            id: orphanApplicationId,
            company: "另一家公司",
            role: "产品经理",
            status: "wishlist",
            notes: "手动创建",
            createdAt: "2026-08-15T00:00:00.000Z",
            updatedAt: "2026-08-15T00:00:00.000Z",
          },
        ],
      },
    });

    expect(payload.profile).toMatchObject({
      id: userId,
      default_current_role: "城市规划师",
    });
    expect(payload.resumes).toHaveLength(1);
    expect(payload.resumes[0].id).toBe(historyId);
    expect(payload.optimizationRuns[0]).toMatchObject({
      id: historyId,
      resume_id: historyId,
      job_target_id: historyId,
      status: "refined",
    });
    expect(payload.resumeVersions[0]).toMatchObject({
      id: versionId,
      optimization_run_id: historyId,
    });
    expect(payload.applications[0]).toMatchObject({
      id: applicationId,
      job_target_id: historyId,
      resume_version_id: versionId,
    });
    expect(payload.applications[1]).toMatchObject({
      id: orphanApplicationId,
      job_target_id: orphanApplicationId,
      resume_version_id: null,
    });
    expect(payload.jobTargets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: orphanApplicationId, target_role: "产品经理" }),
      ]),
    );
    expect(payload.applicationEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: applicationId,
          job_application_id: applicationId,
        }),
      ]),
    );
  });
});

describe("buildBackupFromCloudRows", () => {
  it("restores a local backup bundle from cloud rows", async () => {
    const modulePath = "./import-local";
    const syncModule = (await import(modulePath)) as {
      buildBackupFromCloudRows: (input: unknown) => {
        history: { id: string; pinned: boolean; inputs: { fullResume?: string } }[];
        versions: { id: string; historyId: string }[];
        applications: { id: string; company: string; historyId?: string }[];
      };
    };

    const restored = syncModule.buildBackupFromCloudRows({
      profile: {},
      runs: [
        {
          id: historyId,
          title: "RoleFit",
          is_pinned: true,
          created_at: "2026-08-15T00:00:00.000Z",
          input_snapshot: {
            originalResumeText: "完整简历",
            targetJobDescription: "完整 JD",
            currentRole: "城市规划师",
            targetRole: "AI产品经理",
          },
          diagnosis_result: { overallScore: 82 },
          refine_result: {
            optimizedResumeHuman: "人工阅读版",
            optimizedResumeAts: "ATS 版",
          },
          extras: {},
        },
      ],
      versions: [
        {
          id: versionId,
          optimization_run_id: historyId,
          label: "RoleFit · AI产品经理",
          target_role: "AI产品经理",
          match_score: 82,
          human_resume: "人工阅读版",
          ats_resume: "ATS 版",
          summary: "摘要",
          keywords_matched: ["产品"],
          keywords_missing: ["SQL"],
          created_at: "2026-08-15T00:00:00.000Z",
          is_pinned: false,
        },
      ],
      jobTargets: [
        {
          id: historyId,
          target_role: "AI产品经理",
          target_company: "RoleFit",
          target_industry: "AI",
        },
      ],
      applications: [
        {
          id: applicationId,
          job_target_id: historyId,
          resume_version_id: versionId,
          status: "applied",
          applied_at: "2026-08-15",
          notes: "已投递",
          created_at: "2026-08-15T00:00:00.000Z",
          updated_at: "2026-08-15T00:00:00.000Z",
        },
      ],
    });

    expect(restored.history[0]).toMatchObject({
      id: historyId,
      pinned: true,
      inputs: { fullResume: "完整简历" },
    });
    expect(restored.versions[0]).toMatchObject({
      id: versionId,
      historyId,
    });
    expect(restored.applications[0]).toMatchObject({
      id: applicationId,
      company: "RoleFit",
      historyId,
    });
  });
});
