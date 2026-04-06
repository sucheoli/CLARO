export interface AudioChunk {
  id: string;
  timestamp: number;
  duration: number;
  data: Buffer | ArrayBuffer;
  sampleRate: number;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
}

export interface ContextFrame {
  sessionId: string;
  transcript: TranscriptSegment[];
  keywords: string[];
  topic: string;
  timestamp: number;
}

export interface AISummary {
  id: string;
  sessionId: string;
  content: string;
  keyPoints: string[];
  questions: string[];
  timestamp: number;
  model: string;
}

export interface HelpResponse {
  id: string;
  sessionId: string;
  query: string;
  answer: string;
  references: string[];
  timestamp: number;
}

export interface PipelineResult {
  stage: "capture" | "context" | "ai";
  success: boolean;
  data?: AISummary | HelpResponse | ContextFrame;
  error?: string;
  latency: number;
}

export interface Session {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: "active" | "paused" | "completed";
  transcripts: TranscriptSegment[];
  summaries: AISummary[];
  curriculumPath?: string;
}

export interface SessionStore {
  sessions: Session[];
  currentSessionId: string | null;
}

export interface CaptureConfig {
  sampleRate: number;
  channels: number;
  chunkDurationMs: number;
  deviceId?: string;
}

export interface IPCRequest<T = unknown> {
  requestId: string;
  payload: T;
}

export interface IPCResponse<T = unknown> {
  requestId: string;
  success: boolean;
  data?: T;
  error?: string;
}

export type WindowType = "overlay" | "dashboard";

export interface AppConfig {
  apiKey: string;
  captureConfig: CaptureConfig;
  overlayPosition: { x: number; y: number };
  theme: "light" | "dark";
}
