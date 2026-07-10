import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const levels = await prisma.level.findMany({
    orderBy: { dayNumber: "asc" },
    select: {
      id: true,
      dayNumber: true,
      title: true,
      description: true,
      mission: true,
      answerPlaceholder: true,
      basePoints: true,
      tier: true,
      levelType: true,
    },
  });

  // Nếu user đã đăng nhập, trả thêm danh sách level đã cleared
  const session = await auth();
  let clearedSet = new Set<string>();

  if (session?.user?.id) {
    const clearedSessions = await prisma.gameSession.findMany({
      where: { userId: session.user.id, cleared: true },
      select: { levelId: true },
    });
    clearedSet = new Set(clearedSessions.map((s) => s.levelId));
  }

  const result = levels.map((level) => ({
    ...level,
    cleared: clearedSet.has(level.id),
  }));

  return NextResponse.json(result);
}
