import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 40;

export async function loadHistory(chatId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("vacoder_chat_history")
    .select("role, content")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(MAX_MESSAGES);

  if (error || !data) return [];
  return data as ChatMessage[];
}

export async function appendHistory(
  chatId: string,
  userMessage: string,
  assistantMessage: string
): Promise<void> {
  await supabase.from("vacoder_chat_history").insert([
    { chat_id: chatId, role: "user", content: userMessage },
    { chat_id: chatId, role: "assistant", content: assistantMessage },
  ]);

  // MAX_MESSAGES 초과 시 오래된 것 정리
  const { data } = await supabase
    .from("vacoder_chat_history")
    .select("id")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (data && data.length > MAX_MESSAGES) {
    const toDelete = data.slice(0, data.length - MAX_MESSAGES).map((r) => r.id);
    await supabase.from("vacoder_chat_history").delete().in("id", toDelete);
  }
}

export async function clearHistory(chatId: string): Promise<void> {
  await supabase.from("vacoder_chat_history").delete().eq("chat_id", chatId);
}
