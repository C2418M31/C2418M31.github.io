import Anthropic from "@anthropic-ai/sdk";
import { buildAnalyzePrompt, buildChatPrompt, buildQueryPrompt } from "./prompts";
import { analyzeResultSchema, chatResultSchema, queryFilterSchema } from "./schema";
import { extractJson } from "./parse-json";
import type {
  AIProvider,
  AnalyzeInput,
  AnalyzeResult,
  ChatContext,
  ChatHistoryMessage,
  ChatResult,
  QueryFilter,
} from "./types";

export class ClaudeProvider implements AIProvider {
  name = "claude";
  private client: Anthropic;
  private modelName: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
    this.client = new Anthropic({ apiKey });
    this.modelName = process.env.CLAUDE_MODEL || "claude-sonnet-5";
  }

  private async generate(prompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text : "";
  }

  async analyzeNetwork(input: AnalyzeInput): Promise<AnalyzeResult> {
    const text = await this.generate(buildAnalyzePrompt(input));
    return analyzeResultSchema.parse(extractJson(text));
  }

  async chat(
    message: string,
    history: ChatHistoryMessage[],
    context: ChatContext,
  ): Promise<ChatResult> {
    const text = await this.generate(buildChatPrompt(message, history, context));
    return chatResultSchema.parse(extractJson(text));
  }

  async parseQuery(query: string): Promise<QueryFilter> {
    const text = await this.generate(buildQueryPrompt(query));
    return queryFilterSchema.parse(extractJson(text));
  }
}
