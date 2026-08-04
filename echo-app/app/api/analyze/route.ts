import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import type { AnalyzeInput } from "@/lib/ai/types";

export async function POST(req: NextRequest) {
  let body: AnalyzeInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const provider = getAIProvider();
    const result = await provider.analyzeNetwork(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/analyze]", err);
    const message = err instanceof Error ? err.message : "AI analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
