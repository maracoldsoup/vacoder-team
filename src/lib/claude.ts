import type { ChatMessage } from "./history";

const MODEL_MAP = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
} as const;

const OAUTH_TOKEN = process.env.CLAUDE_OAUTH_TOKEN!;

export async function callClaude(
  systemPrompt: string,
  message: string,
  model: "haiku" | "sonnet" | "opus" = "haiku",
  history: ChatMessage[] = []
): Promise<string> {
  const messages: ChatMessage[] = [
    ...history,
    { role: "user", content: message },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OAUTH_TOKEN}`,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "oauth-2025-04-20",
    },
    body: JSON.stringify({
      model: MODEL_MAP[model],
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const block = data.content?.[0];
  if (!block || block.type !== "text") throw new Error("unexpected response");
  return block.text;
}
