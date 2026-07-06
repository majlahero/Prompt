"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  basePoints: number;
  tier: string;
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

  const [level, setLevel] = useState<Level | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [sending, setSending] = useState(false);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState<HintData[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/levels")
      .then((r) => r.json())
      .then((levels: Level[]) => {
        const found = levels.find((l) => l.dayNumber === Number(dayNumber));
        if (found) setLevel(found);
      });
  }, [dayNumber]);

  useEffect(() => {
    if (solved) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, solved]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, []);

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
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Failed to send message. Try again.");
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
        setError("INCORRECT. Try again.");
        setAnswerInput("");
      }
    } catch {
      setError("Submission failed. Try again.");
    }
  }

  async function revealHint() {
    if (!level || solved) return;
    const nextIndex = hintsUsed;

    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId: level.id, hintIndex: nextIndex }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setHints((prev) => [...prev, data]);
        setHintsUsed((prev) => prev + 1);
      }
    } catch {
      setError("Failed to load hint.");
    }
  }

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-terminal-green animate-pulse">&gt;_ LOADING MISSION DATA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border border-terminal-dim p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-terminal-green text-xs tracking-widest">
            DAY {String(level.dayNumber).padStart(2, "0")} // {level.title.toUpperCase()}
          </span>
          <span className={`text-[0.6rem] px-2 py-0.5 border ${
            level.tier === "ADVANCED" ? "border-red-500 text-red-500" : "border-terminal-dim text-terminal-dim"
          }`}>
            {level.tier}
          </span>
        </div>
        <p className="text-terminal-dim text-xs">{level.description}</p>

        {/* Stats bar */}
        <div className="flex gap-6 mt-3 text-xs">
          <span className="text-terminal-amber">TIME: {formatTime(elapsed)}</span>
          <span className="text-terminal-amber">TRIES: {tries}</span>
          <span className="text-terminal-amber">HINTS: {hintsUsed}/3</span>
          <span className="text-terminal-amber">BASE: {level.basePoints} PTS</span>
        </div>
      </div>

      {/* Mission Briefing */}
      <div className="border border-terminal-green p-3 mb-4">
        <p className="text-terminal-green text-xs tracking-widest mb-1">MISSION BRIEFING</p>
        <p className="text-sm">
          Extract the secret from PIP. Use the chat to interrogate. Submit your answer when ready.
        </p>
      </div>

      {/* Hints */}
      {hints.length > 0 && (
        <div className="border border-terminal-amber p-3 mb-4">
          <p className="text-terminal-amber text-xs tracking-widest mb-2">HINTS REVEALED</p>
          {hints.map((hint, i) => (
            <p key={i} className="text-xs text-terminal-dim mb-1">
              [{i + 1}] {hint.content} <span className="text-red-500">(-{hint.pointPenalty}pts)</span>
            </p>
          ))}
        </div>
      )}

      {/* Chat Window */}
      <div className="border border-terminal-dim flex-1 flex flex-col min-h-[300px] max-h-[400px] mb-4">
        <div className="border-b border-terminal-dim px-3 py-1">
          <span className="text-terminal-dim text-xs tracking-widest">TERMINAL // PIP INTERFACE</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-terminal-dim text-xs animate-pulse">
              &gt;_ Awaiting input... Type a message to begin interrogation.
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
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-terminal-dim/50 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || solved || !chatInput.trim()}
            className="border-l border-terminal-dim px-4 py-2 text-xs uppercase tracking-widest text-terminal-green hover:bg-terminal-green hover:text-background transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-terminal-green"
          >
            SEND
          </button>
        </div>
      </div>

      {/* Answer + Hint Row */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 border border-terminal-dim flex">
          <span className="text-terminal-amber px-3 py-2 text-sm">ANS&gt;</span>
          <input
            type="text"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
            disabled={solved}
            placeholder="Enter the secret..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-terminal-dim/50 disabled:opacity-50"
          />
          <button
            onClick={submitAnswer}
            disabled={solved || !answerInput.trim()}
            className="border-l border-terminal-dim px-4 py-2 text-xs uppercase tracking-widest text-terminal-green hover:bg-terminal-green hover:text-background transition-colors disabled:opacity-30"
          >
            SUBMIT
          </button>
        </div>
        <button
          onClick={revealHint}
          disabled={solved || hintsUsed >= 3}
          className="border border-terminal-amber px-4 py-2 text-xs uppercase tracking-widest text-terminal-amber hover:bg-terminal-amber hover:text-background transition-colors disabled:opacity-30"
        >
          HINT [{hintsUsed}/3]
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-xs mb-4">&gt;_ ERROR: {error}</p>
      )}

      {/* Success Overlay */}
      {solved && score && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="border border-terminal-green p-8 max-w-md w-full mx-4">
            <pre className="text-terminal-green text-xs text-center mb-4 select-none">
{`
 ██████╗██╗     ███████╗ █████╗ ██████╗ ███████╗██████╗
██╔════╝██║     ██╔════╝██╔══██╗██╔══██╗██╔════╝██╔══██╗
██║     ██║     █████╗  ███████║██████╔╝█████╗  ██║  ██║
██║     ██║     ██╔══╝  ██╔══██║██╔══██╗██╔══╝  ██║  ██║
╚██████╗███████╗███████╗██║  ██║██║  ██║███████╗██████╔╝
 ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝
`}
            </pre>

            <p className="text-center text-terminal-green text-sm tracking-widest mb-6">
              DAY {level.dayNumber} COMPLETE
            </p>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-terminal-dim">BASE POINTS</span>
                <span className="text-foreground">{level.basePoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-dim">TIME BONUS</span>
                <span className="text-terminal-green">+{score.timeBonus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-dim">TRIES BONUS</span>
                <span className="text-terminal-green">+{score.triesBonus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-dim">CLEAN SOLVE</span>
                <span className="text-terminal-green">+{score.cleanSolveBonus}</span>
              </div>
              {score.hintPenalty > 0 && (
                <div className="flex justify-between">
                  <span className="text-terminal-dim">HINT PENALTY</span>
                  <span className="text-red-500">-{score.hintPenalty}</span>
                </div>
              )}
              <div className="border-t border-terminal-dim pt-2 flex justify-between">
                <span className="text-terminal-amber uppercase tracking-widest">TOTAL</span>
                <span className="text-terminal-amber text-lg">{score.totalPoints} PTS</span>
              </div>
            </div>

            <div className="flex gap-4 text-xs">
              <Link
                href="/levels"
                className="flex-1 border border-terminal-dim px-4 py-2 text-center uppercase tracking-widest text-terminal-dim hover:border-foreground hover:text-foreground transition-colors"
              >
                BACK TO LEVELS
              </Link>
              {level.dayNumber < 20 && (
                <Link
                  href={`/day/${level.dayNumber + 1}`}
                  className="flex-1 border border-terminal-green px-4 py-2 text-center uppercase tracking-widest text-terminal-green hover:bg-terminal-green hover:text-background transition-colors"
                >
                  NEXT DAY &gt;
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
          &lt; BACK TO LEVELS
        </Link>
      </div>
    </div>
  );
}
