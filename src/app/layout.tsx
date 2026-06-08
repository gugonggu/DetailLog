import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Detailog",
  description: "Car wash records, routine recommendations, and community sharing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
