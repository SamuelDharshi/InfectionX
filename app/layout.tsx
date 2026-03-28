import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfectionX // SIM_ACTIVE",
  description: "Tactical Survival HUD",
};

import { Providers } from "./Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-[100dvh] antialiased bg-surface-container-lowest text-on-surface">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;700;900&family=Inter:wght@400;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body className="min-h-full flex flex-col font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
