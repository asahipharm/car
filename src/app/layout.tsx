import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "くるまくらべメモ",
  description: "自動車保険をわかりやすく比較するメモ。比較結果をPDFやエクセル形式で保存できます。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
