import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnlineResumeView } from "@/components/online-resume/online-resume-view";
import { getPublishedOnlineResumeBySlug } from "@/lib/online-resume/cloud";
import { createPublicSupabaseClient } from "@/lib/supabase/public";
import type { OnlineResumeThemeId } from "@/lib/types/online-resume";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const privateProfileRobots: Metadata["robots"] = {
  index: false,
  follow: false,
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = createPublicSupabaseClient();
  if (!client) return { title: "求职主页", robots: privateProfileRobots };
  try {
    const page = await getPublishedOnlineResumeBySlug(client, slug);
    if (!page) return { title: "主页未找到", robots: privateProfileRobots };
    return {
      title: `${page.content.profile.displayName} · ${page.content.profile.headline}`,
      description: page.content.positioning.slice(0, 160),
      robots: privateProfileRobots,
    };
  } catch {
    return { title: "求职主页", robots: privateProfileRobots };
  }
}

export default async function PublicOnlineResumePage({ params }: PageProps) {
  const { slug } = await params;
  const client = createPublicSupabaseClient();
  if (!client) notFound();

  let page;
  try {
    page = await getPublishedOnlineResumeBySlug(client, slug);
  } catch {
    notFound();
  }
  if (!page) notFound();

  return (
    <OnlineResumeView
      content={page.content}
      themeId={page.themeId as OnlineResumeThemeId}
      showBrandFooter
    />
  );
}
