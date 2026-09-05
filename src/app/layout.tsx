import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRAXREF | Dikkat ve Bilişsel Beceriler",
  description: "Çocuklar için oyunlaştırılmış dikkat ve bilişsel beceri geliştirme platformu.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
