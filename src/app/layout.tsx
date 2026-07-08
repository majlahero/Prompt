import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import AuthButton from "@/components/AuthButton";
import Link from "next/link";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BreakPrompt",
  description: "Trò chơi CTF tiêm nhiễm prompt",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full`}>
      <body className="min-h-screen bg-background text-foreground font-mono antialiased">
        <Providers>
          <nav className="flex items-center justify-between px-4 py-3 border-b border-terminal-dim/30">
            <Link
              href="/"
              className="text-terminal-green text-xs tracking-widest hover:text-foreground transition-colors"
            >
              BREAKPROMPT
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/leaderboard"
                className="text-terminal-dim text-[0.65rem] uppercase tracking-widest hover:text-terminal-amber transition-colors"
              >
                BẢNG XẾP HẠNG
              </Link>
              <AuthButton />
            </div>
          </nav>
          {children}
        </Providers>
      </body>
    </html>
  );
}
