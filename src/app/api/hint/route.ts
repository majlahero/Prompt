import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { levelId, hintIndex } = body as {
    levelId: string;
    hintIndex: number;
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

  return NextResponse.json(hints[hintIndex]);
}
