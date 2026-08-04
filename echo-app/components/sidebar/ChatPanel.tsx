"use client";

import { useState, type FormEvent } from "react";
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
    <div className="mt-auto flex flex-shrink-0 flex-col rounded-lg bg-gray-700 p-4">
      <h2 className="mb-3 border-b border-gray-600 pb-2 text-lg font-semibold">
        Chat with Map AI
      </h2>
      <div className="mb-4 flex h-52 flex-col space-y-2 overflow-y-auto pr-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 ${
              m.role === "user"
                ? "ml-auto self-end bg-blue-600 text-white"
                : "mr-auto self-start bg-gray-600 text-gray-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <div className="self-start text-sm text-gray-400">Thinking...</div>}
      </div>
      <form onSubmit={handleSubmit} className="mt-auto flex items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder="Ask the AI..."
          autoComplete="off"
          className="flex-grow rounded-l-md border-gray-600 bg-gray-800 p-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-r-md bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
