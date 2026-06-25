import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://afectadosporelterremotovenezuela.com";
  const now = new Date();

  const routes = ["", "/buscar", "/registrar-afectado", "/desaparecidos", "/rescatados", "/historias", "/emergencias"];

  return routes.map((route) => {
    let priority = 0.8;
    let changeFreq: "hourly" | "daily" | "weekly" | "monthly" = "hourly";

    if (route === "") {
      priority = 1.0;
      changeFreq = "hourly";
    } else if (route === "/buscar") {
      priority = 0.9;
      changeFreq = "hourly";
    } else if (route === "/registrar-afectado") {
      priority = 0.8;
      changeFreq = "monthly";
    } else if (route === "/historias" || route === "/emergencias") {
      priority = 0.7;
      changeFreq = "daily";
    }

    return {
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: changeFreq,
      priority: priority,
    };
  });
}
