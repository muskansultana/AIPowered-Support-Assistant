import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

export class AIService {
  private client: GoogleGenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not set");
    }

    this.client = new GoogleGenAI({ apiKey });

    this.model = process.env.GOOGLE_MODEL || "gemini-1.5-flash";
    this.maxTokens = parseInt(process.env.MAX_TOKENS || "2000");
    this.temperature = parseFloat(process.env.TEMPERATURE || "0.7");

    console.log("Using Gemini model:", this.model);
  }

  private buildSystemPrompt(documentsContext: string): string {
    return `You are a helpful support assistant.

You must ONLY answer using the documentation below.

DOCUMENTATION:
${documentsContext}

STRICT RULES:
1. Only use documentation above.
2. If answer not found, respond EXACTLY:
"Sorry, I don't have information about that."
3. Do NOT hallucinate.
4. Do NOT use external knowledge.`;
  }

  private formatConversationHistory(messages: Message[]): string {
    if (!messages.length) return "";
    return messages
      .map((m) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n");
  }

  async generateResponse(
    userMessage: string,
    documentsContext: string,
    conversationHistory: Message[] = []
  ): Promise<{ reply: string; tokensUsed?: number }> {
    try {
      const systemPrompt = this.buildSystemPrompt(documentsContext);

      const history = conversationHistory.length
        ? `\n\nConversation History:\n${this.formatConversationHistory(
            conversationHistory
          )}\n`
        : "";

      const fullPrompt = `${systemPrompt}${history}

User Question:
${userMessage}

Assistant Response:`;

      const response = await this.client.models.generateContent({
        model: this.model,
        contents: fullPrompt,
        config: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
        },
      });

      return {
        reply: response.text?.trim() || "",
        tokensUsed: response.usageMetadata?.totalTokenCount,
      };
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  async *streamResponse(
    userMessage: string,
    documentsContext: string,
    conversationHistory: Message[] = []
  ): AsyncGenerator<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(documentsContext);

      const history = conversationHistory.length
        ? `\n\nConversation History:\n${this.formatConversationHistory(
            conversationHistory
          )}\n`
        : "";

      const fullPrompt = `${systemPrompt}${history}

User Question:
${userMessage}

Assistant Response:`;

      const stream = await this.client.models.generateContentStream({
        model: this.model,
        contents: fullPrompt,
        config: {
          maxOutputTokens: this.maxTokens,
          temperature: this.temperature,
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) yield chunk.text;
      }
    } catch (error: any) {
      console.error("Gemini Streaming Error:", error);
      throw new Error(`Failed to stream AI response: ${error.message}`);
    }
  }
}