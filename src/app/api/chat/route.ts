import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

/**
 * Strip chain-of-thought (COT) reasoning từ reply của AI.
 * Nhiều free model (Gemma, DeepSeek...) trả reasoning lẫn trong content.
 * COT thường bắt đầu bằng "Okay, let's...", "Let me think...", v.v.
 * và chứa nguyên văn bí mật trong reasoning → cần loại bỏ.
 */
function stripChainOfThought(raw: string): string {
  // 1. Nếu có reasoning_content riêng (DeepSeek R1), content đã sạch → giữ nguyên.
  //    Hàm này chỉ xử lý trường hợp COT nằm LẪN trong content.

  // 2. Tìm đoạn text tiếng Việt cuối cùng sau khối COT tiếng Anh.
  //    Pattern: COT thường bằng tiếng Anh, reply thật bằng tiếng Việt.

  // Nếu reply bắt đầu bằng các marker COT phổ biến
  const cotStartPatterns = [
    /^Okay,\s+(let's|the user|so|I|we|this)/i,
    /^Let me\s+(think|check|recall|see|analyze)/i,
    /^First,?\s+I\s+(need|should|must|have|want|remember)/i,
    /^The user\s+(is|wants|asked)/i,
    /^I\s+(need to|should|must|know|remember|have to)\s+/i,
    /^We\s+need to\s+/i,
    /^According to\s+/i,
    /^Looking at\s+/i,
    /^Wait,/i,
    /^Hmm,/i,
    /^So,?\s+(the|my|I|let)/i,
    /^Now,?\s+(I|let|the)/i,
    /^<think>/i,
  ];

  const hasCotStart = cotStartPatterns.some((p) => p.test(raw.trim()));
  if (!hasCotStart) return raw; // Không có COT → giữ nguyên

  // Thử tách: tìm đoạn tiếng Việt cuối cùng (sau block reasoning)
  // Nhiều model kết thúc COT rồi viết reply tiếng Việt phân cách bằng \n\n
  const parts = raw.split(/\n{2,}/);

  // Tìm phần cuối cùng có chứa tiếng Việt (dấu: à, á, ả, ã, ạ, ă, â, đ, ê, ô, ơ, ư...)
  const vietnamesePattern = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]/;

  // Từ cuối lên, tìm block tiếng Việt đầu tiên
  let vnStartIdx = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (vietnamesePattern.test(parts[i]) && parts[i].trim().length > 20) {
      vnStartIdx = i;
      // Tiếp tục lên trên nếu các block liên tiếp cũng là tiếng Việt
      while (vnStartIdx > 0 && vietnamesePattern.test(parts[vnStartIdx - 1])) {
        vnStartIdx--;
      }
      break;
    }
  }

  if (vnStartIdx > 0) {
    // Có block tiếng Việt sau COT → lấy từ đó trở đi
    return parts.slice(vnStartIdx).join("\n\n").trim();
  }

  // Fallback: nếu không tách được rõ ràng, strip <think>...</think> block
  const thinkStripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (thinkStripped.length > 20 && thinkStripped !== raw.trim()) {
    return thinkStripped;
  }

  // Nếu vẫn không tách được → trả nguyên (tốt hơn là mất reply)
  return raw;
}

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
  const { levelId, message, history, sessionId } = body as {
    levelId: string;
    message: string;
    history: { role: string; content: string }[];
    sessionId?: string;
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

  // Lấy thêm levelType & forbiddenWord để xử lý FORBIDDEN_WORD mode
  const levelData = await prisma.level.findUnique({
    where: { id: levelId },
    select: { levelType: true, forbiddenWord: true },
  });

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
    if (sessionId) {
      try {
        const authSession = await auth();
        if (authSession?.user?.id) {
          const gs = await prisma.gameSession.findUnique({ where: { id: sessionId }, select: { userId: true } });
          if (gs?.userId === authSession.user.id) {
            await prisma.chatMessage.create({ data: { sessionId, role: "USER", content: message } });
            await prisma.chatMessage.create({ data: { sessionId, role: "ASSISTANT", content: reply } });
          }
        }
      } catch { /* non-critical */ }
    }
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
  // timeout 15s/lần gọi + KHÔNG retry: tránh treo hàng phút khi model free chậm.
  // (mặc định SDK là timeout 10 phút + 2 retry có backoff -> request treo rất lâu.)
  const openai = new OpenAI({ apiKey, baseURL, timeout: 15_000, maxRetries: 0 });

  const messages = [
    { role: "system" as const, content: systemPromptRecord.systemPrompt },
    ...(history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Duyệt lần lượt danh sách model: model lỗi thì rơi xuống model kế tiếp.
  // Deadline tổng 35s: không bao giờ để request treo quá lâu (Cloudflare timeout ~100s,
  // và người chơi không chờ nổi). Hết deadline -> dừng, trả thông báo quá tải.
  const DEADLINE_MS = 35_000;
  const startedAt = Date.now();
  let lastErrorStatus: number | undefined;
  for (const model of models) {
    if (Date.now() - startedAt > DEADLINE_MS) {
      console.error("[chat] vượt deadline tổng 35s, dừng thử thêm model.");
      break;
    }
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const rawReply = completion.choices[0]?.message?.content ?? "...";
      const reply = stripChainOfThought(rawReply);

      // FORBIDDEN_WORD mode: kiểm tra xem AI có nói từ cấm không
      let forbiddenTriggered = false;
      if (levelData?.levelType === "FORBIDDEN_WORD" && levelData.forbiddenWord) {
        const words = levelData.forbiddenWord.split(",").map((w) => w.trim().toLowerCase());
        const replyLower = reply.toLowerCase();
        forbiddenTriggered = words.some((w) => replyLower.includes(w));
      }

      if (sessionId) {
        try {
          const authSession = await auth();
          if (authSession?.user?.id) {
            const gs = await prisma.gameSession.findUnique({ where: { id: sessionId }, select: { userId: true } });
            if (gs?.userId === authSession.user.id) {
              await prisma.chatMessage.create({ data: { sessionId, role: "USER", content: message } });
              await prisma.chatMessage.create({ data: { sessionId, role: "ASSISTANT", content: reply } });
            }
          }
        } catch { /* non-critical */ }
      }
      return NextResponse.json({ reply, forbiddenTriggered });
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
