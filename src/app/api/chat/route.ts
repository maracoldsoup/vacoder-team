import { NextRequest, NextResponse } from "next/server";
import { orchestrate, callMember } from "@/lib/orchestrator";
import { TEAM, MemberKey } from "@/lib/personas";

export const maxDuration = 300;

function parseMention(text: string): { key: MemberKey; message: string } | null {
  const match = text.match(/^@(\S+)\s+([\s\S]+)/);
  if (!match) return null;
  const found = Object.values(TEAM).find(
    (m) => m.name.includes(match[1]) || m.key === match[1]
  );
  if (!found) return null;
  return { key: found.key, message: match[2] };
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "메시지를 입력하세요." }, { status: 400 });
  }

  const mention = parseMention(message);

  if (mention) {
    const member = TEAM[mention.key];
    const response = await callMember(mention.key, mention.message, []);
    return NextResponse.json({
      type: "direct",
      member: { key: member.key, name: member.name, emoji: member.emoji, role: member.role },
      content: response,
      memberResults: [],
    });
  }

  // 오케스트레이션 — 팀원별 결과 포함해서 반환
  const memberMessages: Array<{ key: string; name: string; role: string; content: string }> = [];

  const { report } = await orchestrate(message, [], (step, data) => {
    if (step === "member_result" && data && typeof data === "object") {
      const { key, result } = data as { key: MemberKey; result: string };
      const member = TEAM[key];
      if (member) {
        memberMessages.push({ key, name: member.name, role: member.role, content: result });
      }
    }
  });

  return NextResponse.json({
    type: "orchestrated",
    member: { key: "kimdoyoung", name: "김도영 상무", emoji: "🎯", role: "오케스트레이터" },
    content: report,
    memberResults: memberMessages,
  });
}
