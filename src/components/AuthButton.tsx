"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.displayName) {
            setCurrentName(data.displayName);
            setDisplayName(data.displayName);
          } else {
            setCurrentName(session.user?.name ?? null);
            setDisplayName(session.user?.name ?? "");
          }
        })
        .catch(() => {});
    }
  }, [session]);

  async function saveName() {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      const data = await res.json();
      if (data.displayName) {
        setCurrentName(data.displayName);
        setEditing(false);
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  if (status === "loading") {
    return (
      <span className="text-terminal-dim text-xs animate-pulse">...</span>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image && (
          <img
            src={session.user.image}
            alt=""
            className="w-5 h-5"
            referrerPolicy="no-referrer"
          />
        )}
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              maxLength={20}
              className="bg-transparent border border-terminal-green px-2 py-0.5 text-xs text-terminal-green outline-none w-28"
              autoFocus
            />
            <button
              onClick={saveName}
              disabled={saving}
              className="text-terminal-green text-xs hover:text-terminal-amber transition-colors"
            >
              ✓
            </button>
            <button
              onClick={() => { setEditing(false); setDisplayName(currentName ?? ""); }}
              className="text-terminal-dim text-xs hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-terminal-green text-xs hidden sm:inline hover:text-terminal-amber transition-colors cursor-pointer"
            title="Đổi tên hiển thị"
          >
            {currentName ?? session.user.name} ✎
          </button>
        )}
        <button
          onClick={() => signOut()}
          className="border border-terminal-dim px-3 py-1 text-[0.65rem] uppercase tracking-widest text-terminal-dim hover:border-red-500 hover:text-red-500 transition-colors"
        >
          THOÁT
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="border border-terminal-green px-3 py-1 text-[0.65rem] uppercase tracking-widest text-terminal-green hover:bg-terminal-green hover:text-background transition-colors"
    >
      ĐĂNG NHẬP
    </button>
  );
}
