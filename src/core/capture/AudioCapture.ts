import { EventEmitter } from "events";
import { CaptureConfig, AudioChunk } from "../../shared/types";
import { v4 as uuidv4 } from "uuid";

const ROLLING_BUFFER_SECONDS = 120; // 최근 2분 보관

export class AudioCapture extends EventEmitter {
  private config: CaptureConfig;
  private recording = false;
  private chunkInterval: NodeJS.Timeout | null = null;
  private rollingBuffer: AudioChunk[] = [];

  constructor(config: CaptureConfig) {
    super();
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.recording) {
      throw new Error("AudioCapture is already recording");
    }

    this.recording = true;
    this.rollingBuffer = [];
    console.log("[AudioCapture] Starting continuous capture");

    this.chunkInterval = setInterval(() => {
      if (this.recording) {
        const chunk = this.createSimulatedChunk();
        this.addToBuffer(chunk);
        this.emit("chunk", chunk);
      }
    }, this.config.chunkDurationMs);

    this.emit("started");
  }

  async stop(): Promise<void> {
    if (!this.recording) return;

    this.recording = false;
    if (this.chunkInterval) {
      clearInterval(this.chunkInterval);
      this.chunkInterval = null;
    }

    this.emit("stopped");
    console.log("[AudioCapture] Capture stopped");
  }

  /**
   * 최근 N초 분량의 청크를 반환 (버튼 클릭 시 AI에 전달할 컨텍스트)
   */
  getRecentChunks(seconds: number = 60): AudioChunk[] {
    const cutoff = Date.now() - seconds * 1000;
    return this.rollingBuffer.filter((c) => c.timestamp >= cutoff);
  }

  isRecording(): boolean {
    return this.recording;
  }

  getConfig(): CaptureConfig {
    return { ...this.config };
  }

  private addToBuffer(chunk: AudioChunk): void {
    this.rollingBuffer.push(chunk);
    // 오래된 청크 제거 (ROLLING_BUFFER_SECONDS 초과분)
    const cutoff = Date.now() - ROLLING_BUFFER_SECONDS * 1000;
    while (this.rollingBuffer.length > 0 && this.rollingBuffer[0].timestamp < cutoff) {
      this.rollingBuffer.shift();
    }
  }

  private createSimulatedChunk(): AudioChunk {
    const samplesPerChunk = (this.config.sampleRate * this.config.chunkDurationMs) / 1000;
    const buffer = Buffer.alloc(samplesPerChunk * 2);
    buffer.fill(0);

    return {
      id: uuidv4(),
      timestamp: Date.now(),
      duration: this.config.chunkDurationMs,
      data: buffer,
      sampleRate: this.config.sampleRate,
    };
  }
}
