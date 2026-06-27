import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "自動車保険 比較ツール",
  description: "自動車保険プランを簡単に比較できるツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
