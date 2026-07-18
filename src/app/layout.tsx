import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import AuthButton from "@/components/AuthButton";
import Link from "next/link";
import "./globals.css";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BreakPrompt — thử thách tiêm nhiễm prompt",
  description: "BreakPrompt: trò chơi CTF tiêm nhiễm prompt. Đánh lừa AI, moi bí mật, ghi điểm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${chakra.variable} ${plexMono.variable} h-full`}>
      <body className="min-h-screen font-mono antialiased">
        <div className="crt" aria-hidden="true" />

        <Providers>
          {/* nav */}
          <header className="sticky top-0 z-50 border-b border-line-2 backdrop-blur-md bg-void/85">
            <div className="mx-auto flex h-[62px] w-[min(1160px,92vw)] items-center gap-6">
              <Link
                href="/"
                className="font-disp text-[17px] font-bold tracking-[.12em] flex items-center gap-2.5"
              >
                <span className="text-secret blink">&gt;_</span> BREAK
                <b className="text-phosphor glow-strong">PROMPT</b>
              </Link>
              <nav className="ml-auto flex items-center gap-1 max-sm:hidden">
                <Link href="/how-to-play" className="nav-link">Cách chơi</Link>
                <Link href="/levels" className="nav-link">Days</Link>
                <Link href="/leaderboard" className="nav-link">Bảng xếp hạng</Link>
              </nav>
              <div className="flex items-center gap-4 max-sm:ml-auto">
                <span className="hidden items-center gap-2 border-l border-line-2 pl-5 text-[11px] tracking-[.16em] text-ash-dim lg:flex">
                  <span className="dot-live" /> HỆ THỐNG: TRỰC TUYẾN
                </span>
                <AuthButton />
              </div>
            </div>
          </header>

          <main className="relative z-[1]">{children}</main>

          {/* footer */}
          <footer className="mt-20 border-t border-line-2 py-8">
            <div className="mx-auto flex w-[min(1160px,92vw)] flex-wrap items-center justify-between gap-5 text-xs text-ash-dim">
              <div>
                {"// "}
                <b className="text-phosphor-dim">trochoi.id.vn</b> — BreakPrompt CTF · đánh lừa AI, moi bí mật.
              </div>
              <div className="flex gap-6 text-[11px] uppercase tracking-[.1em]">
                <Link href="/" className="hover:text-phosphor transition-colors">Trang chủ</Link>
                <Link href="/how-to-play" className="hover:text-phosphor transition-colors">Cách chơi</Link>
                <Link href="/levels" className="hover:text-phosphor transition-colors">Days</Link>
                <Link href="/leaderboard" className="hover:text-phosphor transition-colors">Xếp hạng</Link>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
