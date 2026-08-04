import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";

export async function POST(req: NextRequest) {
  let body: { query: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.query?.trim()) {
    return NextResponse.json({ error: "query is required." }, { status: 400 });
  }

  try {
    const provider = getAIProvider();
    const result = await provider.parseQuery(body.query);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/query]", err);
    const message = err instanceof Error ? err.message : "Query parsing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
