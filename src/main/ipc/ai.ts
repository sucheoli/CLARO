import { ipcMain, BrowserWindow } from "electron";
import { Pipeline } from "../../core/ai/Pipeline";
import { SessionStore } from "../../core/session/SessionStore";
import { AudioCapture } from "../../core/capture/AudioCapture";
import { IPC_CHANNELS, DEFAULT_CAPTURE_CONFIG } from "../../shared/constants";
import { TranscriptSegment } from "../../shared/types";

let pipeline: Pipeline | null = null;
const sessionStore = new SessionStore();

// 앱 시작 시 자동으로 캡처를 시작하는 공유 인스턴스
let sharedCapture: AudioCapture | null = null;

export function startAutoCapture(): void {
  if (sharedCapture?.isRecording()) return;
  sharedCapture = new AudioCapture({
    sampleRate: DEFAULT_CAPTURE_CONFIG.SAMPLE_RATE,
    channels: DEFAULT_CAPTURE_CONFIG.CHANNELS,
    chunkDurationMs: DEFAULT_CAPTURE_CONFIG.CHUNK_DURATION_MS,
  });
  sharedCapture.start().catch((e) => console.error("[AutoCapture] start failed:", e));
  console.log("[AutoCapture] Background capture started");
}

export function getSharedCapture(): AudioCapture | null {
  return sharedCapture;
}

export function registerAIHandlers(
  overlayWindow: BrowserWindow,
  dashboardWindow: BrowserWindow
): void {
  // Initialize pipeline lazily
  const getPipeline = (): Pipeline => {
    if (!pipeline) {
      const apiKey = process.env.OPENAI_API_KEY ?? "";
      pipeline = new Pipeline(apiKey);
    }
    return pipeline;
  };

  // Process transcript through full pipeline
  ipcMain.handle(
    IPC_CHANNELS.AI_PROCESS,
    async (_event, transcripts: TranscriptSegment[]) => {
      try {
        const p = getPipeline();
        const currentSessionId = sessionStore.getCurrentSessionId();

        if (!currentSessionId) {
          return { success: false, error: "No active session" };
        }

        const result = await p.process(currentSessionId, transcripts);
        return { success: true, data: result };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[AI IPC] Pipeline process failed:", message);
        return { success: false, error: message };
      }
    }
  );

  // Generate summary with streaming
  ipcMain.handle(
    IPC_CHANNELS.AI_SUMMARY,
    async (_event, transcripts: TranscriptSegment[]) => {
      try {
        const p = getPipeline();
        const currentSessionId = sessionStore.getCurrentSessionId();

        if (!currentSessionId) {
          return { success: false, error: "No active session" };
        }

        const summary = await p.summarize(
          currentSessionId,
          transcripts,
          (chunk) => {
            // Stream partial content to renderer
            if (!overlayWindow.isDestroyed()) {
              overlayWindow.webContents.send(IPC_CHANNELS.AI_STREAM, chunk);
            }
          }
        );

        if (!overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send(IPC_CHANNELS.AI_STREAM_END, summary);
        }

        // Update session store
        sessionStore.addSummary(currentSessionId, summary);

        return { success: true, data: summary };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[AI IPC] Summary failed:", message);
        return { success: false, error: message };
      }
    }
  );

  // Answer a specific help question
  ipcMain.handle(
    IPC_CHANNELS.AI_HELP,
    async (_event, query: string) => {
      try {
        const p = getPipeline();
        const currentSessionId = sessionStore.getCurrentSessionId();

        if (!currentSessionId) {
          return { success: false, error: "No active session" };
        }

        const response = await p.help(currentSessionId, query, (chunk) => {
          if (!overlayWindow.isDestroyed()) {
            overlayWindow.webContents.send(IPC_CHANNELS.AI_STREAM, chunk);
          }
        });

        if (!overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send(IPC_CHANNELS.AI_STREAM_END, response);
        }

        return { success: true, data: response };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[AI IPC] Help request failed:", message);
        return { success: false, error: message };
      }
    }
  );

  // Session management handlers
  ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, async (_event, name: string) => {
    const session = sessionStore.createSession(name);
    return { success: true, data: session };
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, () => {
    return { success: true, data: sessionStore.getAllSessions() };
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_GET, (_event, id: string) => {
    const session = sessionStore.getSession(id);
    if (!session) {
      return { success: false, error: "Session not found" };
    }
    return { success: true, data: session };
  });

  ipcMain.handle(IPC_CHANNELS.SESSION_CURRENT, () => {
    const id = sessionStore.getCurrentSessionId();
    if (!id) {
      return { success: false, error: "No active session" };
    }
    const session = sessionStore.getSession(id);
    return { success: true, data: session };
  });

  ipcMain.handle(
    IPC_CHANNELS.SESSION_DELETE,
    (_event, id: string) => {
      sessionStore.deleteSession(id);
      return { success: true };
    }
  );
}
