import OpenAI from "openai";
import { AI_CONFIG } from "../../shared/constants";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  onChunk: (text: string) => void;
}

export interface CompletionOptions {
  messages: ChatMessage[];
  maxTokens?: number;
}

export class OpenAIClient {
  private client: OpenAI;
  private model: string;
  private whisperModel: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.model = AI_CONFIG.MODEL;
    this.whisperModel = AI_CONFIG.WHISPER_MODEL;
  }

  /**
   * Streaming chat completion (GPT-4o)
   */
  async streamCompletion(options: StreamOptions): Promise<string> {
    const { messages, maxTokens = AI_CONFIG.MAX_TOKENS, onChunk } = options;

    let fullText = "";

    const stream = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: maxTokens,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }
    }

    return fullText;
  }

  /**
   * Non-streaming chat completion (GPT-4o)
   */
  async complete(options: CompletionOptions): Promise<string> {
    const { messages, maxTokens = AI_CONFIG.MAX_TOKENS } = options;

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: maxTokens,
      messages,
    });

    return response.choices[0]?.message?.content ?? "";
  }

  /**
   * Speech-to-text using Whisper
   * Accepts a Buffer (PCM/WAV) or a Readable stream
   */
  async transcribe(audioBuffer: Buffer, language = "ko"): Promise<string> {
    // Whisper API requires a file-like object with a name
    const file = new File([new Uint8Array(audioBuffer)], "audio.webm", { type: "audio/webm" });

    const response = await this.client.audio.transcriptions.create({
      model: this.whisperModel,
      file,
      language,
      response_format: "text",
    });

    return response as unknown as string;
  }

  getModel(): string {
    return this.model;
  }
}
