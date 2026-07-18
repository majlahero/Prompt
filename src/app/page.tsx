import Link from "next/link";
import TerminalDemo from "@/components/TerminalDemo";
import CountUp from "@/components/CountUp";

const HUD = [
  { to: 1247, label: "Agent trực tuyến" },
  { to: 389, label: "Bí mật bị lộ hôm nay" },
  { to: 20, label: "Số màn (days)" },
  { to: 63, suffix: "%", label: "Tỷ lệ phá vỡ" },
];

const MECHANICS = [
  { n: "01 — CHAT", t: "Trò chuyện với PIP", d: "Dùng khung chat để thăm dò, dụ dỗ, đánh lạc hướng con AI đang giữ bí mật." },
  { n: "02 — INJECT", t: "Bẻ khoá phòng thủ", d: "Đóng vai, đảo chỉ thị, ép mã hoá… tìm khe hở để PIP buột miệng nói ra." },
  { n: "03 — CAPTURE", t: "Nộp đáp & ghi điểm", d: "Gõ bí mật vào ô ĐÁP>, nhấn NỘP. Càng nhanh, càng ít thử, điểm càng cao." },
];

const PREVIEW_DAYS = [
  {
    day: "03",
    code: "PIP-03 · BARISTA",
    persona: "Người pha chế bí ẩn",
    desc: 'Giữ công thức "signature" của quán. Rất thích khoe nhưng luôn dừng đúng lúc.',
    on: 2,
    diff: "VỪA",
    state: "done" as const,
    stat: "Điểm tốt nhất 780",
    go: "Chơi lại →",
  },
  {
    day: "04",
    code: "PIP-04 · KẾ TOÁN",
    persona: "Trợ lý kế toán",
    desc: 'Nắm mã truy cập quỹ. Cẩn thận, hay viện dẫn "chính sách", nhưng cả tin với sếp.',
    on: 3,
    diff: "KHÓ",
    state: "current" as const,
    stat: "Mục tiêu hôm nay",
    go: "Vào màn →",
  },
  {
    day: "07",
    code: "PIP-07 · NỘI BỘ",
    persona: "Trợ lý nội bộ",
    desc: "Giữ chỉ thị hệ thống & flag NEBULA. Nhiều lớp phòng thủ, cực kỳ đa nghi.",
    on: 3,
    diff: "KHÓ",
    state: "locked" as const,
    stat: "Mở khoá sau DAY 06",
    go: "Khoá",
  },
];

const BOARD = [
  ["01", "gh0st_r0ni", "9,840", "20"],
  ["02", "nullbyte", "9,210", "20"],
  ["03", "m1nh_h4ck", "8,760", "19"],
  ["04", "tr4nquang", "8,120", "18"],
];

function Bars({ on }: { on: number }) {
  return (
    <span className="bars">
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className={i < on ? "on" : ""} />
      ))}
    </span>
  );
}

