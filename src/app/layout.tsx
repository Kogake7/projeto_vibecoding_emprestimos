import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const openSans = localFont({
  src: [
    { path: "../../public/fonts/open-sans-regular.ttf", weight: "400" },
    { path: "../../public/fonts/open-sans-semibold.ttf", weight: "600" },
  ],
  variable: "--font-open-sans",
  display: "swap",
});

const phosphor = localFont({
  src: "../../public/fonts/phosphor-regular.woff2",
  variable: "--font-phosphor",
  display: "block",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "EmpresTI | Equipamentos internos",
  description: "Empréstimo de equipamentos internos",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${openSans.variable} ${phosphor.variable}`}>
      <body>{children}</body>
    </html>
  );
}
