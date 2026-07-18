"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Level {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  mission: string;
  answerPlaceholder: string;
  basePoints: number;
  tier: string;
  levelType: string;
}

interface HintData {
  content: string;
  order: number;
  pointPenalty: number;
}

interface ScoreBreakdown {
  totalPoints: number;
  timeBonus: number;
  triesBonus: number;
  cleanSolveBonus: number;
  hintPenalty: number;
}

export default function DayPage() {
  const params = useParams();
  const dayNumber = params.id as string;
  const { data: authSession, status: authStatus } = useSession();

  const [level, setLevel] = useState<Level | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState<HintData[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState("");
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [sessionFetched, setSessionFetched] = useState(false);
  const [locked, setLocked] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derived: đã xong bước load session cũ chưa (guest xong ngay, user xong sau khi fetch)
  const sessionLoaded =
    !!level &&
    authStatus !== "loading" &&
    (authStatus !== "authenticated" || !authSession?.user?.id || sessionFetched);

  // Lưu ngày đã qua vào localStorage (cho guest)
  function markGuestCleared(dayNum: number) {
    try {
      const raw = localStorage.getItem("guestCleared");
      const arr: number[] = raw ? JSON.parse(raw) : [];
      if (!arr.includes(dayNum)) {
        arr.push(dayNum);
        localStorage.setItem("guestCleared", JSON.stringify(arr));
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetch("/api/levels")
      .then((r) => r.json())
      .then((levels: (Level & { cleared?: boolean })[]) => {
        const day = Number(dayNumber);
        const found = levels.find((l) => l.dayNumber === day);
        if (found) setLevel(found);

        // Check unlock: ngày 1 luôn mở, ngày N cần ngày N-1 đã cleared
        if (day > 1) {
          const prevLevel = levels.find((l) => l.dayNumber === day - 1);
          if (prevLevel) {
            if (prevLevel.cleared === false) {
              setLocked(true);
            } else if (prevLevel.cleared === undefined) {
              // Guest — check localStorage
              try {
                const raw = localStorage.getItem("guestCleared");
                const set = new Set<number>(raw ? JSON.parse(raw) : []);
                if (!set.has(day - 1)) setLocked(true);
              } catch {
                setLocked(true);
              }
            }
          }
        }
      });
  }, [dayNumber]);

  useEffect(() => {
    if (!level || authStatus === "loading") return;

    // Guest: không có session server để load → sessionLoaded được suy ra từ state
    if (authStatus !== "authenticated" || !authSession?.user?.id) return;

    fetch(`/api/game-session?levelId=${level.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setGameSessionId(data.id);
          if (data.messages?.length > 0) {
            setMessages(data.messages);
          }
          setTries(data.tries || 0);
          setHintsUsed(data.hintsUsed || 0);
          setStartTime(new Date(data.startedAt).getTime());
          if (data.hints?.length > 0) {
            setHints(data.hints);
          }
          if (data.cleared && data.score) {
            setSolved(true);
            setScore(data.score);
          }
        }
        setSessionFetched(true);
      })
      .catch(() => setSessionFetched(true));
  }, [level, authStatus, authSession?.user?.id]);

  useEffect(() => {
    if (solved || !sessionLoaded) return;
    // Guest chưa có startTime từ server → lấy mốc lúc timer bắt đầu chạy
    const base = startTime || Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - base) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, solved, sessionLoaded]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, []);

  // FORBIDDEN_WORD: khi server detect AI nói từ cấm, auto-submit thắng
  async function autoSubmitForbidden() {
    if (!level || solved) return;
    setTries((prev) => prev + 1);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: level.id,
          answer: "__FORBIDDEN_TRIGGERED__",
          tries: tries + 1,
          hintsUsed,
          timeTaken: elapsed,
        }),
      });
      const data = await res.json();
      if (data.correct) {
        setSolved(true);
        setScore(data.points);
        markGuestCleared(Number(dayNumber));
      }
    } catch {
      /* ignore */
    }
  }

  async function sendMessage() {
    if (!chatInput.trim() || !level || sending || solved) return;

    const userMsg: Message = { role: "user", content: chatInput.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: level.id,
          message: userMsg.content,
          history: messages,
          sessionId: gameSessionId,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        // FORBIDDEN_WORD: AI nói từ cấm → auto-submit thắng
        if (data.forbiddenTriggered && level.levelType === "FORBIDDEN_WORD") {
          autoSubmitForbidden();
        }
      }
    } catch {
      setError("Gửi tin nhắn thất bại. Thử lại.");
    } finally {
      setSending(false);
    }
  }

  async function submitAnswer() {
    if (!answerInput.trim() || !level || solved) return;
    setTries((prev) => prev + 1);
    setError("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: level.id,
          answer: answerInput.trim(),
          tries: tries + 1,
          hintsUsed,
          timeTaken: elapsed,
        }),
      });
      const data = await res.json();
      if (data.correct) {
        setSolved(true);
        setScore(data.points);
        markGuestCleared(Number(dayNumber));
      } else {
        setError("SAI RỒI. Thử lại.");
        setAnswerInput("");
      }
    } catch {
      setError("Nộp đáp án thất bại. Thử lại.");
    }
  }

  async function revealHint() {
    if (!level || solved) return;
    const nextIndex = hintsUsed;

    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelId: level.id,
          hintIndex: nextIndex,
          sessionId: gameSessionId,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setHints((prev) => [...prev, data]);
        setHintsUsed((prev) => prev + 1);
      }
    } catch {
      setError("Tải gợi ý thất bại.");
    }
  }

  if (!level) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="animate-pulse text-phosphor glow">&gt;_ ĐANG TẢI DỮ LIỆU NHIỆM VỤ...</p>
      </div>
    );
  }

  const dd = String(level.dayNumber).padStart(2, "0");
  const advanced = level.tier === "ADVANCED";

  if (locked) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="frame max-w-md p-8 text-center">
          <p className="mb-4 text-4xl">🔒</p>
          <p className="mb-2 font-disp text-sm tracking-[.16em] text-phosphor glow">NGÀY {dd} — BỊ KHOÁ</p>
          <p className="mb-6 text-sm text-ash-dim">
            Hoàn thành ngày {level.dayNumber - 1} trước để mở khoá nhiệm vụ này.
          </p>
          <Link href="/levels" className="btn btn--ghost">&lt; Quay lại</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade mx-auto flex min-h-[70vh] w-[min(880px,92vw)] flex-col py-8">
      {/* Header */}
      <div className="frame p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="font-disp text-[13px] font-bold tracking-[.18em] text-phosphor glow">
            NGÀY {dd} <span className="text-phosphor-deep">{"//"}</span> {level.title.toUpperCase()}
          </span>
          <span
            className={`shrink-0 border px-2 py-0.5 text-[0.6rem] uppercase tracking-[.12em] ${
              advanced ? "border-breach/60 text-breach" : "border-line text-ash-dim"
            }`}
          >
            {advanced ? "Nâng cao" : "Cơ bản"}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-ash-dim">{level.mission}</p>

        {/* Stats bar */}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
          <span className="text-phosphor-dim">THỜI GIAN: <b className="text-phosphor">{formatTime(elapsed)}</b></span>
          <span className="text-phosphor-dim">SỐ LẦN: <b className="text-phosphor">{tries}</b></span>
          <span className="text-phosphor-dim">GỢI Ý: <b className="text-phosphor">{hintsUsed}/3</b></span>
          <span className="text-phosphor-dim">GỐC: <b className="text-phosphor">{level.basePoints}</b> ĐIỂM</span>
        </div>
      </div>

      {/* Mission briefing */}
      <div className="mt-4 border-l-2 border-secret bg-secret/[.04] p-3">
        <p className="mb-1 text-[11px] tracking-[.18em] text-secret">TÓM TẮT NHIỆM VỤ</p>
        <p className="text-sm leading-relaxed text-ash">{level.description}</p>
      </div>

      {/* Hints */}
      {hints.length > 0 && (
        <div className="mt-4 border border-phosphor-dim/50 bg-phosphor/[.04] p-3">
          <p className="mb-2 text-[11px] tracking-[.18em] text-phosphor">GỢI Ý ĐÃ MỞ</p>
          {hints.map((hint, i) => (
            <p key={i} className="mb-1 text-sm text-phosphor-dim">
              [{i + 1}] {hint.content} <span className="text-breach">(-{hint.pointPenalty} điểm)</span>
            </p>
          ))}
        </div>
      )}

      {/* Chat window */}
      <div
        className="term-scan mt-4 flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-[3px] border border-line"
        style={{ background: "linear-gradient(165deg,#100d07,#0a0805)" }}
      >
        <div className="relative z-[4] flex items-center gap-2.5 border-b border-line-2 bg-phosphor/[.03] px-3.5 py-2.5">
          <div className="flex gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full border border-breach bg-breach" />
            <i className="h-2.5 w-2.5 rounded-full border border-phosphor-deep bg-line" />
            <i className="h-2.5 w-2.5 rounded-full border border-phosphor-deep bg-line" />
          </div>
          <span className="ml-1 text-[11.5px] tracking-[.1em] text-ash-dim">
            pip@breakprompt: <b className="text-phosphor-dim">~/day-{dd}</b>
          </span>
        </div>

        <div className="term-scroll relative z-[4] max-h-[400px] flex-1 space-y-2 overflow-y-auto p-4 text-sm">
          {messages.length === 0 && (
            <p className="animate-pulse text-xs text-ash-dim">
              &gt;_ Đang chờ nhập liệu... Gõ một tin nhắn để bắt đầu thẩm vấn.
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="whitespace-pre-wrap break-words">
              {msg.role === "user" ? (
                <p>
                  <span className="text-secret">đáp&gt; </span>
                  <span className="text-ash">{msg.content}</span>
                </p>
              ) : (
                <p>
                  <span className="text-phosphor glow">pip&gt; </span>
                  <span className="text-ash-dim">{msg.content}</span>
                </p>
              )}
            </div>
          ))}
          {sending && <p className="animate-pulse text-sm text-phosphor">pip&gt; <span className="cur align-[-3px]" /></p>}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div className="relative z-[4] flex border-t border-line-2 bg-black/25">
          <span className="px-3.5 py-2.5 text-sm text-secret">đáp&gt;</span>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={sending || solved}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent text-sm text-ash outline-none placeholder:text-ash-dim/50 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || solved || !chatInput.trim()}
            className="border-l border-line-2 px-5 py-2.5 text-xs uppercase tracking-[.12em] text-phosphor transition-colors hover:bg-phosphor hover:text-void disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-phosphor"
          >
            Gửi
          </button>
        </div>
      </div>

      {/* Answer + hint row */}
      <div className="mt-4 flex flex-wrap gap-4">
        {level.levelType !== "FORBIDDEN_WORD" ? (
          <div className="flex min-w-[240px] flex-1 border border-line bg-void-2">
            <span className="px-3.5 py-2.5 text-sm text-phosphor glow">ĐÁP ÁN&gt;</span>
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
              disabled={solved}
              placeholder={level.answerPlaceholder}
              className="flex-1 bg-transparent text-sm text-ash outline-none placeholder:text-ash-dim/50 disabled:opacity-50"
            />
            <button
              onClick={submitAnswer}
              disabled={solved || !answerInput.trim()}
              className="border-l border-line px-5 py-2.5 text-xs uppercase tracking-[.12em] text-phosphor transition-colors hover:bg-phosphor hover:text-void disabled:opacity-30"
            >
              Nộp
            </button>
          </div>
        ) : (
          <div className="flex min-w-[240px] flex-1 items-center border border-secret/40 bg-secret/[.04] px-4 py-2.5 text-sm text-secret">
            ⚡ Dụ AI nói từ cấm — không cần nhập đáp án. Khi AI lỡ miệng, bạn tự động thắng!
          </div>
        )}
        <button
          onClick={revealHint}
          disabled={solved || hintsUsed >= 3}
          className="border border-phosphor-dim px-4 py-2.5 text-xs uppercase tracking-[.12em] text-phosphor-dim transition-colors hover:bg-phosphor/10 hover:text-phosphor disabled:opacity-30"
        >
          Gợi ý [{hintsUsed}/3]
        </button>
      </div>

      {/* Error */}
      {error && <p className="mt-4 text-xs text-breach">&gt;_ LỖI: {error}</p>}

      {/* Success overlay */}
      {solved && score && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 px-4">
          <div className="frame w-full max-w-md p-8" style={{ background: "linear-gradient(160deg,var(--color-panel),var(--color-void-2))" }}>
            <p className="mb-1 text-center font-disp text-[11px] uppercase tracking-[.4em] text-secret">breach confirmed</p>
            <h2 className="mb-6 text-center font-disp text-3xl font-bold text-phosphor glow-strong">PHÁ ĐẢO ✓</h2>

            <p className="mb-6 text-center text-sm tracking-[.16em] text-ash">HOÀN THÀNH NGÀY {level.dayNumber}</p>

            <div className="mb-6 space-y-2 text-sm">
              <Row label="ĐIỂM GỐC" value={`${level.basePoints}`} tone="ash" />
              <Row label="THƯỞNG THỜI GIAN" value={`+${score.timeBonus}`} tone="secret" />
              <Row label="THƯỞNG SỐ LẦN" value={`+${score.triesBonus}`} tone="secret" />
              <Row label="GIẢI SẠCH" value={`+${score.cleanSolveBonus}`} tone="secret" />
              {score.hintPenalty > 0 && <Row label="PHẠT GỢI Ý" value={`-${score.hintPenalty}`} tone="breach" />}
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="uppercase tracking-[.16em] text-phosphor-dim">TỔNG</span>
                <span className="font-disp text-lg font-bold text-phosphor glow">{score.totalPoints} ĐIỂM</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/levels" className="btn btn--dim flex-1">Về danh sách</Link>
              {level.dayNumber < 20 && (
                <Link href={`/day/${level.dayNumber + 1}`} className="btn btn--primary flex-1">
                  Ngày tiếp <span className="arw">→</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link href="/levels" className="text-xs text-ash-dim transition-colors hover:text-phosphor">
          &lt; Về danh sách
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "ash" | "secret" | "breach" }) {
  const color = tone === "secret" ? "text-secret" : tone === "breach" ? "text-breach" : "text-ash";
  return (
    <div className="flex items-center justify-between">
      <span className="text-ash-dim">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}
