import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlideNova",
  description: "Next-gen presentation engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
