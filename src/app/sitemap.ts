import type { MetadataRoute } from "next";
import { obtenerBaseUrl } from "@/lib/base-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = obtenerBaseUrl();

  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/agendar`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/galeria`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
