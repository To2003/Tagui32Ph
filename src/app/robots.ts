import type { MetadataRoute } from "next";
import { obtenerBaseUrl } from "@/lib/base-url";

export default function robots(): MetadataRoute.Robots {
  const base = obtenerBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/galeria/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
