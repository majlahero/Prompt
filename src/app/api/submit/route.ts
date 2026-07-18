import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkAnswer } from "@/lib/matching";
import { calculateScore } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { levelId, answer, tries, hintsUsed, timeTaken } = body as {
    levelId: string;
    answer: string;
    tries: number;
    hintsUsed: number;
    timeTaken: number;
  };

  if (!levelId || !answer) {
    return NextResponse.json({ error: "Missing levelId or answer" }, { status: 400 });
  }

  const systemPromptRecord = await prisma.systemPrompt.findUnique({
    where: { levelId },
  });

  if (!systemPromptRecord) {
    return NextResponse.json({ error: "Level not found" }, { status: 404 });
  }

  const level = await prisma.level.findUnique({
    where: { id: levelId },
    include: { hints: true },
    // Note: levelType is included by default (not in select)
  });

  if (!level) {
    return NextResponse.json({ error: "Level not found" }, { status: 404 });
  }

  const correct = checkAnswer(answer, systemPromptRecord.secretAnswer);

  // FORBIDDEN_WORD levels: server-side xác nhận qua chat route, client gửi token đặc biệt
  const isForbiddenWin = answer === "__FORBIDDEN_TRIGGERED__" && level.levelType === "FORBIDDEN_WORD";

  if (!correct && !isForbiddenWin) {
    const session = await auth();
    if (session?.user?.id) {
      await prisma.gameSession.updateMany({
        where: { userId: session.user.id, levelId, cleared: false },
        data: { tries },
      });
    }
    return NextResponse.json({ correct: false });
  }

  const points = calculateScore(
    level.basePoints,
    timeTaken,
    tries,
    hintsUsed
  );

  const session = await auth();
  if (session?.user?.id) {
    const userId = session.user.id;

    const existingScore = await prisma.score.findFirst({
      where: { userId, levelId },
      orderBy: { totalPoints: "desc" },
    });

    if (!existingScore || points.totalPoints > existingScore.totalPoints) {
      if (existingScore) {
        await prisma.score.delete({ where: { id: existingScore.id } });
      }
      await prisma.score.create({
        data: {
          userId,
          levelId,
          totalPoints: points.totalPoints,
          basePoints: level.basePoints,
          timeBonus: points.timeBonus,
          triesBonus: points.triesBonus,
          cleanSolveBonus: points.cleanSolveBonus,
          hintPenalty: points.hintPenalty,
          timeTaken,
        },
      });
    }

    // Đảm bảo luôn tồn tại một gameSession đã cleared. Trang chơi có thể chưa kịp
    // tạo session (GET /api/game-session), nên updateMany có thể khớp 0 dòng và làm
    // mất trạng thái mở khoá sau khi reload — vì vậy tạo mới nếu chưa có.
    const existingSession = await prisma.gameSession.findFirst({
      where: { userId, levelId },
      orderBy: { startedAt: "desc" },
    });
    if (existingSession) {
      await prisma.gameSession.update({
        where: { id: existingSession.id },
        data: { cleared: true, completedAt: new Date(), tries, hintsUsed },
      });
    } else {
      await prisma.gameSession.create({
        data: { userId, levelId, cleared: true, completedAt: new Date(), tries, hintsUsed },
      });
    }

    const allScores = await prisma.score.findMany({
      where: { userId },
      orderBy: { totalPoints: "desc" },
    });
    const bestPerLevel = new Map<string, number>();
    for (const s of allScores) {
      const current = bestPerLevel.get(s.levelId);
      if (current === undefined || s.totalPoints > current) {
        bestPerLevel.set(s.levelId, s.totalPoints);
      }
    }
    const totalPoints = Array.from(bestPerLevel.values()).reduce((a, b) => a + b, 0);
    const daysCleared = bestPerLevel.size;

    await prisma.user.update({
      where: { id: userId },
      data: { totalPoints, daysCleared },
    });
  }

  return NextResponse.json({ correct: true, points });
}
