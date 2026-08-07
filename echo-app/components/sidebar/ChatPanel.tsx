"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import Card from "@/components/ui/Card";
import type { ChatAction, ChatContext, ChatHistoryMessage } from "@/lib/ai/types";

interface ChatPanelProps {
  context: ChatContext;
  onAction: (action: ChatAction) => void;
}

const GREETING: ChatHistoryMessage = {
  role: "assistant",
  content: 'Hello! Ask me to "reset view", "go to Manila", or anything about the network.',
};

export default function ChatPanel({ context, onAction }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const history = messages;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat failed.");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.action?.type !== "none") onAction(data.action as ChatAction);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? `Error: ${err.message}` : "Something went wrong.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card title="Chat with Map AI" icon={MessageCircle} className="flex flex-shrink-0 flex-col">
      <div className="mb-3 flex h-52 flex-col space-y-2 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto self-end bg-indigo-600 text-white"
                : "mr-auto self-start bg-zinc-800 text-zinc-200"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <div className="self-start text-xs text-zinc-500">Thinking...</div>}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder="Ask the AI..."
          autoComplete="off"
          className="flex-grow rounded-full border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={sending}
          aria-label="Send message"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </Card>
  );
}
