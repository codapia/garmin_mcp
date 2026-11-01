import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitness Codapia",
  description: "Rutinas, alimentación e indicadores de Garmin en una aplicación personal.",
  applicationName: "Fitness Codapia",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Fitness" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090d0a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
