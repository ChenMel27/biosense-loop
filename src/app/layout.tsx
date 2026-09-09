import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ExitLoop", template: "%s · ExitLoop" },
  description: "A teacher-governed, low-stakes biology understanding loop for classroom research.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
