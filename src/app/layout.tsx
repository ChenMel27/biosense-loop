import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ExitLoop", template: "%s | ExitLoop" },
  description: "A biology exit ticket that helps students revise their thinking and helps teachers find common gaps.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
