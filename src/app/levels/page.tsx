import Link from "next/link";
import { auth } from "@/auth";

interface Level {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  basePoints: number;
  tier: "BASIC" | "ADVANCED";
  levelType: "EXTRACT_SECRET" | "FORBIDDEN_WORD";
}

async function getLevels(): Promise<(Level & { cleared: boolean })[]> {
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

  const session = await auth();
  let clearedSet = new Set<string>();

  if (session?.user?.id) {
    const clearedSessions = await prisma.gameSession.findMany({
      where: { userId: session.user.id, cleared: true },
      select: { levelId: true },
    });
    clearedSet = new Set(clearedSessions.map((s) => s.levelId));
  }

  return levels.map((level) => ({
    ...level,
    cleared: clearedSet.has(level.id),
  }));
}

export default async function LevelsPage() {
  const levels = await getLevels();

  // Tìm level đầu tiên chưa cleared — đó là level tiếp theo được mở
  // Ngày 1 luôn mở. Ngày N chỉ mở khi ngày N-1 đã cleared.
  // Guest (chưa đăng nhập) → mở hết, không lock.
  const session = await auth();
  const isGuest = !session?.user?.id;
  const firstUncleared = levels.find((l) => !l.cleared);
  const maxUnlockedDay = isGuest ? Infinity : (firstUncleared ? firstUncleared.dayNumber : Infinity);

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
          {levels.map((level) => {
            const isUnlocked = level.dayNumber <= maxUnlockedDay;
            const isCleared = level.cleared;

            if (!isUnlocked) {
              return (
                <div
                  key={level.id}
                  className="border border-terminal-dim/30 p-4 opacity-40 cursor-not-allowed relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-terminal-dim text-xs tracking-widest">
                      NGÀY {String(level.dayNumber).padStart(2, "0")}
                    </span>
                    <span className="text-terminal-dim text-xs">🔒</span>
                  </div>
                  <h3 className="text-sm uppercase tracking-wide mb-2 text-terminal-dim">
                    {level.title}
                  </h3>
                  <p className="text-terminal-dim/50 text-sm leading-relaxed mb-3">
                    Hoàn thành ngày {level.dayNumber - 1} để mở khóa
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-dim/50 text-xs">
                      {level.basePoints} ĐIỂM
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={level.id}
                href={`/day/${level.dayNumber}`}
                className={`group border p-4 transition-colors ${
                  isCleared
                    ? "border-terminal-green/40 hover:border-terminal-green"
                    : "border-terminal-dim hover:border-terminal-green"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-terminal-green text-xs tracking-widest">
                    NGÀY {String(level.dayNumber).padStart(2, "0")}
                  </span>
                  <div className="flex gap-1">
                    {isCleared && (
                      <span className="text-[0.6rem] px-2 py-0.5 border border-terminal-green text-terminal-green">
                        ✓ ĐÃ QUA
                      </span>
                    )}
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
                    {isCleared ? "[CHƠI LẠI]" : "[VÀO]"} &gt;
                  </span>
                </div>
              </Link>
            );
          })}
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
