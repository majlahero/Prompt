import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const levelId = request.nextUrl.searchParams.get("levelId");
  if (!levelId) {
    return NextResponse.json({ error: "Missing levelId" }, { status: 400 });
  }

  let gameSession = await prisma.gameSession.findFirst({
    where: { userId: session.user.id, levelId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { startedAt: "desc" },
  });

  if (!gameSession) {
    const levelExists = await prisma.level.findUnique({
      where: { id: levelId },
      select: { id: true },
    });
    if (!levelExists) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    gameSession = await prisma.gameSession.create({
      data: {
        userId: session.user.id,
        levelId,
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  const revealedHints = gameSession.hintsUsed > 0
    ? await prisma.hint.findMany({
        where: { levelId },
        orderBy: { order: "asc" },
        take: gameSession.hintsUsed,
        select: { content: true, order: true, pointPenalty: true },
      })
    : [];

  let score = null;
  if (gameSession.cleared) {
    const scoreRecord = await prisma.score.findFirst({
      where: { userId: session.user.id, levelId },
      orderBy: { createdAt: "desc" },
    });
    if (scoreRecord) {
      score = {
        totalPoints: scoreRecord.totalPoints,
        timeBonus: scoreRecord.timeBonus,
        triesBonus: scoreRecord.triesBonus,
        cleanSolveBonus: scoreRecord.cleanSolveBonus,
        hintPenalty: scoreRecord.hintPenalty,
      };
    }
  }

  return NextResponse.json({
    id: gameSession.id,
    tries: gameSession.tries,
    hintsUsed: gameSession.hintsUsed,
    startedAt: gameSession.startedAt.toISOString(),
    cleared: gameSession.cleared,
    messages: gameSession.messages.map((m) => ({
      role: m.role.toLowerCase(),
      content: m.content,
    })),
    hints: revealedHints,
    score,
  });
}
