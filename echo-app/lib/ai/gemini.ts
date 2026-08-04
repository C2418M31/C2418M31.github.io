import { GoogleGenerativeAI } from "@google/generative-ai";
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

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env.GEMINI_MODEL || "gemini-flash-latest";
  }

  private async generate(prompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const result = await model.generateContent(prompt);
    return result.response.text();
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
