import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equipamentos | Suporte TI",
  description: "Empréstimo de equipamentos internos",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
