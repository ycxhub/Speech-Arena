import type { MetadataRoute } from "next";
import { listAllModelPages } from "@/lib/models/get-model-page";
import { getAdminClient } from "@/lib/supabase/admin";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.speecharena.org");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/models`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/models/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/blind-test`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/custom-test`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/my-results`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/listen-and-log`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/auth/sign-in`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${baseUrl}/auth/sign-up`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  ];

  const modelPages = await listAllModelPages();
  const modelRoutes: MetadataRoute.Sitemap = modelPages.map((mp) => ({
    url: `${baseUrl}/models/${mp.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const admin = getAdminClient();
  const { data: comparePages } = await admin.from("compare_pages").select("slug");
  const compareRoutes: MetadataRoute.Sitemap = (comparePages ?? []).map((row) => ({
    url: `${baseUrl}/models/compare/${row.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const alternativesRoutes: MetadataRoute.Sitemap = modelPages.map((mp) => ({
    url: `${baseUrl}/models/alternatives/${mp.slug}-alternatives`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...modelRoutes, ...compareRoutes, ...alternativesRoutes];
}
