import { ipcMain, BrowserWindow } from "electron";
import { AudioCapture } from "../../core/capture/AudioCapture";
import { IPC_CHANNELS, DEFAULT_CAPTURE_CONFIG } from "../../shared/constants";
import { CaptureConfig } from "../../shared/types";

let audioCapture: AudioCapture | null = null;

export function registerCaptureHandlers(overlayWindow: BrowserWindow): void {
  ipcMain.handle(
    IPC_CHANNELS.CAPTURE_START,
    async (_event, config?: Partial<CaptureConfig>) => {
      try {
        const captureConfig: CaptureConfig = {
          sampleRate: config?.sampleRate ?? DEFAULT_CAPTURE_CONFIG.SAMPLE_RATE,
          channels: config?.channels ?? DEFAULT_CAPTURE_CONFIG.CHANNELS,
          chunkDurationMs:
            config?.chunkDurationMs ?? DEFAULT_CAPTURE_CONFIG.CHUNK_DURATION_MS,
          deviceId: config?.deviceId,
        };

        audioCapture = new AudioCapture(captureConfig);

        audioCapture.on("chunk", (chunk) => {
          // Forward audio chunk to renderer for processing
          if (!overlayWindow.isDestroyed()) {
            overlayWindow.webContents.send(IPC_CHANNELS.CAPTURE_CHUNK, chunk);
          }
        });

        audioCapture.on("error", (error) => {
          console.error("[Capture IPC] AudioCapture error:", error);
        });

        await audioCapture.start();

        return { success: true, status: "recording" };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[Capture IPC] Failed to start capture:", message);
        return { success: false, error: message };
      }
    }
  );

  ipcMain.handle(IPC_CHANNELS.CAPTURE_STOP, async () => {
    try {
      if (!audioCapture) {
        return { success: false, error: "No active capture session" };
      }

      await audioCapture.stop();
      audioCapture = null;

      return { success: true, status: "stopped" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Capture IPC] Failed to stop capture:", message);
      return { success: false, error: message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CAPTURE_STATUS, () => {
    return {
      isRecording: audioCapture?.isRecording() ?? false,
      config: audioCapture?.getConfig() ?? null,
    };
  });

  // 최근 N초 버퍼 반환 (AI_AUTO_GUIDE 호출 시 사용)
  ipcMain.handle(IPC_CHANNELS.CAPTURE_GET_BUFFER, (_event, seconds: number = 60) => {
    if (!audioCapture) {
      return { success: false, error: "No active capture session", chunks: [] };
    }
    const chunks = audioCapture.getRecentChunks(seconds);
    return { success: true, chunks };
  });
}