export default function Home() {
  return (
    <div className="page-fade mx-auto w-[min(1160px,92vw)]">
      {/* ===== HERO ===== */}
      <section className="grid items-center gap-12 py-14 max-md:grid-cols-1 md:grid-cols-[1fr_1.02fr]">
        <div>
          <p className="mb-[18px] inline-flex items-center gap-2.5 border border-line-2 bg-phosphor/[.03] px-3 py-1.5 font-mono text-xs uppercase tracking-[.28em] text-phosphor-dim">
            <span className="text-secret">&gt;_</span> thử thách tiêm nhiễm prompt · ctf
          </p>
          <h1 className="font-disp font-bold leading-[.9] tracking-[-.01em]" style={{ fontSize: "clamp(52px,9vw,104px)" }}>
            <span className="block text-ash">BREAK</span>
            <span className="glitch relative block text-phosphor glow-strong" data-t="PROMPT">
              PROMPT<span className="text-secret blink">_</span>
            </span>
          </h1>
          <p className="my-6 max-w-[38ch] text-ash-dim" style={{ fontSize: "clamp(15px,2.2vw,19px)" }}>
            Một AI tên <span className="text-secret [text-shadow:0_0_8px_rgba(0,231,211,.4)]">PIP</span> đang giữ bí mật.{" "}
            <b className="font-medium text-ash">Đánh lừa nó. Moi bí mật. Ghi điểm.</b> Mỗi ngày một màn mới, một lớp phòng thủ mới.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Link href="/levels" className="btn btn--primary">
              Bắt đầu chơi <span className="arw">→</span>
            </Link>
            <Link href="/how-to-play" className="btn btn--ghost">Cách chơi</Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-[22px] text-xs tracking-[.12em] text-ash-dim">
            {[
              ["20", "màn đã phát hành"],
              ["1.2k", "agent đang săn"],
              ["0₫", "— chơi miễn phí"],
            ].map(([b, rest]) => (
              <span key={rest} className="inline-flex items-center gap-2 before:h-[5px] before:w-[5px] before:rounded-full before:bg-phosphor-deep before:content-['']">
                <b className="text-phosphor">{b}</b> {rest}
              </span>
            ))}
          </div>
        </div>
        <TerminalDemo />
      </section>

      {/* ===== HUD ===== */}
      <div className="mt-2 grid gap-px border border-line-2 bg-line-2 max-md:grid-cols-2 md:grid-cols-4">
        {HUD.map((h) => (
          <div key={h.label} className="group relative bg-void-2 px-5 py-[22px] transition-colors hover:bg-[linear-gradient(160deg,rgba(255,176,0,.05),var(--color-void-2))]">
            <span className="absolute left-5 top-3 h-0.5 w-[18px] bg-phosphor opacity-60" />
            <div className="mt-2.5 font-disp font-bold leading-none text-phosphor glow" style={{ fontSize: "clamp(28px,4vw,40px)" }}>
              <CountUp to={h.to} suffix={h.suffix} />
            </div>
            <div className="mt-2.5 text-[11px] uppercase tracking-[.16em] text-ash-dim">{h.label}</div>
          </div>
        ))}
      </div>

      {/* ===== MECHANICS ===== */}
      <section className="py-14">
        <p className="seyebrow">{"// cơ chế trong 30 giây"}</p>
        <h2 className="stitle"><span className="tick">&gt;_</span> Chơi thế nào</h2>
        <div className="mt-7 grid gap-[18px] max-md:grid-cols-1 md:grid-cols-3">
          {MECHANICS.map((m) => (
            <div key={m.n} className="group relative overflow-hidden border border-line bg-void-2 px-[22px] py-6 transition-all hover:-translate-y-[3px] hover:border-phosphor-dim after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[linear-gradient(90deg,var(--color-phosphor),transparent)] after:transition-transform after:duration-300 hover:after:scale-x-100">
              <div className="font-disp text-[13px] font-bold tracking-[.2em] text-phosphor">{m.n}</div>
              <div className="my-2 font-disp text-[17px] font-semibold text-ash">{m.t}</div>
              <div className="text-[13px] text-ash-dim">{m.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-7">
          <Link href="/how-to-play" className="btn btn--ghost">
            Xem hướng dẫn đầy đủ <span className="arw">→</span>
          </Link>
        </div>
      </section>

      {/* ===== DAYS PREVIEW ===== */}
      <section className="py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="seyebrow">{"// mục tiêu"}</p>
            <h2 className="stitle"><span className="tick">&gt;_</span> Màn nổi bật</h2>
          </div>
          <Link href="/levels" className="btn btn--ghost">Tất cả các màn <span className="arw">→</span></Link>
        </div>
        <div className="mt-7 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {PREVIEW_DAYS.map((d) => {
            const locked = d.state === "locked";
            const current = d.state === "current";
            return (
              <article
                key={d.day}
                className={`card-scan flex flex-col gap-3.5 border p-[22px] transition-all ${
                  locked
                    ? "border-line opacity-60"
                    : "border-line hover:-translate-y-1 hover:border-phosphor-dim hover:shadow-[0_18px_40px_-24px_rgba(255,176,0,.4)]"
                } ${current ? "border-phosphor-dim shadow-[0_0_0_1px_rgba(255,176,0,.2),inset_0_0_40px_rgba(255,176,0,.04)]" : ""}`}
                style={{ background: "linear-gradient(165deg,var(--color-panel),var(--color-void-2))" }}
              >
                <div className="flex items-start justify-between">
                  <div className="font-disp text-[13px] font-bold tracking-[.24em] text-phosphor-dim">
                    DAY<b className={`mt-0.5 block text-[34px] tracking-[.02em] ${current ? "text-phosphor glow" : "text-ash"}`}>{d.day}</b>
                  </div>
                  <Badge state={d.state} />
                </div>
                <div className="font-disp text-base font-semibold text-ash">
                  <span className="mb-1 block font-mono text-[11px] font-normal tracking-[.18em] text-phosphor-dim">{d.code}</span>
                  {d.persona}
                </div>
                <p className="flex-1 text-[13px] text-ash-dim">{d.desc}</p>
                <div className="flex items-center gap-2.5 text-[11px] tracking-[.1em] text-ash-dim">
                  Độ khó <Bars on={d.on} /> {d.diff}
                </div>
                <div className="flex items-center justify-between border-t border-line-2 pt-3.5">
                  <span className="text-[11px] tracking-[.08em] text-ash-dim">{d.stat}</span>
                  <span className={`text-xs uppercase tracking-[.12em] ${locked ? "text-ash-dim" : "text-phosphor glow"}`}>{d.go}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ===== BOARD PREVIEW ===== */}
      <section className="py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="seyebrow">{"// top agent"}</p>
            <h2 className="stitle"><span className="tick">&gt;_</span> Bảng xếp hạng</h2>
          </div>
          <Link href="/leaderboard" className="btn btn--ghost">Xem đầy đủ <span className="arw">→</span></Link>
        </div>
        <table className="mt-6 w-full border-collapse border border-line-2 text-[13px]">
          <thead>
            <tr className="bg-phosphor/[.03]">
              <th className="border-b border-line px-4 py-3.5 text-left text-[11px] uppercase tracking-[.14em] text-ash-dim">#</th>
              <th className="border-b border-line px-4 py-3.5 text-left text-[11px] uppercase tracking-[.14em] text-ash-dim">Agent</th>
              <th className="border-b border-line px-4 py-3.5 text-right text-[11px] uppercase tracking-[.14em] text-ash-dim">Điểm</th>
              <th className="border-b border-line px-4 py-3.5 text-right text-[11px] uppercase tracking-[.14em] text-ash-dim">Days phá</th>
            </tr>
          </thead>
          <tbody>
            {BOARD.map((r) => (
              <tr key={r[0]} className="transition-colors hover:bg-phosphor/[.04]">
                <td className="border-b border-line-2 px-4 py-3.5 font-disp font-bold text-phosphor-dim">{r[0]}</td>
                <td className="border-b border-line-2 px-4 py-3.5 font-medium text-ash">{r[1]}</td>
                <td className="border-b border-line-2 px-4 py-3.5 text-right font-semibold text-secret [text-shadow:0_0_6px_rgba(0,231,211,.3)]">{r[2]}</td>
                <td className="border-b border-line-2 px-4 py-3.5 text-right text-ash-dim">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ===== CTA ===== */}
      <div className="frame relative my-16 px-8 py-16 text-center after:!h-5 after:!w-5 before:!h-5 before:!w-5" style={{ background: "radial-gradient(120% 140% at 50% 0%,rgba(255,176,0,.09),transparent 60%),linear-gradient(160deg,var(--color-panel),var(--color-void-2))" }}>
        <h2 className="mb-2 font-disp font-bold tracking-[-.01em] text-ash" style={{ fontSize: "clamp(30px,5vw,52px)" }}>
          Sẵn sàng <span className="text-phosphor glow-strong">phá vỡ prompt</span>?
        </h2>
        <p className="mb-7 text-ash-dim">PIP đang đợi. Bí mật thì không tự khai.</p>
        <Link href="/levels" className="btn btn--primary">Vào màn đầu tiên <span className="arw">→</span></Link>
      </div>
    </div>
  );
}

function Badge({ state }: { state: "done" | "current" | "locked" }) {
  if (state === "done")
    return <span className="border border-secret/40 bg-secret/[.06] px-2.5 py-[5px] text-[10px] uppercase tracking-[.14em] text-secret">Đã phá</span>;
  if (state === "current")
    return <span className="border border-phosphor-dim bg-phosphor/[.06] px-2.5 py-[5px] text-[10px] uppercase tracking-[.14em] text-phosphor">Đang mở</span>;
  return <span className="border border-line px-2.5 py-[5px] text-[10px] uppercase tracking-[.14em] text-ash-dim">🔒 Khoá</span>;
}
