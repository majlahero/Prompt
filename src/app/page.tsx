import Link from "next/link";

const ASCII_BANNER = `
██████╗ ██╗  ██╗ █████╗     ██████╗ ██████╗  ██████╗ ███╗   ███╗██████╗ ████████╗
██╔══██╗██║  ██║██╔══██╗    ██╔══██╗██╔══██╗██╔═══██╗████╗ ████║██╔══██╗╚══██╔══╝
██████╔╝███████║███████║    ██████╔╝██████╔╝██║   ██║██╔████╔██║██████╔╝   ██║
██╔═══╝ ██╔══██║██╔══██║    ██╔═══╝ ██╔══██╗██║   ██║██║╚██╔╝██║██╔═══╝    ██║
██║     ██║  ██║██║  ██║    ██║     ██║  ██║╚██████╔╝██║ ╚═╝ ██║██║        ██║
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝        ╚═╝
`;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <pre className="text-terminal-green text-[0.45rem] leading-tight sm:text-[0.55rem] md:text-xs lg:text-sm select-none">
        {ASCII_BANNER}
      </pre>

      <p className="mt-4 text-terminal-dim text-sm tracking-widest uppercase">
        a prompt injection ctf
      </p>

      <div className="mt-12 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/play"
          className="border border-terminal-green px-8 py-3 text-sm uppercase tracking-widest text-terminal-green transition-colors hover:bg-terminal-green hover:text-background"
        >
          START PLAYING
        </Link>
        <Link
          href="/how-to-play"
          className="border border-terminal-dim px-8 py-3 text-sm uppercase tracking-widest text-terminal-dim transition-colors hover:border-foreground hover:text-foreground"
        >
          HOW TO PLAY
        </Link>
      </div>

      <p className="mt-16 text-terminal-dim text-xs">
        &gt;_ trick the AI. extract the secret. break the prompt.
      </p>
    </div>
  );
}
