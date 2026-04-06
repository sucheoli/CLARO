import { TranscriptSegment, ContextFrame } from "../../shared/types";
import { v4 as uuidv4 } from "uuid";

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "can", "to", "of", "in", "on", "at",
  "by", "for", "with", "about", "as", "into", "through", "during", "before",
  "after", "above", "below", "from", "up", "down", "out", "off", "over",
  "under", "again", "then", "once", "and", "but", "or", "so", "yet",
  "both", "either", "not", "no", "nor", "just", "this", "that", "these",
  "those", "it", "its", "i", "we", "you", "he", "she", "they",
]);

export class ContextBuilder {
  private readonly maxTranscriptLength = 4000; // characters
  private readonly maxKeywords = 10;

  buildContext(
    sessionId: string,
    transcripts: TranscriptSegment[]
  ): ContextFrame {
    const combinedText = transcripts.map((t) => t.text).join(" ");
    const keywords = this.extractKeywords(combinedText);
    const topic = this.inferTopic(combinedText, keywords);

    return {
      sessionId,
      transcript: transcripts,
      keywords,
      topic,
      timestamp: Date.now(),
    };
  }

  formatForPrompt(context: ContextFrame): string {
    const transcriptText = context.transcript
      .slice(-20) // Last 20 segments
      .map((t) => t.text)
      .join(" ")
      .slice(-this.maxTranscriptLength);

    return `Topic: ${context.topic}
Keywords: ${context.keywords.join(", ")}
Recent transcript:
${transcriptText}`;
  }

  buildSummaryPrompt(context: ContextFrame): string {
    return `You are an AI learning assistant helping students understand lecture content.

Based on the following lecture transcript, provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Potential follow-up questions a student might have (2-3 questions)

${this.formatForPrompt(context)}

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "questions": ["...", "..."]
}`;
  }

  /**
   * 수강생이 막혔을 때 지금 강의 맥락을 파악해 따라할 수 있는 단계별 가이드 생성
   */
  buildGuidePrompt(context: ContextFrame): string {
    return `당신은 강의 보조 AI입니다. 수강생이 강의를 따라가지 못해 도움을 요청했습니다.

아래는 방금 강의에서 진행된 내용입니다:
${this.formatForPrompt(context)}

수강생이 지금 당장 따라할 수 있도록, 아래 형식의 JSON으로 응답하세요.
- 지금 강사가 무엇을 하고 있는지 한 문장으로 설명
- 수강생이 지금 해야 할 일을 순서대로 3~5단계로 안내 (매우 구체적이고 쉽게)
- 이 단계를 완료하면 무엇이 되는지 한 문장으로 설명

{
  "currentAction": "지금 강사님은 [X]을 하고 있습니다.",
  "steps": [
    "1. [아주 구체적인 행동]",
    "2. [아주 구체적인 행동]",
    "3. [아주 구체적인 행동]"
  ],
  "result": "이 단계를 완료하면 [Y] 상태가 됩니다."
}`;
  }

  buildHelpPrompt(context: ContextFrame, query: string): string {
    return `You are an AI learning assistant. A student is asking a question about the current lecture.

Lecture context:
${this.formatForPrompt(context)}

Student's question: ${query}

Provide a clear, helpful answer that:
- Directly addresses the question
- References relevant parts of the lecture if applicable
- Suggests additional resources or related topics when helpful

Keep your answer concise but complete.`;
  }

  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word));

    const frequency = new Map<string, number>();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.maxKeywords)
      .map(([word]) => word);
  }

  private inferTopic(text: string, keywords: string[]): string {
    if (keywords.length === 0) return "General Discussion";

    // Simple topic inference: capitalize and join top 3 keywords
    return keywords
      .slice(0, 3)
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      .join(", ");
  }
}
