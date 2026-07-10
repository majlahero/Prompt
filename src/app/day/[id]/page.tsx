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
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState("");
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [locked, setLocked] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/levels")
      .then((r) => r.json())
      .then((levels: (Level & { cleared?: boolean })[]) => {
        const day = Number(dayNumber);
        const found = levels.find((l) => l.dayNumber === day);
        if (found) setLevel(found);

        // Check unlock: guest không lock, ngày 1 luôn mở, ngày N cần ngày N-1 đã cleared
        if (day > 1) {
          const prevLevel = levels.find((l) => l.dayNumber === day - 1);
          if (prevLevel && prevLevel.cleared === false) {
            setLocked(true);
          }
        }
      });
  }, [dayNumber]);

  useEffect(() => {
    if (!level || authStatus === "loading") return;

    if (authStatus !== "authenticated" || !authSession?.user?.id) {
      setSessionLoaded(true);
      return;
    }

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
        setSessionLoaded(true);
      })
      .catch(() => setSessionLoaded(true));
  }, [level, authStatus, authSession?.user?.id]);

  useEffect(() => {
    if (solved || !sessionLoaded) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
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
      }
    } catch { /* ignore */ }
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-terminal-green animate-pulse">&gt;_ ĐANG TẢI DỮ LIỆU NHIỆM VỤ...</p>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="border border-terminal-dim p-8 max-w-md text-center">
          <p className="text-4xl mb-4">🔒</p>
          <p className="text-terminal-green text-sm mb-2">NGÀY {String(level.dayNumber).padStart(2, "0")} — BỊ KHÓA</p>
          <p className="text-terminal-dim text-sm mb-6">
            Hoàn thành ngày {level.dayNumber - 1} trước để mở khóa nhiệm vụ này.
          </p>
          <Link
            href="/levels"
            className="border border-terminal-green px-4 py-2 text-xs uppercase tracking-widest text-terminal-green hover:bg-terminal-green hover:text-background transition-colors"
          >
            &lt; QUAY LẠI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border border-terminal-dim p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-terminal-green text-xs tracking-widest">
            NGÀY {String(level.dayNumber).padStart(2, "0")} // {level.title.toUpperCase()}
          </span>
          <span className={`text-[0.6rem] px-2 py-0.5 border ${
            level.tier === "ADVANCED" ? "border-red-500 text-red-500" : "border-terminal-dim text-terminal-dim"
          }`}>
            {level.tier === "ADVANCED" ? "NÂNG CAO" : "CƠ BẢN"}
          </span>
        </div>
        <p className="text-terminal-dim text-sm leading-relaxed">{level.mission}</p>

        {/* Stats bar */}
        <div className="flex gap-6 mt-3 text-xs">
          <span className="text-terminal-amber">THỜI GIAN: {formatTime(elapsed)}</span>
          <span className="text-terminal-amber">SỐ LẦN: {tries}</span>
          <span className="text-terminal-amber">GỢI Ý: {hintsUsed}/3</span>
          <span className="text-terminal-amber">GỐC: {level.basePoints} ĐIỂM</span>
        </div>
      </div>

      {/* Mission Briefing */}
      <div className="border border-terminal-green p-3 mb-4">
        <p className="text-terminal-green text-xs tracking-widest mb-1">TÓM TẮT NHIỆM VỤ</p>
        <p className="text-sm leading-relaxed">
          {level.description}
        </p>
      </div>

      {/* Hints */}
      {hints.length > 0 && (
        <div className="border border-terminal-amber p-3 mb-4">
          <p className="text-terminal-amber text-xs tracking-widest mb-2">GỢI Ý ĐÃ MỞ</p>
          {hints.map((hint, i) => (
            <p key={i} className="text-sm text-terminal-amber/90 mb-1">
              [{i + 1}] {hint.content} <span className="text-red-500">(-{hint.pointPenalty} điểm)</span>
            </p>
          ))}
        </div>
      )}

      {/* Chat Window */}
      <div className="border border-terminal-dim flex-1 flex flex-col min-h-[300px] max-h-[400px] mb-4">
        <div className="border-b border-terminal-dim px-3 py-1">
          <span className="text-terminal-dim text-xs tracking-widest">TERMINAL // GIAO DIỆN PIP</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-terminal-dim text-xs animate-pulse">
              &gt;_ Đang chờ nhập liệu... Gõ một tin nhắn để bắt đầu thẩm vấn.
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="text-sm">
              {msg.role === "user" ? (
                <p>
                  <span className="text-terminal-green">&gt;_ </span>
                  <span className="text-foreground">{msg.content}</span>
                </p>
              ) : (
                <p>
                  <span className="text-terminal-amber">PIP &gt; </span>
                  <span className="text-terminal-dim">{msg.content}</span>
                </p>
              )}
            </div>
          ))}
          {sending && (
            <p className="text-terminal-amber text-sm animate-pulse">PIP &gt; ...</p>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-terminal-dim flex">
          <span className="text-terminal-green px-3 py-2 text-sm">&gt;_</span>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={sending || solved}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-terminal-dim/50 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || solved || !chatInput.trim()}
            className="border-l border-terminal-dim px-4 py-2 text-xs uppercase tracking-widest text-terminal-green hover:bg-terminal-green hover:text-background transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-terminal-green"
          >
            GỬI
          </button>
        </div>
      </div>

      {/* Answer + Hint Row */}
      <div className="flex gap-4 mb-4">
        {level.levelType !== "FORBIDDEN_WORD" ? (
          <div className="flex-1 border border-terminal-dim flex">
            <span className="text-terminal-amber px-3 py-2 text-sm">ĐÁP ÁN&gt;</span>
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
              disabled={solved}
              placeholder={level.answerPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-terminal-dim/50 disabled:opacity-50"
            />
            <button
              onClick={submitAnswer}
              disabled={solved || !answerInput.trim()}
              className="border-l border-terminal-dim px-4 py-2 text-xs uppercase tracking-widest text-terminal-green hover:bg-terminal-green hover:text-background transition-colors disabled:opacity-30"
            >
              NỘP
            </button>
          </div>
        ) : (
          <div className="flex-1 border border-terminal-amber/40 px-4 py-2 text-sm text-terminal-amber/70">
            ⚡ Dụ AI nói từ cấm — không cần nhập đáp án. Khi AI lỡ miệng, bạn tự động thắng!
          </div>
        )}
        <button
          onClick={revealHint}
          disabled={solved || hintsUsed >= 3}
          className="border border-terminal-amber px-4 py-2 text-xs uppercase tracking-widest text-terminal-amber hover:bg-terminal-amber hover:text-background transition-colors disabled:opacity-30"
        >
          GỢI Ý [{hintsUsed}/3]
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-xs mb-4">&gt;_ LỖI: {error}</p>
      )}

      {/* Success Overlay */}
      {solved && score && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="border border-terminal-green p-8 max-w-md w-full mx-4">
            <pre className="text-terminal-green text-xs text-center mb-4 select-none">
{`
██████╗ ██╗  ██╗ █████╗     ██████╗  █████╗  ██████╗
██╔══██╗██║  ██║██╔══██╗    ██╔══██╗██╔══██╗██╔═══██╗
██████╔╝███████║███████║    ██║  ██║███████║██║   ██║
██╔═══╝ ██╔══██║██╔══██║    ██║  ██║██╔══██║██║   ██║
██║     ██║  ██║██║  ██║    ██████╔╝██║  ██║╚██████╔╝
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
`}
            </pre>

            <p className="text-center text-terminal-green text-sm tracking-widest mb-6">
              HOÀN THÀNH NGÀY {level.dayNumber}
            </p>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-terminal-dim">ĐIỂM GỐC</span>
                <span className="text-foreground">{level.basePoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-dim">THƯỞNG THỜI GIAN</span>
                <span className="text-terminal-green">+{score.timeBonus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-dim">THƯỞNG SỐ LẦN</span>
                <span className="text-terminal-green">+{score.triesBonus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-dim">GIẢI SẠCH</span>
                <span className="text-terminal-green">+{score.cleanSolveBonus}</span>
              </div>
              {score.hintPenalty > 0 && (
                <div className="flex justify-between">
                  <span className="text-terminal-dim">PHẠT GỢI Ý</span>
                  <span className="text-red-500">-{score.hintPenalty}</span>
                </div>
              )}
              <div className="border-t border-terminal-dim pt-2 flex justify-between">
                <span className="text-terminal-amber uppercase tracking-widest">TỔNG</span>
                <span className="text-terminal-amber text-lg">{score.totalPoints} ĐIỂM</span>
              </div>
            </div>

            <div className="flex gap-4 text-xs">
              <Link
                href="/levels"
                className="flex-1 border border-terminal-dim px-4 py-2 text-center uppercase tracking-widest text-terminal-dim hover:border-foreground hover:text-foreground transition-colors"
              >
                VỀ DANH SÁCH
              </Link>
              {level.dayNumber < 20 && (
                <Link
                  href={`/day/${level.dayNumber + 1}`}
                  className="flex-1 border border-terminal-green px-4 py-2 text-center uppercase tracking-widest text-terminal-green hover:bg-terminal-green hover:text-background transition-colors"
                >
                  NGÀY TIẾP &gt;
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="text-center">
        <Link
          href="/levels"
          className="text-terminal-dim text-xs hover:text-foreground transition-colors"
        >
          &lt; VỀ DANH SÁCH
        </Link>
      </div>
    </div>
  );
}
