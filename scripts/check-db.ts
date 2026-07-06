import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const lv = await prisma.level.count();
  const sp = await prisma.systemPrompt.count();
  const h = await prisma.hint.count();
  console.log(`Levels: ${lv} | SystemPrompts: ${sp} | Hints: ${h}`);
  const all = await prisma.level.findMany({ orderBy: { order: "asc" }, select: { order: true, title: true, basePoints: true, tier: true } });
  for (const l of all) console.log(`  #${l.order} [${l.tier}] ${l.title} (${l.basePoints}pts)`);
}

main().catch((e) => { console.error("ERR", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
