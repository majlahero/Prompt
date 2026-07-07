import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const levels = await prisma.level.findMany({
    orderBy: { dayNumber: "asc" },
    select: {
      id: true,
      dayNumber: true,
      title: true,
      description: true,
      mission: true,
      basePoints: true,
      tier: true,
    },
  });

  return NextResponse.json(levels);
}
