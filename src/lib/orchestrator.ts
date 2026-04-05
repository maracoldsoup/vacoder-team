import { callClaude } from "./claude";
import { TEAM, TEAM_MEMBERS, MemberKey } from "./personas";

interface OrchestratorPlan {
  members: MemberKey[];
  brief: string;
}

// 1단계: 상무가 어떤 팀원을 투입할지 결정
async function plan(message: string): Promise<OrchestratorPlan> {
  const memberList = TEAM_MEMBERS.map((m) => `${m.key}: ${m.name}(${m.role})`).join(", ");

  const planPrompt = `대표님으로부터 다음 요청이 왔습니다:
"${message}"

아래 팀원 중 이 요청에 필요한 사람을 선택해주세요:
${memberList}

반드시 아래 JSON 형식으로만 응답하세요 (설명 없이):
{"members": ["key1", "key2"], "brief": "팀원들에게 전달할 작업 지시 한 줄"}`;

  const response = await callClaude(
    TEAM["kimdoyoung"].systemPrompt,
    planPrompt,
    "sonnet"
  );

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON not found");
    return JSON.parse(jsonMatch[0]) as OrchestratorPlan;
  } catch {
    // 파싱 실패 시 전체 팀 투입
    return {
      members: TEAM_MEMBERS.map((m) => m.key),
      brief: message,
    };
  }
}

// 2단계: 선택된 팀원들 병렬 호출
async function work(
  plan: OrchestratorPlan,
  originalMessage: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.all(
    plan.members.map(async (key) => {
      const member = TEAM[key];
      if (!member) return;

      const response = await callClaude(
        member.systemPrompt,
        `대표님 요청: "${originalMessage}"\n\n작업 지시: ${plan.brief}\n\n당신의 전문 영역에서 의견을 주세요.`,
        member.model
      );

      results[key] = response;
    })
  );

  return results;
}

// 3단계: 상무가 결과 종합해서 보고
async function review(
  originalMessage: string,
  memberResults: Record<string, string>
): Promise<string> {
  const summaryLines = Object.entries(memberResults)
    .map(([key, result]) => {
      const member = TEAM[key as MemberKey];
      return `[${member?.name}(${member?.role})]\n${result}`;
    })
    .join("\n\n");

  const reviewPrompt = `대표님 원래 요청: "${originalMessage}"

팀원들의 의견:
${summaryLines}

위 내용을 종합해서 대표님께 보고해주세요. 핵심만 추려서, 친근하게.`;

  return await callClaude(
    TEAM["kimdoyoung"].systemPrompt,
    reviewPrompt,
    "sonnet"
  );
}

// 전체 오케스트레이션 실행
export async function orchestrate(
  message: string,
  onProgress?: (step: string, data?: unknown) => void
): Promise<string> {
  onProgress?.("planning");
  const orchPlan = await plan(message);

  onProgress?.("working", orchPlan.members);
  const results = await work(orchPlan, message);

  onProgress?.("reviewing");
  const report = await review(message, results);

  return report;
}

// @멘션 직접 호출
export async function callMember(
  memberKey: MemberKey,
  message: string
): Promise<string> {
  const member = TEAM[memberKey];
  if (!member) throw new Error(`Unknown member: ${memberKey}`);

  return await callClaude(member.systemPrompt, message, member.model);
}
