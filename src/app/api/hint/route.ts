import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { levelId, hintIndex, sessionId } = body as {
    levelId: string;
    hintIndex: number;
    sessionId?: string;
  };

  if (!levelId || hintIndex === undefined) {
    return NextResponse.json({ error: "Missing levelId or hintIndex" }, { status: 400 });
  }

  const hints = await prisma.hint.findMany({
    where: { levelId },
    orderBy: { order: "asc" },
    select: {
      content: true,
      order: true,
      pointPenalty: true,
    },
  });

  if (hintIndex < 0 || hintIndex >= hints.length) {
    return NextResponse.json({ error: "Invalid hint index" }, { status: 400 });
  }

  if (sessionId) {
    try {
      const session = await auth();
      if (session?.user?.id) {
        const gameSession = await prisma.gameSession.findUnique({
          where: { id: sessionId },
          select: { userId: true },
        });
        if (gameSession?.userId === session.user.id) {
          await prisma.gameSession.update({
            where: { id: sessionId },
            data: { hintsUsed: { increment: 1 } },
          });
        }
      }
    } catch { /* non-critical */ }
  }

  return NextResponse.json(hints[hintIndex]);
}
