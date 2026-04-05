import type { MetadataRoute } from "next";
import config from "@rally";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${config.fullName} — Dashboard`,
    short_name: `${config.shortName} Dashboard`,
    description: `Operational dashboard for ${config.fullName}`,
    start_url: "/",
    display: "standalone",
    background_color: config.theme.background,
    theme_color: config.theme.primary,
    icons: [
      {
        src: "/logo-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
