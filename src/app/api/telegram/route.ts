import { NextRequest, NextResponse } from "next/server";
import { orchestrate, callMember } from "@/lib/orchestrator";
import { TEAM, MemberKey } from "@/lib/personas";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID!;
const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId: number | string, text: string): Promise<number> {
  const res = await fetch(`${TG}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const data = await res.json();
  return data.result?.message_id;
}

async function editMessage(chatId: number | string, messageId: number, text: string) {
  await fetch(`${TG}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }),
  });
}

function parseMention(text: string): { key: MemberKey; message: string } | null {
  const match = text.match(/^@(\S+)\s+([\s\S]+)/);
  if (!match) return null;

  const found = Object.values(TEAM).find(
    (m) => m.name.includes(match[1]) || m.key === match[1]
  );
  if (!found) return null;
  return { key: found.key, message: match[2] };
}

async function handleMessage(chatId: string, text: string) {
  console.log("[Bot] message:", text, "from:", chatId);

  if (chatId !== OWNER_CHAT_ID) {
    await sendMessage(chatId, "접근 권한이 없습니다.");
    return;
  }

  if (text === "/start") {
    await sendMessage(chatId, `Vacoder AI 팀에 오신 것을 환영합니다, 대표님!\n\n사용법:\n• 업무 지시 → 김도영 상무가 팀 투입\n• @이름 메시지 → 팀원에게 직접\n• /team → 팀원 목록`);
    return;
  }

  if (text === "/team") {
    const list = Object.values(TEAM).map((m) => `${m.emoji} ${m.name} — ${m.role}`).join("\n");
    await sendMessage(chatId, `Vacoder 드림팀\n\n${list}`);
    return;
  }

  const mention = parseMention(text);
  if (mention) {
    const member = TEAM[mention.key];
    const msgId = await sendMessage(chatId, `${member.emoji} ${member.name}에게 전달 중...`);
    try {
      const response = await callMember(mention.key, mention.message);
      await editMessage(chatId, msgId, `${member.emoji} ${member.name}\n\n${response}`);
    } catch (err) {
      await editMessage(chatId, msgId, `오류: ${String(err)}`);
    }
    return;
  }

  // 일반 메시지 → 오케스트레이션
  const msgId = await sendMessage(chatId, "🎯 김도영 상무가 팀을 구성하고 있습니다...");

  try {
    const report = await orchestrate(text, async (step, data) => {
      if (step === "working" && Array.isArray(data)) {
        const names = (data as MemberKey[]).map((k) => TEAM[k]?.name).filter(Boolean).join(", ");
        await editMessage(chatId, msgId, `⚙️ 작업 중: ${names}`);
      } else if (step === "reviewing") {
        await editMessage(chatId, msgId, "📋 김도영 상무가 결과를 종합하고 있습니다...");
      }
    });

    await editMessage(chatId, msgId, `🎯 김도영 상무\n\n${report}`);
  } catch (err) {
    await editMessage(chatId, msgId, `오류: ${String(err)}`);
  }
}

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;

    if (message?.text) {
      const chatId = String(message.chat.id);
      // 비동기로 처리 (텔레그램에 즉시 200 반환)
      handleMessage(chatId, message.text).catch((err) =>
        console.error("[Handler Error]", err)
      );
    }
  } catch (err) {
    console.error("[Parse Error]", err);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ status: "Vacoder Telegram Bot is running" });
}
