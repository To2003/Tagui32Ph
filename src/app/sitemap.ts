import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/agendar`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/galeria`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/sobre-mi`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
