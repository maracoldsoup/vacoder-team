"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const TEAM = [
  { key: "kimdoyoung",  name: "김도영 상무", role: "오케스트레이터" },
  { key: "kimhoryeong", name: "김호령",       role: "수석 개발자"   },
  { key: "kimminji",    name: "김민지",       role: "개발자"        },
  { key: "sungyoungtag",name: "성영탁",       role: "전략 기획자"   },
  { key: "oller",       name: "올러",         role: "QA 엔지니어"   },
  { key: "choewonjun",  name: "최원준",       role: "데이터 분석가" },
  { key: "neil",        name: "네일",         role: "AI 리서처"     },
  { key: "hanjunsu",    name: "한준수",       role: "백엔드/인프라" },
  { key: "leehaeun",    name: "이하은",       role: "수석 디자이너" },
  { key: "choeyeseul",  name: "최예슬",       role: "디자이너"      },
  { key: "parksohyun",  name: "박소현",       role: "콘텐츠/마케터" },
];

type TeamMember = (typeof TEAM)[number];

interface Message {
  id: string;
  from: "user" | "team";
  member?: TeamMember;
  content: string;
  loading?: boolean;
}

function Avatar({ member, size = "md" }: { member: TeamMember; size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 28 : size === "lg" ? 40 : 32;
  return (
    <div
      className="rounded-full overflow-hidden shrink-0 shadow-sm"
      style={{ width: px, height: px }}
    >
      <Image
        src={`/avatars/${member.key}.svg`}
        alt={member.name}
        width={px}
        height={px}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      from: "team",
      member: TEAM[0],
      content: "대표님, 안녕하세요! 업무 지시 주시면 팀을 바로 투입하겠습니다.\n\n팀원에게 직접 말하려면 @이름 으로 시작해주세요.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMemberClick = (member: TeamMember) => {
    if (member.key === "kimdoyoung") {
      setInput("");
      setSelectedMember(null);
    } else {
      setInput(`@${member.name} `);
      setSelectedMember(member);
      inputRef.current?.focus();
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), from: "user", content: text },
      { id: "loading", from: "team", member: TEAM[0], content: "팀을 구성하고 있습니다...", loading: true },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const responseMember = TEAM.find((m) => m.key === data.member?.key) ?? TEAM[0];

      // 팀원별 중간 결과 + 상무 최종 보고를 순서대로 표시
      const newMsgs: Message[] = [];
      if (data.memberResults?.length) {
        for (const r of data.memberResults) {
          const m = TEAM.find((t) => t.key === r.key) ?? TEAM[0];
          newMsgs.push({ id: `${Date.now()}-${r.key}`, from: "team", member: m, content: r.content });
        }
      }
      newMsgs.push({ id: Date.now().toString(), from: "team", member: responseMember, content: data.content });

      setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(newMsgs));
    } catch {
      setMessages((prev) =>
        prev.filter((m) => m.id !== "loading").concat({
          id: Date.now().toString(),
          from: "team",
          member: TEAM[0],
          content: "오류가 발생했습니다. 다시 시도해주세요.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const activeMember = selectedMember ?? TEAM[0];

  return (
    <div className="flex h-screen bg-[#1c1c1e] text-white overflow-hidden">
      {/* 사이드바 */}
      <div className="w-64 bg-[#2c2c2e] flex flex-col border-r border-white/10 shrink-0">
        <div className="px-4 py-5 border-b border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-widest font-medium">Vacoder</p>
          <p className="text-base font-semibold mt-0.5">AI 드림팀</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => handleMemberClick(TEAM[0])}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${!selectedMember ? "bg-[#3a3a3c]" : "hover:bg-white/5"}`}
          >
            <Avatar member={TEAM[0]} />
            <div className="text-left">
              <p className="font-medium">{TEAM[0].name}</p>
              <p className="text-xs text-white/40">{TEAM[0].role}</p>
            </div>
          </button>

          <div className="px-4 pt-4 pb-1">
            <p className="text-xs text-white/30 uppercase tracking-widest">팀원</p>
          </div>

          {TEAM.slice(1).map((m) => (
            <button
              key={m.key}
              onClick={() => handleMemberClick(m)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${selectedMember?.key === m.key ? "bg-[#3a3a3c]" : "hover:bg-white/5"}`}
            >
              <Avatar member={m} />
              <div className="text-left">
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-white/40">{m.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 채팅 */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="px-6 py-3.5 border-b border-white/10 flex items-center gap-3">
          <Avatar member={activeMember} size="lg" />
          <div>
            <p className="font-semibold text-sm">{activeMember.name}</p>
            <p className="text-xs text-white/40">{activeMember.role}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.from === "team" && msg.member && (
                <Avatar member={msg.member} size="sm" />
              )}
              <div className={`max-w-[70%] flex flex-col gap-1 ${msg.from === "user" ? "items-end" : "items-start"}`}>
                {msg.from === "team" && (
                  <p className="text-xs text-white/40 px-1">{msg.member?.name}</p>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.from === "user"
                      ? "bg-[#0a84ff] text-white rounded-br-sm"
                      : msg.loading
                      ? "bg-[#2c2c2e] text-white/40 rounded-bl-sm animate-pulse"
                      : "bg-[#2c2c2e] text-white rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-end gap-2 bg-[#2c2c2e] rounded-2xl px-4 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={selectedMember ? `@${selectedMember.name}에게 메시지...` : "업무 지시 또는 @이름 으로 직접 호출..."}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder-white/30 max-h-32 min-h-[20px]"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-7 h-7 rounded-full bg-[#0a84ff] flex items-center justify-center disabled:opacity-30 shrink-0 mb-0.5 transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 20V4M5 11l7-7 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-white/20 mt-2">Enter 전송 · Shift+Enter 줄바꿈</p>
        </div>
      </div>
    </div>
  );
}
