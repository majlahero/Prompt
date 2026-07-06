import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
  });

  if (!level) {
    return NextResponse.json({ error: "Level not found" }, { status: 404 });
  }

  const correct = checkAnswer(answer, systemPromptRecord.secretAnswer);

  if (!correct) {
    return NextResponse.json({ correct: false });
  }

  const points = calculateScore(
    level.basePoints,
    timeTaken,
    tries,
    hintsUsed,
    level.hints.length
  );

  return NextResponse.json({ correct: true, points });
}
