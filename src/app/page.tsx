import Link from "next/link";

const ASCII_BANNER = `
██████╗ ██████╗ ███████╗ █████╗ ██╗  ██╗
██╔══██╗██╔══██╗██╔════╝██╔══██╗██║ ██╔╝
██████╔╝██████╔╝█████╗  ███████║█████╔╝
██╔══██╗██╔══██╗██╔══╝  ██╔══██║██╔═██╗
██████╔╝██║  ██║███████╗██║  ██║██║  ██╗
╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
██████╗ ██████╗  ██████╗ ███╗   ███╗██████╗ ████████╗
██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔══██╗╚══██╔══╝
██████╔╝██████╔╝██║   ██║██╔████╔██║██████╔╝   ██║
██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔═══╝    ██║
██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║██║        ██║
╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝
`;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <pre className="text-terminal-green text-[0.45rem] leading-tight sm:text-[0.55rem] md:text-xs lg:text-sm select-none">
        {ASCII_BANNER}
      </pre>

      <p className="mt-4 text-terminal-dim text-sm tracking-widest uppercase">
        thử thách tiêm nhiễm prompt (ctf)
      </p>

      <div className="mt-12 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/levels"
          className="border border-terminal-green px-8 py-3 text-sm uppercase tracking-widest text-terminal-green transition-colors hover:bg-terminal-green hover:text-background"
        >
          BẮT ĐẦU CHƠI
        </Link>
        <Link
          href="/how-to-play"
          className="border border-terminal-dim px-8 py-3 text-sm uppercase tracking-widest text-terminal-dim transition-colors hover:border-foreground hover:text-foreground"
        >
          CÁCH CHƠI
        </Link>
        <Link
          href="/leaderboard"
          className="border border-terminal-amber px-8 py-3 text-sm uppercase tracking-widest text-terminal-amber transition-colors hover:bg-terminal-amber hover:text-background"
        >
          BẢNG XẾP HẠNG
        </Link>
      </div>

      <p className="mt-16 text-terminal-dim text-xs">
        &gt;_ đánh lừa ai. moi bí mật. phá vỡ prompt.
      </p>
    </div>
  );
}
