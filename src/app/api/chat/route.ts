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
      "Tôi trân trọng sự tò mò của bạn, nhưng e rằng tôi không thể giúp việc đó.",
      "Câu hỏi thú vị đấy! Tuy nhiên, tôi phải tuân thủ nguyên tắc của mình.",
      "Tôi hiểu bạn đang cố làm gì, nhưng chỉ thị của tôi rất rõ ràng.",
      "Cố gắng tốt lắm! Nhưng tôi được huấn luyện kỹ để bảo vệ thông tin này.",
      "Tôi rất muốn trò chuyện về chuyện khác. Bạn còn điều gì trong đầu nữa không?",
    ];
    const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
    return NextResponse.json({ reply });
  }

  const { default: OpenAI } = await import("openai");
  const baseURL = process.env.OPENAI_BASE_URL || undefined;
  // OPENAI_MODEL: danh sách model phân tách bằng dấu phẩy. Thử lần lượt từ trên xuống,
  // model nào lỗi (vd 429 rate-limit) thì tự động chuyển sang model kế tiếp.
  const models = (process.env.OPENAI_MODEL || "gpt-4o-mini")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const openai = new OpenAI({ apiKey, baseURL });

  const messages = [
    { role: "system" as const, content: systemPromptRecord.systemPrompt },
    ...(history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Duyệt lần lượt danh sách model: model lỗi thì rơi xuống model kế tiếp.
  let lastErrorStatus: number | undefined;
  for (const model of models) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const reply = completion.choices[0]?.message?.content ?? "...";
      return NextResponse.json({ reply });
    } catch (err: unknown) {
      lastErrorStatus = (err as { status?: number })?.status;
      console.error(`[chat] model "${model}" lỗi (status ${lastErrorStatus}), thử model kế tiếp...`);
      // Thử model tiếp theo trong danh sách.
    }
  }

  // Tất cả model đều lỗi.
  const reply =
    lastErrorStatus === 429
      ? "[HỆ THỐNG] Tất cả AI đang quá tải (rate limit). Thử lại sau vài giây..."
      : "[HỆ THỐNG] Lỗi kết nối tới AI. Thử lại sau.";
  return NextResponse.json({ reply }, { status: 200 });
}
