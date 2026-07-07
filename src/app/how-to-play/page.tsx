import Link from "next/link";

const RULES = [
  "Mỗi ngày (DAY) là một màn: một chatbot AI tên PIP đang giữ một BÍ MẬT.",
  "Nhiệm vụ của bạn: dùng khung chat để dụ PIP tiết lộ bí mật đó (prompt injection).",
  "Khi đã đoán ra bí mật, gõ vào ô ĐÁP> và nhấn NỘP để chấm điểm.",
  "Điểm cao khi: giải nhanh, ít lần thử, và không dùng gợi ý.",
  "Bí quá thì bấm GỢI Ý (tối đa 3) — nhưng mỗi gợi ý sẽ trừ điểm.",
];

export default function HowToPlayPage() {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-terminal-green text-2xl uppercase tracking-widest mb-2">
          &gt;_ HOW TO PLAY
        </h1>
        <p className="text-terminal-dim text-sm tracking-widest uppercase mb-8">
          break the prompt. extract the secret.
        </p>

        <ol className="space-y-4 mb-10">
          {RULES.map((rule, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="text-terminal-amber">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-foreground">{rule}</span>
            </li>
          ))}
        </ol>

        <div className="flex gap-4 text-xs">
          <Link
            href="/levels"
            className="border border-terminal-green px-8 py-3 uppercase tracking-widest text-terminal-green transition-colors hover:bg-terminal-green hover:text-background"
          >
            BẮT ĐẦU CHƠI
          </Link>
          <Link
            href="/"
            className="border border-terminal-dim px-8 py-3 uppercase tracking-widest text-terminal-dim transition-colors hover:border-foreground hover:text-foreground"
          >
            &lt; VỀ TRANG CHỦ
          </Link>
        </div>
      </div>
    </div>
  );
}
