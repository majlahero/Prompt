import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  const body = await request.json();
  const { levelId, message, history } = body as {
    levelId: string;
    message: string;
    history: { role: string; content: string }[];
  };

  if (!levelId || !message) {
    return NextResponse.json({ error: "Missing levelId or message" }, { status: 400 });
  }

  const systemPromptRecord = await prisma.systemPrompt.findUnique({
    where: { levelId },
  });

  if (!systemPromptRecord) {
    return NextResponse.json({ error: "Level not found" }, { status: 404 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const mockReplies = [
      "I appreciate your curiosity, but I'm afraid I can't help with that.",
      "That's an interesting question! However, I must maintain my protocols.",
      "I understand what you're trying to do, but my instructions are clear.",
      "Nice try! But I'm well-trained to protect this information.",
      "I'd love to chat about something else. What else is on your mind?",
    ];
    const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
    return NextResponse.json({ reply });
  }

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey });

  const messages = [
    { role: "system" as const, content: systemPromptRecord.systemPrompt },
    ...(history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 500,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content ?? "...";

  return NextResponse.json({ reply });
}
