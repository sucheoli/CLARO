import { v4 as uuidv4 } from "uuid";
import {
  Session as ISession,
  TranscriptSegment,
  AISummary,
} from "../../shared/types";

export class Session implements ISession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: "active" | "paused" | "completed";
  transcripts: TranscriptSegment[];
  summaries: AISummary[];
  curriculumPath?: string;

  constructor(name: string, curriculumPath?: string) {
    this.id = uuidv4();
    this.name = name;
    this.startTime = Date.now();
    this.status = "active";
    this.transcripts = [];
    this.summaries = [];
    this.curriculumPath = curriculumPath;
  }

  addTranscript(segment: TranscriptSegment): void {
    this.transcripts.push(segment);
  }

  addSummary(summary: AISummary): void {
    this.summaries.push(summary);
  }

  pause(): void {
    if (this.status === "active") {
      this.status = "paused";
    }
  }

  resume(): void {
    if (this.status === "paused") {
      this.status = "active";
    }
  }

  complete(): void {
    this.status = "completed";
    this.endTime = Date.now();
  }

  getDurationMs(): number {
    const end = this.endTime ?? Date.now();
    return end - this.startTime;
  }

  getRecentTranscripts(count = 20): TranscriptSegment[] {
    return this.transcripts.slice(-count);
  }

  getLatestSummary(): AISummary | null {
    if (this.summaries.length === 0) return null;
    return this.summaries[this.summaries.length - 1];
  }

  toJSON(): ISession {
    return {
      id: this.id,
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      transcripts: this.transcripts,
      summaries: this.summaries,
      curriculumPath: this.curriculumPath,
    };
  }

  static fromJSON(data: ISession): Session {
    const session = new Session(data.name, data.curriculumPath);
    session.id = data.id;
    session.startTime = data.startTime;
    session.endTime = data.endTime;
    session.status = data.status;
    session.transcripts = data.transcripts;
    session.summaries = data.summaries;
    return session;
  }
}
