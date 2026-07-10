import Link from "next/link";

interface Level {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  basePoints: number;
  tier: "BASIC" | "ADVANCED";
  levelType: "EXTRACT_SECRET" | "FORBIDDEN_WORD";
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
      levelType: true,
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
 ██████╗██╗  ██╗ ██████╗ ███╗   ██╗    ███╗   ██╗ ██████╗  █████╗ ██╗   ██╗
██╔════╝██║  ██║██╔═══██╗████╗  ██║    ████╗  ██║██╔════╝ ██╔══██╗╚██╗ ██╔╝
██║     ███████║██║   ██║██╔██╗ ██║    ██╔██╗ ██║██║  ███╗███████║ ╚████╔╝
██║     ██╔══██║██║   ██║██║╚██╗██║    ██║╚██╗██║██║   ██║██╔══██║  ╚██╔╝
╚██████╗██║  ██║╚██████╔╝██║ ╚████║    ██║ ╚████║╚██████╔╝██║  ██║   ██║
 ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝
`}
        </pre>
        <p className="text-terminal-dim text-sm tracking-widest uppercase mb-8">
          &gt;_ chọn một ngày để bắt đầu nhiệm vụ
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
                  NGÀY {String(level.dayNumber).padStart(2, "0")}
                </span>
                <div className="flex gap-1">
                  {level.levelType === "FORBIDDEN_WORD" && (
                    <span className="text-[0.6rem] px-2 py-0.5 border border-purple-500 text-purple-500">
                      TỪ CẤM
                    </span>
                  )}
                  <span
                    className={`text-[0.6rem] px-2 py-0.5 border ${
                      level.tier === "ADVANCED"
                        ? "border-red-500 text-red-500"
                        : "border-terminal-dim text-terminal-dim"
                    }`}
                  >
                    {level.tier === "ADVANCED" ? "NÂNG CAO" : "CƠ BẢN"}
                  </span>
                </div>
              </div>

              <h3 className="text-sm uppercase tracking-wide mb-2 group-hover:text-terminal-green transition-colors">
                {level.title}
              </h3>

              <p className="text-terminal-dim text-sm leading-relaxed mb-3">
                {level.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-terminal-amber text-xs">
                  {level.basePoints} ĐIỂM
                </span>
                <span className="text-terminal-dim text-xs group-hover:text-terminal-green transition-colors">
                  [VÀO] &gt;
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center gap-6">
          <Link
            href="/"
            className="text-terminal-dim text-xs hover:text-foreground transition-colors"
          >
            &lt; VỀ TRANG CHỦ
          </Link>
          <Link
            href="/leaderboard"
            className="text-terminal-amber text-xs hover:text-foreground transition-colors"
          >
            BẢNG XẾP HẠNG &gt;
          </Link>
        </div>
      </div>
    </div>
  );
}
