import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const CLAUDE_CLI = process.env.CLAUDE_CLI_PATH!;

export async function callClaude(
  systemPrompt: string,
  message: string,
  model: "haiku" | "sonnet" | "opus" = "haiku"
): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    CLAUDE_CLI,
    [
      "-p",
      "--model", model,
      "--append-system-prompt", systemPrompt,
      "--output-format", "json",
      "--dangerously-skip-permissions",
      message,
    ],
    { timeout: 60000 }
  );

  if (stderr) console.error("[Claude CLI stderr]", stderr);

  const result = JSON.parse(stdout);
  return result.result ?? result.content ?? stdout;
}
