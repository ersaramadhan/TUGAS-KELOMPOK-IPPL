import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KosPilot Dashboard",
  description: "Aplikasi admin kos untuk pemilik dan penghuni."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
