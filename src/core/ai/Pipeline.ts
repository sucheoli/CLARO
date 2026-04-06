import { OpenAIClient } from "./OpenAIClient";
import { ContextBuilder } from "./ContextBuilder";
import {
  TranscriptSegment,
  AISummary,
  HelpResponse,
  PipelineResult,
  ContextFrame,
} from "../../shared/types";
import { AI_CONFIG, PIPELINE_STAGES } from "../../shared/constants";
import { v4 as uuidv4 } from "uuid";

interface SummaryJSON {
  summary: string;
  keyPoints: string[];
  questions: string[];
}

interface GuideJSON {
  currentAction: string;
  steps: string[];
  result: string;
}

export interface GuideResponse {
  id: string;
  sessionId: string;
  currentAction: string;
  steps: string[];
  result: string;
  timestamp: number;
  model: string;
}

export class Pipeline {
  private openaiClient: OpenAIClient;
  private contextBuilder: ContextBuilder;

  constructor(apiKey: string) {
    this.openaiClient = new OpenAIClient(apiKey);
    this.contextBuilder = new ContextBuilder();
  }

  /**
   * Stage 1: Capture -> Stage 2: Context -> Stage 3: AI
   * Full pipeline processing for a batch of transcripts
   */
  async process(
    sessionId: string,
    transcripts: TranscriptSegment[]
  ): Promise<PipelineResult> {
    const startTime = Date.now();

    try {
      // Stage 2: Build context from transcripts
      const context = this.contextBuilder.buildContext(sessionId, transcripts);

      // Stage 3: Generate AI summary
      const summary = await this.summarize(sessionId, transcripts);

      return {
        stage: PIPELINE_STAGES.AI,
        success: true,
        data: summary,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pipeline error";
      console.error("[Pipeline] Processing failed:", message);

      return {
        stage: PIPELINE_STAGES.AI,
        success: false,
        error: message,
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate a structured summary of the transcript
   */
  async summarize(
    sessionId: string,
    transcripts: TranscriptSegment[],
    onChunk?: (chunk: string) => void
  ): Promise<AISummary> {
    // Stage 2: Build context
    const context = this.contextBuilder.buildContext(sessionId, transcripts);
    const prompt = this.contextBuilder.buildSummaryPrompt(context);

    let rawResponse: string;

    // Stage 3: Call OpenAI API
    if (onChunk) {
      rawResponse = await this.openaiClient.streamCompletion({
        messages: [{ role: "user", content: prompt }],
        maxTokens: AI_CONFIG.MAX_TOKENS,
        onChunk,
      });
    } else {
      rawResponse = await this.openaiClient.complete({
        messages: [{ role: "user", content: prompt }],
        maxTokens: AI_CONFIG.MAX_TOKENS,
      });
    }

    const parsed = this.parseSummaryResponse(rawResponse);

    return {
      id: uuidv4(),
      sessionId,
      content: parsed.summary,
      keyPoints: parsed.keyPoints,
      questions: parsed.questions,
      timestamp: Date.now(),
      model: this.openaiClient.getModel(),
    };
  }

  /**
   * Answer a specific question with context from the session
   */
  async help(
    sessionId: string,
    query: string,
    onChunk?: (chunk: string) => void
  ): Promise<HelpResponse> {
    // Build a lightweight context for the help request
    const dummyContext: ContextFrame = {
      sessionId,
      transcript: [],
      keywords: [],
      topic: "Current Session",
      timestamp: Date.now(),
    };

    const prompt = this.contextBuilder.buildHelpPrompt(dummyContext, query);

    let answer: string;

    if (onChunk) {
      answer = await this.openaiClient.streamCompletion({
        messages: [{ role: "user", content: prompt }],
        maxTokens: AI_CONFIG.MAX_TOKENS,
        onChunk,
      });
    } else {
      answer = await this.openaiClient.complete({
        messages: [{ role: "user", content: prompt }],
        maxTokens: AI_CONFIG.MAX_TOKENS,
      });
    }

    return {
      id: uuidv4(),
      sessionId,
      query,
      answer,
      references: [],
      timestamp: Date.now(),
    };
  }

  /**
   * 버튼 클릭 시 호출 — 최근 음성 컨텍스트를 보고 단계별 가이드 자동 생성
   */
  async generateGuide(
    sessionId: string,
    transcripts: TranscriptSegment[],
    onChunk?: (chunk: string) => void
  ): Promise<GuideResponse> {
    const context = this.contextBuilder.buildContext(sessionId, transcripts);
    const prompt = this.contextBuilder.buildGuidePrompt(context);

    let rawResponse: string;

    if (onChunk) {
      rawResponse = await this.openaiClient.streamCompletion({
        messages: [{ role: "user", content: prompt }],
        maxTokens: AI_CONFIG.MAX_TOKENS,
        onChunk,
      });
    } else {
      rawResponse = await this.openaiClient.complete({
        messages: [{ role: "user", content: prompt }],
        maxTokens: AI_CONFIG.MAX_TOKENS,
      });
    }

    const parsed = this.parseGuideResponse(rawResponse);

    return {
      id: uuidv4(),
      sessionId,
      ...parsed,
      timestamp: Date.now(),
      model: this.openaiClient.getModel(),
    };
  }

  private parseGuideResponse(raw: string): { currentAction: string; steps: string[]; result: string } {
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : raw;
      const parsed = JSON.parse(jsonStr.trim()) as { currentAction: string; steps: string[]; result: string };
      return {
        currentAction: parsed.currentAction ?? "강의 내용을 분석 중입니다.",
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        result: parsed.result ?? "",
      };
    } catch {
      return {
        currentAction: "강의 내용을 파악했습니다.",
        steps: [raw.slice(0, 300)],
        result: "",
      };
    }
  }

  private parseSummaryResponse(raw: string): SummaryJSON {
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ??
        raw.match(/(\{[\s\S]*\})/);

      const jsonStr = jsonMatch ? jsonMatch[1] : raw;
      const parsed = JSON.parse(jsonStr.trim()) as SummaryJSON;

      return {
        summary: parsed.summary ?? "No summary available",
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      };
    } catch {
      // Fallback: treat entire response as summary
      return {
        summary: raw.slice(0, 500),
        keyPoints: [],
        questions: [],
      };
    }
  }
}
