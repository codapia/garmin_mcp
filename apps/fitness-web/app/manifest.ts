import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fitness Codapia",
    short_name: "Fitness",
    description: "Rutinas de entrenamiento y seguimiento personal.",
    start_url: "/",
    display: "standalone",
    background_color: "#090d0a",
    theme_color: "#b8ff17",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
