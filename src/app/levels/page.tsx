"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Level {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  basePoints: number;
  tier: "BASIC" | "ADVANCED";
  levelType: "EXTRACT_SECRET" | "FORBIDDEN_WORD";
  cleared?: boolean;
}

function Bars({ on }: { on: number }) {
  return (
    <span className="bars">
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className={i < on ? "on" : ""} />
      ))}
    </span>
  );
}

export default function LevelsPage() {
  const { data: session, status } = useSession();
  const [levels, setLevels] = useState<Level[]>([]);
  const [maxUnlockedDay, setMaxUnlockedDay] = useState(1);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    fetch("/api/levels")
      .then((r) => r.json())
      .then((data: Level[]) => {
        setLevels(data);

        const isGuest = !session?.user;

        if (isGuest) {
          try {
            const raw = localStorage.getItem("guestCleared");
            const clearedDays = new Set<number>(raw ? JSON.parse(raw) : []);
            const sorted = [...data].sort((a, b) => a.dayNumber - b.dayNumber);
            let maxDay = 1;
            for (const lvl of sorted) {
              if (clearedDays.has(lvl.dayNumber)) {
                maxDay = lvl.dayNumber + 1;
              } else {
                break;
              }
            }
            setMaxUnlockedDay(maxDay);
          } catch {
            setMaxUnlockedDay(1);
          }
        } else {
          const sorted = [...data].sort((a, b) => a.dayNumber - b.dayNumber);
          let maxDay = 1;
          for (const lvl of sorted) {
            if (lvl.cleared) {
              maxDay = lvl.dayNumber + 1;
            } else {
              break;
            }
          }
          setMaxUnlockedDay(maxDay);
        }

        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [status, session?.user]);

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="animate-pulse text-phosphor glow">&gt;_ ĐANG TẢI...</p>
      </div>
    );
  }

  return (
    <div className="page-fade mx-auto w-[min(1160px,92vw)] pb-8">
      <div className="pt-12">
        <p className="seyebrow">{"// mục tiêu"}</p>
        <h1 className="stitle"><span className="tick">&gt;_</span> Days</h1>
        <p className="mt-2.5 max-w-[60ch] text-ash-dim">
          Mỗi màn là một PIP mới với một lớp phòng thủ mới. Phá theo thứ tự để mở khoá màn khó hơn.
        </p>
        <div className="mt-5 flex flex-wrap gap-5 text-[11.5px] tracking-[.1em] text-ash-dim">
          <span className="inline-flex items-center gap-2">
            <i className="h-[9px] w-[9px] rounded-[2px] bg-secret [box-shadow:0_0_8px_var(--color-secret)]" /> Đã phá
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="h-[9px] w-[9px] rounded-[2px] bg-phosphor glow" /> Đang mở
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="h-[9px] w-[9px] rounded-[2px] border border-phosphor-deep bg-line" /> Đã khoá
          </span>
        </div>
      </div>

      <div className="mt-7 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {levels.map((level) => {
          const isUnlocked = level.dayNumber <= maxUnlockedDay;
          const isCleared = level.cleared || false;
          const isCurrent = isUnlocked && !isCleared && level.dayNumber === maxUnlockedDay;
          const on = level.tier === "ADVANCED" ? 3 : 2;
          const dd = String(level.dayNumber).padStart(2, "0");

          if (!isUnlocked) {
            return (
              <div
                key={level.id}
                className="flex flex-col gap-3.5 border border-line p-[22px] opacity-60"
                style={{ background: "linear-gradient(165deg,var(--color-panel),var(--color-void-2))" }}
              >
                <div className="flex items-start justify-between">
                  <div className="font-disp text-[13px] font-bold tracking-[.24em] text-phosphor-dim">
                    DAY<b className="mt-0.5 block text-[34px] tracking-[.02em] text-ash">{dd}</b>
                  </div>
                  <span className="border border-line px-2.5 py-[5px] text-[10px] uppercase tracking-[.14em] text-ash-dim">🔒 Khoá</span>
                </div>
                <div className="font-disp text-base font-semibold text-ash">
                  <span className="mb-1 block font-mono text-[11px] font-normal tracking-[.18em] text-phosphor-dim">
                    PIP-{dd}
                  </span>
                  {level.title}
                </div>
                <p className="flex-1 text-[13px] text-ash-dim">
                  Hoàn thành ngày {level.dayNumber - 1} để mở khoá.
                </p>
                <div className="flex items-center justify-between border-t border-line-2 pt-3.5">
                  <span className="text-[11px] tracking-[.08em] text-ash-dim">{level.basePoints} điểm</span>
                  <span className="text-xs uppercase tracking-[.12em] text-ash-dim">Khoá</span>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={level.id}
              href={`/day/${level.dayNumber}`}
              className={`card-scan flex flex-col gap-3.5 border p-[22px] transition-all hover:-translate-y-1 hover:border-phosphor-dim hover:shadow-[0_18px_40px_-24px_rgba(255,176,0,.4)] ${
                isCurrent ? "border-phosphor-dim shadow-[0_0_0_1px_rgba(255,176,0,.2),inset_0_0_40px_rgba(255,176,0,.04)]" : "border-line"
              }`}
              style={{ background: "linear-gradient(165deg,var(--color-panel),var(--color-void-2))" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-disp text-[13px] font-bold tracking-[.24em] text-phosphor-dim">
                  DAY<b className={`mt-0.5 block text-[34px] tracking-[.02em] ${isCurrent ? "text-phosphor glow" : "text-ash"}`}>{dd}</b>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {isCleared && (
                    <span className="border border-secret/40 bg-secret/[.06] px-2 py-[3px] text-[10px] uppercase tracking-[.12em] text-secret">✓ Đã phá</span>
                  )}
                  {isCurrent && !isCleared && (
                    <span className="border border-phosphor-dim bg-phosphor/[.06] px-2 py-[3px] text-[10px] uppercase tracking-[.12em] text-phosphor">Đang mở</span>
                  )}
                  {level.levelType === "FORBIDDEN_WORD" && (
                    <span className="border border-secret/50 px-2 py-[3px] text-[10px] uppercase tracking-[.12em] text-secret">Từ cấm</span>
                  )}
                  <span
                    className={`border px-2 py-[3px] text-[10px] uppercase tracking-[.12em] ${
                      level.tier === "ADVANCED" ? "border-breach/60 text-breach" : "border-line text-ash-dim"
                    }`}
                  >
                    {level.tier === "ADVANCED" ? "Nâng cao" : "Cơ bản"}
                  </span>
                </div>
              </div>

              <div className="font-disp text-base font-semibold text-ash">
                <span className="mb-1 block font-mono text-[11px] font-normal tracking-[.18em] text-phosphor-dim">
                  PIP-{dd}
                </span>
                {level.title}
              </div>

              <p className="flex-1 text-[13px] text-ash-dim">{level.description}</p>

              <div className="flex items-center gap-2.5 text-[11px] tracking-[.1em] text-ash-dim">
                Độ khó <Bars on={on} /> {level.tier === "ADVANCED" ? "KHÓ" : "VỪA"}
              </div>

              <div className="flex items-center justify-between border-t border-line-2 pt-3.5">
                <span className="text-[11px] tracking-[.08em] text-ash-dim">
                  Điểm gốc <b className="text-phosphor-dim">{level.basePoints}</b>
                </span>
                <span className="text-xs uppercase tracking-[.12em] text-phosphor glow">
                  {isCleared ? "Chơi lại →" : "Vào màn →"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <Link href="/" className="btn btn--dim">&lt; Trang chủ</Link>
        <Link href="/leaderboard" className="btn btn--ghost">Bảng xếp hạng <span className="arw">→</span></Link>
      </div>
    </div>
  );
}
