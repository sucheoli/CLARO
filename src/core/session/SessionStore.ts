import { Session } from "./Session";
import { AISummary, TranscriptSegment } from "../../shared/types";
import { STORAGE_KEYS } from "../../shared/constants";

// Simple in-memory store (in production, use electron-store for persistence)
export class SessionStore {
  private sessions: Map<string, Session> = new Map();
  private currentSessionId: string | null = null;

  createSession(name: string, curriculumPath?: string): Session {
    const session = new Session(name, curriculumPath);
    this.sessions.set(session.id, session);
    this.currentSessionId = session.id;
    console.log(`[SessionStore] Created session: ${session.id} - ${name}`);
    return session;
  }

  getSession(id: string): Session | null {
    return this.sessions.get(id) ?? null;
  }

  getCurrentSession(): Session | null {
    if (!this.currentSessionId) return null;
    return this.sessions.get(this.currentSessionId) ?? null;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  setCurrentSession(id: string): boolean {
    if (!this.sessions.has(id)) return false;
    this.currentSessionId = id;
    return true;
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.startTime - a.startTime
    );
  }

  addTranscript(sessionId: string, segment: TranscriptSegment): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.addTranscript(segment);
    return true;
  }

  addSummary(sessionId: string, summary: AISummary): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.addSummary(summary);
    return true;
  }

  deleteSession(id: string): boolean {
    if (this.currentSessionId === id) {
      this.currentSessionId = null;
    }
    return this.sessions.delete(id);
  }

  completeSession(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.complete();
    if (this.currentSessionId === id) {
      this.currentSessionId = null;
    }
    return true;
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}
