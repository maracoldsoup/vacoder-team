import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";

export async function GET() {
  try {
    const result = await callClaude(
      "당신은 Vacoder AI 팀입니다.",
      "안녕하세요, 한 줄로 짧게 인사해주세요.",
      "haiku"
    );
    return NextResponse.json({ ok: true, response: result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
