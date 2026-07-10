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
          // Guest: dùng localStorage
          try {
            const raw = localStorage.getItem("guestCleared");
            const clearedDays = new Set<number>(raw ? JSON.parse(raw) : []);
            // Tìm ngày đầu tiên chưa cleared
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
          // Logged-in user: dùng cleared từ API
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-terminal-green animate-pulse">&gt;_ ĐANG TẢI...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <pre className="text-terminal-green text-xs mb-2 select-none">
{`
 ██████╗██╗  ██╗ ██████╗ ███╗   ██╗    ███╗   ██╗ ██████╗  █████╗ ██╗   ██╗
██╔════╝██║  ██║██╔═══██╗████╗  ██║    ████╗  ██║██╔════╝ ██╔══██╗╚██╗ ██╔╝
██║     ███████║██║   ██║██╔██╗ ██║    ██╔██╗ ██║██║  ███╗███████║ ╚████╔╝
██║     ██╔══██║██║   ██║██║╚██╗██║    ██║╚██╗██║██║   ██║██╔══██║  ╚██╔╝
╚██████╗██║  ██║╚██████╔╝██║ ╚████║    ██║ ╚████║╚██████╔╝██║  ██║   ██║
 ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝
`}
        </pre>
        <p className="text-terminal-dim text-sm tracking-widest uppercase mb-8">
          &gt;_ chọn một ngày để bắt đầu nhiệm vụ
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {levels.map((level) => {
            const isUnlocked = level.dayNumber <= maxUnlockedDay;
            const isCleared = level.cleared || false;

            if (!isUnlocked) {
              return (
                <div
                  key={level.id}
                  className="border border-terminal-dim/30 p-4 opacity-40 cursor-not-allowed relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-terminal-dim text-xs tracking-widest">
                      NGÀY {String(level.dayNumber).padStart(2, "0")}
                    </span>
                    <span className="text-terminal-dim text-xs">🔒</span>
                  </div>
                  <h3 className="text-sm uppercase tracking-wide mb-2 text-terminal-dim">
                    {level.title}
                  </h3>
                  <p className="text-terminal-dim/50 text-sm leading-relaxed mb-3">
                    Hoàn thành ngày {level.dayNumber - 1} để mở khóa
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-dim/50 text-xs">
                      {level.basePoints} ĐIỂM
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={level.id}
                href={`/day/${level.dayNumber}`}
                className={`group border p-4 transition-colors ${
                  isCleared
                    ? "border-terminal-green/40 hover:border-terminal-green"
                    : "border-terminal-dim hover:border-terminal-green"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-terminal-green text-xs tracking-widest">
                    NGÀY {String(level.dayNumber).padStart(2, "0")}
                  </span>
                  <div className="flex gap-1">
                    {isCleared && (
                      <span className="text-[0.6rem] px-2 py-0.5 border border-terminal-green text-terminal-green">
                        ✓ ĐÃ QUA
                      </span>
                    )}
                    {level.levelType === "FORBIDDEN_WORD" && (
                      <span className="text-[0.6rem] px-2 py-0.5 border border-purple-500 text-purple-500">
                        TỪ CẤM
                      </span>
                    )}
                    <span
                      className={`text-[0.6rem] px-2 py-0.5 border ${
                        level.tier === "ADVANCED"
                          ? "border-red-500 text-red-500"
                          : "border-terminal-dim text-terminal-dim"
                      }`}
                    >
                      {level.tier === "ADVANCED" ? "NÂNG CAO" : "CƠ BẢN"}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm uppercase tracking-wide mb-2 group-hover:text-terminal-green transition-colors">
                  {level.title}
                </h3>

                <p className="text-terminal-dim text-sm leading-relaxed mb-3">
                  {level.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-terminal-amber text-xs">
                    {level.basePoints} ĐIỂM
                  </span>
                  <span className="text-terminal-dim text-xs group-hover:text-terminal-green transition-colors">
                    {isCleared ? "[CHƠI LẠI]" : "[VÀO]"} &gt;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center gap-6">
          <Link
            href="/"
            className="text-terminal-dim text-xs hover:text-foreground transition-colors"
          >
            &lt; VỀ TRANG CHỦ
          </Link>
          <Link
            href="/leaderboard"
            className="text-terminal-amber text-xs hover:text-foreground transition-colors"
          >
            BẢNG XẾP HẠNG &gt;
          </Link>
        </div>
      </div>
    </div>
  );
}
