import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import type { ChatContext, ChatHistoryMessage } from "@/lib/ai/types";

interface ChatRequestBody {
  message: string;
  history: ChatHistoryMessage[];
  context: ChatContext;
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  try {
    const provider = getAIProvider();
    const result = await provider.chat(body.message, body.history ?? [], body.context);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/chat]", err);
    const message = err instanceof Error ? err.message : "Chat failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
