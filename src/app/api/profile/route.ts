import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, displayName: true, image: true, totalPoints: true, daysCleared: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { displayName } = body as { displayName?: string };

  if (typeof displayName !== "string") {
    return NextResponse.json({ error: "Missing displayName" }, { status: 400 });
  }

  const trimmed = displayName.trim().slice(0, 20);
  if (trimmed.length < 1) {
    return NextResponse.json({ error: "Name too short" }, { status: 400 });
  }

  // Basic profanity / injection guard
  if (/[<>{}]/.test(trimmed)) {
    return NextResponse.json({ error: "Invalid characters" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: trimmed },
    select: { displayName: true },
  });

  return NextResponse.json(user);
}
