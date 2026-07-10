import Link from "next/link";
import { auth } from "@/auth";

async function getLeaderboard() {
  const { prisma } = await import("@/lib/prisma");
  return prisma.user.findMany({
    where: { totalPoints: { gt: 0 } },
    orderBy: { totalPoints: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      displayName: true,
      image: true,
      totalPoints: true,
      daysCleared: true,
    },
  });
}

async function getUserRank(userId: string, userPoints: number) {
  const { prisma } = await import("@/lib/prisma");
  const above = await prisma.user.count({
    where: { totalPoints: { gt: userPoints } },
  });
  return above + 1;
}

export default async function LeaderboardPage() {
  const session = await auth();
  const players = await getLeaderboard();

  const currentUserId = session?.user?.id;
  const isInTop50 = currentUserId
    ? players.some((p) => p.id === currentUserId)
    : false;

  let currentUserRank: number | null = null;
  let currentUserData: (typeof players)[0] | null = null;

  if (currentUserId && !isInTop50) {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        displayName: true,
        image: true,
        totalPoints: true,
        daysCleared: true,
      },
    });
    if (user && user.totalPoints > 0) {
      currentUserData = user;
      currentUserRank = await getUserRank(user.id, user.totalPoints);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <pre className="text-terminal-green text-xs mb-2 select-none">
{`
██████╗  █████╗ ███╗   ██╗ ██████╗
██╔══██╗██╔══██╗████╗  ██║██╔════╝
██████╔╝███████║██╔██╗ ██║██║  ███╗
██╔══██╗██╔══██║██║╚██╗██║██║   ██║
██║  ██║██║  ██║██║ ╚████║╚██████╔╝
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝
`}
        </pre>
        <p className="text-terminal-dim text-sm tracking-widest uppercase mb-8">
          &gt;_ bảng xếp hạng người chơi
        </p>

        <div className="border border-terminal-dim">
          {/* Header */}
          <div className="flex items-center border-b border-terminal-dim px-4 py-2 text-[0.65rem] uppercase tracking-widest text-terminal-dim">
            <span className="w-12">#</span>
            <span className="flex-1">NGƯỜI CHƠI</span>
            <span className="w-24 text-right">ĐIỂM</span>
            <span className="w-20 text-right">NGÀY</span>
          </div>

          {players.length === 0 && (
            <div className="px-4 py-8 text-center text-terminal-dim text-sm">
              &gt;_ Chưa có ai ghi điểm. Hãy là người đầu tiên!
            </div>
          )}

          {players.map((player, i) => {
            const rank = i + 1;
            const isCurrentUser = currentUserId === player.id;
            return (
              <div
                key={player.id}
                className={`flex items-center border-b border-terminal-dim/30 px-4 py-2 text-sm ${
                  isCurrentUser
                    ? "bg-terminal-green/10 border-l-2 border-l-terminal-green"
                    : ""
                } ${rank <= 3 ? "text-terminal-amber" : ""}`}
              >
                <span className="w-12 text-xs">
                  {rank === 1 ? "01*" : String(rank).padStart(2, "0")}
                </span>
                <span className="flex-1 flex items-center gap-2">
                  {player.image && (
                    <img
                      src={player.image}
                      alt=""
                      className="w-5 h-5"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className={isCurrentUser ? "text-terminal-green" : ""}>
                    {player.displayName ?? player.name ?? "UNKNOWN"}
                  </span>
                  {isCurrentUser && (
                    <span className="text-terminal-green text-[0.6rem]">[BẠN]</span>
                  )}
                </span>
                <span className="w-24 text-right text-terminal-amber">
                  {player.totalPoints}
                </span>
                <span className="w-20 text-right text-terminal-dim">
                  {player.daysCleared}/20
                </span>
              </div>
            );
          })}

          {/* Current user not in top 50 */}
          {currentUserData && currentUserRank && (
            <>
              <div className="px-4 py-1 text-center text-terminal-dim text-xs">
                · · ·
              </div>
              <div className="flex items-center px-4 py-2 text-sm bg-terminal-green/10 border-l-2 border-l-terminal-green">
                <span className="w-12 text-xs">
                  {String(currentUserRank).padStart(2, "0")}
                </span>
                <span className="flex-1 flex items-center gap-2">
                  {currentUserData.image && (
                    <img
                      src={currentUserData.image}
                      alt=""
                      className="w-5 h-5"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="text-terminal-green">
                    {currentUserData.displayName ?? currentUserData.name ?? "UNKNOWN"}
                  </span>
                  <span className="text-terminal-green text-[0.6rem]">[BẠN]</span>
                </span>
                <span className="w-24 text-right text-terminal-amber">
                  {currentUserData.totalPoints}
                </span>
                <span className="w-20 text-right text-terminal-dim">
                  {currentUserData.daysCleared}/20
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-6">
          <Link
            href="/levels"
            className="text-terminal-dim text-xs hover:text-foreground transition-colors"
          >
            &lt; CHỌN NGÀY
          </Link>
          <Link
            href="/"
            className="text-terminal-dim text-xs hover:text-foreground transition-colors"
          >
            &lt; TRANG CHỦ
          </Link>
        </div>
      </div>
    </div>
  );
}
