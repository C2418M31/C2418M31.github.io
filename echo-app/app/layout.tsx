import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Was previously just declared in CSS/Tailwind config with no actual font
// file ever loaded, so it silently fell back to the system font. This is
// what actually loads Inter.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Network Intelligence Hub",
  description: "AI-powered network coverage dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-zinc-950 font-sans text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
