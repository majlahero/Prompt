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

const MEDALS = ["Quán quân", "Á quân", "Hạng ba"];

export default async function LeaderboardPage() {
  const session = await auth();
  const players = await getLeaderboard();

  const currentUserId = session?.user?.id;
  const isInTop50 = currentUserId ? players.some((p) => p.id === currentUserId) : false;

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

  const top3 = players.slice(0, 3);
  // podium visual order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]];

  const nameOf = (p: (typeof players)[0]) => p.displayName ?? p.name ?? "UNKNOWN";

  return (
    <div className="page-fade mx-auto w-[min(1160px,92vw)] pb-8">
      <div className="pt-12">
        <p className="seyebrow">{"// xếp hạng agent"}</p>
        <h1 className="stitle"><span className="tick">&gt;_</span> Bảng xếp hạng</h1>
        <p className="mt-2.5 max-w-[60ch] text-ash-dim">
          Ai phá nhanh nhất, sạch nhất, ít gợi ý nhất sẽ lên đỉnh. Vị trí của bạn được tô sáng.
        </p>
      </div>

      {players.length === 0 && (
        <div className="mt-10 border border-line px-4 py-12 text-center text-sm text-ash-dim">
          &gt;_ Chưa có ai ghi điểm. Hãy là người đầu tiên!
        </div>
      )}

      {/* podium */}
      {top3.length > 0 && (
        <div className="mt-8 grid items-end gap-4 max-[560px]:grid-cols-1 grid-cols-3">
          {podiumOrder.map((p, idx) => {
            if (!p) return <div key={idx} className="max-[560px]:hidden" />;
            const realRank = players.indexOf(p) + 1;
            const first = realRank === 1;
            const me = currentUserId === p.id;
            return (
              <div
                key={p.id}
                className={`relative border p-[22px] text-center max-[560px]:pb-5 ${
                  first ? "border-phosphor-dim pb-[38px] shadow-[0_0_0_1px_rgba(255,176,0,.2)]" : "border-line"
                } ${me ? "shadow-[inset_3px_0_0_var(--color-secret)]" : ""}`}
                style={{ background: "linear-gradient(165deg,var(--color-panel),var(--color-void-2))" }}
              >
                <div className="text-[11px] uppercase tracking-[.16em] text-ash-dim">{MEDALS[realRank - 1]}</div>
                <div className={`font-disp text-[30px] font-bold ${first ? "text-phosphor glow-strong" : "text-phosphor-deep"}`}>{realRank}</div>
                <div className="mb-0.5 mt-1.5 flex items-center justify-center gap-2 font-disp text-base font-semibold text-ash">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="h-5 w-5 border border-line" referrerPolicy="no-referrer" />
                  )}
                  {nameOf(p)}
                </div>
                <div className="text-xs text-secret [text-shadow:0_0_8px_rgba(0,231,211,.4)]">
                  {p.totalPoints.toLocaleString("vi-VN")} điểm
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* table */}
      {players.length > 0 && (
        <div className="mt-7 overflow-x-auto">
          <table className="w-full border-collapse border border-line-2 text-[13px]">
            <thead>
              <tr className="bg-phosphor/[.03]">
                {["#", "Agent", "Điểm", "Days"].map((h, i) => (
                  <th
                    key={h}
                    className={`border-b border-line px-4 py-3.5 text-[11px] uppercase tracking-[.14em] text-ash-dim ${
                      i >= 2 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((player, i) => {
                const rank = i + 1;
                const me = currentUserId === player.id;
                return (
                  <tr
                    key={player.id}
                    className={`transition-colors hover:bg-phosphor/[.04] ${
                      me ? "bg-secret/[.06] shadow-[inset_3px_0_0_var(--color-secret)]" : ""
                    }`}
                  >
                    <td className={`border-b border-line-2 px-4 py-3.5 font-disp font-bold ${me ? "text-secret" : "text-phosphor-dim"}`}>
                      {String(rank).padStart(2, "0")}
                    </td>
                    <td className="border-b border-line-2 px-4 py-3.5">
                      <span className="flex items-center gap-2">
                        {player.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={player.image} alt="" className="h-5 w-5 border border-line" referrerPolicy="no-referrer" />
                        )}
                        <span className={me ? "font-medium text-secret" : "font-medium text-ash"}>{nameOf(player)}</span>
                        {me && <span className="text-[0.6rem] text-secret">[BẠN]</span>}
                      </span>
                    </td>
                    <td className="border-b border-line-2 px-4 py-3.5 text-right font-semibold text-secret [text-shadow:0_0_6px_rgba(0,231,211,.3)]">
                      {player.totalPoints.toLocaleString("vi-VN")}
                    </td>
                    <td className="border-b border-line-2 px-4 py-3.5 text-right text-ash-dim">{player.daysCleared}/20</td>
                  </tr>
                );
              })}

              {currentUserData && currentUserRank && (
                <>
                  <tr>
                    <td colSpan={4} className="px-4 py-1 text-center text-xs text-ash-dim">· · ·</td>
                  </tr>
                  <tr className="bg-secret/[.06] shadow-[inset_3px_0_0_var(--color-secret)]">
                    <td className="border-b border-line-2 px-4 py-3.5 font-disp font-bold text-secret">
                      {String(currentUserRank).padStart(2, "0")}
                    </td>
                    <td className="border-b border-line-2 px-4 py-3.5">
                      <span className="flex items-center gap-2">
                        {currentUserData.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={currentUserData.image} alt="" className="h-5 w-5 border border-line" referrerPolicy="no-referrer" />
                        )}
                        <span className="font-medium text-secret">{nameOf(currentUserData)}</span>
                        <span className="text-[0.6rem] text-secret">[BẠN]</span>
                      </span>
                    </td>
                    <td className="border-b border-line-2 px-4 py-3.5 text-right font-semibold text-secret [text-shadow:0_0_6px_rgba(0,231,211,.3)]">
                      {currentUserData.totalPoints.toLocaleString("vi-VN")}
                    </td>
                    <td className="border-b border-line-2 px-4 py-3.5 text-right text-ash-dim">{currentUserData.daysCleared}/20</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-10 flex justify-center gap-4">
        <Link href="/levels" className="btn btn--dim">&lt; Chọn ngày</Link>
        <Link href="/" className="btn btn--dim">Trang chủ</Link>
      </div>
    </div>
  );
}
