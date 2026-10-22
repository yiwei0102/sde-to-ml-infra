import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Frontier Radar · Research with a signal",
  description:
    "Explore a demo of evidence-first AI research, technical insights, and practical experiments.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
