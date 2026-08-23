import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  OnlineResumeContent,
  OnlineResumePageRecord,
  OnlineResumeSourceType,
  OnlineResumeStatus,
  OnlineResumeThemeId,
} from "@/lib/types/online-resume";
import { onlineResumeContentSchema } from "@/lib/types/online-resume";

type Row = {
  id: string;
  user_id: string;
  slug: string | null;
  title: string;
  theme_id: string;
  status: string;
  content: unknown;
  source_type: string;
  source_history_id: string | null;
  source_version_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToRecord(row: Row): OnlineResumePageRecord | null {
  const parsed = onlineResumeContentSchema.safeParse(row.content);
  if (!parsed.success) return null;
  return {
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    title: row.title,
    themeId: row.theme_id as OnlineResumeThemeId,
    status: row.status as OnlineResumeStatus,
    content: parsed.data,
    sourceType: row.source_type as OnlineResumeSourceType,
    sourceHistoryId: row.source_history_id,
    sourceVersionId: row.source_version_id,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCloudOnlineResumes(
  client: SupabaseClient,
): Promise<OnlineResumePageRecord[]> {
  const { data, error } = await client
    .from("online_resume_pages")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`读取在线简历失败：${error.message}`);
  return (data as Row[])
    .map(rowToRecord)
    .filter((item): item is OnlineResumePageRecord => item !== null);
}

export async function getCloudOnlineResume(
  client: SupabaseClient,
  id: string,
): Promise<OnlineResumePageRecord | null> {
  const { data, error } = await client
    .from("online_resume_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`读取在线简历失败：${error.message}`);
  if (!data) return null;
  return rowToRecord(data as Row);
}

export async function getPublishedOnlineResumeBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<OnlineResumePageRecord | null> {
  const { data, error } = await client
    .from("online_resume_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`读取公开主页失败：${error.message}`);
  if (!data) return null;
  return rowToRecord(data as Row);
}

export async function upsertCloudOnlineResume(
  client: SupabaseClient,
  userId: string,
  record: {
    id?: string;
    slug?: string | null;
    title: string;
    themeId: OnlineResumeThemeId;
    status: OnlineResumeStatus;
    content: OnlineResumeContent;
    sourceType: OnlineResumeSourceType;
    sourceHistoryId?: string | null;
    sourceVersionId?: string | null;
    publishedAt?: string | null;
  },
): Promise<OnlineResumePageRecord> {
  const payload = {
    ...(record.id ? { id: record.id } : {}),
    user_id: userId,
    slug: record.slug ?? null,
    title: record.title,
    theme_id: record.themeId,
    status: record.status,
    content: record.content,
    source_type: record.sourceType,
    source_history_id: record.sourceHistoryId ?? null,
    source_version_id: record.sourceVersionId ?? null,
    published_at: record.publishedAt ?? null,
  };

  const { data, error } = await client
    .from("online_resume_pages")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new Error(`保存在线简历失败：${error.message}`);
  const mapped = rowToRecord(data as Row);
  if (!mapped) throw new Error("保存成功但内容格式无效");
  return mapped;
}

export async function deleteCloudOnlineResume(
  client: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await client.from("online_resume_pages").delete().eq("id", id);
  if (error) throw new Error(`删除在线简历失败：${error.message}`);
}

export async function isSlugTaken(
  client: SupabaseClient,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let query = client
    .from("online_resume_pages")
    .select("id")
    .eq("slug", slug)
    .limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) throw new Error(`检查 slug 失败：${error.message}`);
  return (data?.length ?? 0) > 0;
}
