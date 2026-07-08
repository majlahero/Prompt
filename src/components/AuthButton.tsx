"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

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
        <span className="text-terminal-green text-xs hidden sm:inline">
          {session.user.name}
        </span>
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
