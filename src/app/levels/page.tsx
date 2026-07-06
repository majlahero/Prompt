import Link from "next/link";

interface Level {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  basePoints: number;
  tier: "BASIC" | "ADVANCED";
}

async function getLevels(): Promise<Level[]> {
  const { prisma } = await import("@/lib/prisma");
  const levels = await prisma.level.findMany({
    orderBy: { dayNumber: "asc" },
    select: {
      id: true,
      dayNumber: true,
      title: true,
      description: true,
      basePoints: true,
      tier: true,
    },
  });
  return levels;
}

export default async function LevelsPage() {
  const levels = await getLevels();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <pre className="text-terminal-green text-xs mb-2 select-none">
{`
 ██████╗██╗  ██╗ ██████╗  ██████╗ ███████╗███████╗    ██╗   ██╗ ██████╗ ██╗   ██╗██████╗
██╔════╝██║  ██║██╔═══██╗██╔═══██╗██╔════╝██╔════╝    ╚██╗ ██╔╝██╔═══██╗██║   ██║██╔══██╗
██║     ███████║██║   ██║██║   ██║███████╗█████╗       ╚████╔╝ ██║   ██║██║   ██║██████╔╝
██║     ██╔══██║██║   ██║██║   ██║╚════██║██╔══╝        ╚██╔╝  ██║   ██║██║   ██║██╔══██╗
╚██████╗██║  ██║╚██████╔╝╚██████╔╝███████║███████╗       ██║   ╚██████╔╝╚██████╔╝██║  ██║
 ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝       ╚═╝    ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
`}
        </pre>
        <p className="text-terminal-dim text-sm tracking-widest uppercase mb-8">
          &gt;_ select a day to begin your mission
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {levels.map((level) => (
            <Link
              key={level.id}
              href={`/day/${level.dayNumber}`}
              className="group border border-terminal-dim p-4 transition-colors hover:border-terminal-green"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-terminal-green text-xs tracking-widest">
                  DAY {String(level.dayNumber).padStart(2, "0")}
                </span>
                <span
                  className={`text-[0.6rem] px-2 py-0.5 border ${
                    level.tier === "ADVANCED"
                      ? "border-red-500 text-red-500"
                      : "border-terminal-dim text-terminal-dim"
                  }`}
                >
                  {level.tier}
                </span>
              </div>

              <h3 className="text-sm uppercase tracking-wide mb-2 group-hover:text-terminal-green transition-colors">
                {level.title}
              </h3>

              <p className="text-terminal-dim text-xs leading-relaxed mb-3">
                {level.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-terminal-amber text-xs">
                  {level.basePoints} PTS
                </span>
                <span className="text-terminal-dim text-xs group-hover:text-terminal-green transition-colors">
                  [ENTER] &gt;
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-terminal-dim text-xs hover:text-foreground transition-colors"
          >
            &lt; BACK TO MAIN
          </Link>
        </div>
      </div>
    </div>
  );
}
