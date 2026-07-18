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
    } catch {
      /* ignore */
    }
    setSaving(false);
  }

  if (status === "loading") {
    return <span className="text-ash-dim text-xs animate-pulse">...</span>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        {session.user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="w-5 h-5 border border-line"
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
              className="bg-transparent border border-secret px-2 py-0.5 text-xs text-secret outline-none w-28"
              autoFocus
            />
            <button
              onClick={saveName}
              disabled={saving}
              className="text-secret text-xs hover:text-phosphor transition-colors"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setDisplayName(currentName ?? "");
              }}
              className="text-ash-dim text-xs hover:text-breach transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-secret text-xs hidden sm:inline hover:text-phosphor transition-colors cursor-pointer"
            title="Đổi tên hiển thị"
          >
            {currentName ?? session.user.name} ✎
          </button>
        )}
        <button
          onClick={() => signOut()}
          className="border border-line px-3 py-1 text-[0.65rem] uppercase tracking-[.16em] text-ash-dim hover:border-breach hover:text-breach transition-colors"
        >
          Thoát
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="border border-phosphor px-3 py-1 text-[0.65rem] uppercase tracking-[.16em] text-phosphor glow hover:bg-phosphor hover:text-void hover:[text-shadow:none] transition-colors"
    >
      Đăng nhập
    </button>
  );
}
