# CLAUDE.md — Rules for "Phá Prompt" Project

## Project Overview
Web game "Phá Prompt" — Prompt Injection CTF. Người chơi dụ AI chatbot PIP tiết lộ bí mật.
Tech: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Prisma/SQLite + NextAuth v5 + OpenAI.

## Code Standards
- TypeScript strict mode
- Use `src/` directory structure (App Router)
- Tailwind for ALL styling — NO separate CSS files
- Font: JetBrains Mono (monospace)
- Theme: dark terminal/hacker style (bg-black/gray-900, text-green-400/white)
- 2-space indentation
- Components: PascalCase. Utilities: camelCase.
- All API routes in `src/app/api/`
- Server components by default. 'use client' only when needed.

## Key Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npx prisma db push` — sync schema
- `npx prisma db seed` — seed levels
- `npx prisma studio` — visual DB browser

## Architecture Rules
- System prompts and secrets are SERVER-ONLY — NEVER sent to client.
- All scoring logic runs on the SERVER — client cannot be trusted.
- LLM calls happen ONLY in API routes — never in client components.
- Use Prisma for all DB access.
- Rate-limit chat API (simple in-memory counter for MVP).

## UI Rules
- Terminal/hacker aesthetic: dark bg, monospace font, green/amber accents
- ASCII art for headers/banners
- Blinking cursor effect on input fields
- Use `>_` prefix for user messages, `PIP >` for AI responses
- ALL CAPS for buttons and headings
- Minimal, no rounded corners (sharp edges = hacker feel)

## Do NOT
- Do NOT expose system prompts or secrets in client bundle
- Do NOT use any CSS framework other than Tailwind
- Do NOT create separate CSS files
- Do NOT commit .env files
- Do NOT install unnecessary dependencies
