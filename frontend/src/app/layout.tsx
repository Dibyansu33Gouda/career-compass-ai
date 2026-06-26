import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerCompass AI — From skills to action plan in 60 seconds",
  description:
    "Paste your resume, pick a target role, and get a personalized 30/60/90-day career roadmap with weekly tasks and free resources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
