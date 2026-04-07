export const APP_NAME = "CLARO";
export const APP_VERSION = "1.0.0";

// IPC Channel Names
export const IPC_CHANNELS = {
  // Capture
  CAPTURE_START: "capture:start",
  CAPTURE_STOP: "capture:stop",
  CAPTURE_STATUS: "capture:status",
  CAPTURE_CHUNK: "capture:chunk",
  CAPTURE_GET_BUFFER: "capture:get-buffer",

  // AI Pipeline
  AI_PROCESS: "ai:process",
  AI_SUMMARY: "ai:summary",
  AI_HELP: "ai:help",
  AI_AUTO_GUIDE: "ai:auto-guide",
  AI_STREAM: "ai:stream",
  AI_STREAM_END: "ai:stream-end",

  // Session
  SESSION_CREATE: "session:create",
  SESSION_LIST: "session:list",
  SESSION_GET: "session:get",
  SESSION_UPDATE: "session:update",
  SESSION_DELETE: "session:delete",
  SESSION_CURRENT: "session:current",

  // Transcription
  CAPTURE_TRANSCRIBE: "capture:transcribe",

  // Window
  WINDOW_TOGGLE_OVERLAY: "window:toggle-overlay",
  WINDOW_OPEN_DASHBOARD: "window:open-dashboard",
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_CLOSE: "window:close",
  WINDOW_RESIZE: "window:resize",
  WINDOW_MOVE: "window:move",
  WINDOW_MOVE_BY: "window:move-by",
  WINDOW_GET_POSITION: "window:get-position",
} as const;

// Keyboard Shortcuts
export const SHORTCUTS = {
  TOGGLE_OVERLAY: "CommandOrControl+Shift+H",
  OPEN_DASHBOARD: "CommandOrControl+Shift+D",
  START_CAPTURE: "CommandOrControl+Shift+R",
} as const;

// AI Model Configuration
export const AI_CONFIG = {
  MODEL: "gpt-4o",
  WHISPER_MODEL: "whisper-1",
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.7,
  STREAM_TIMEOUT_MS: 30000,
} as const;

// Audio Capture Defaults
export const DEFAULT_CAPTURE_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  CHUNK_DURATION_MS: 5000,
} as const;

// Window Dimensions
export const WINDOW_SIZES = {
  OVERLAY_ICON:      { width: 72,  height: 72  },
  OVERLAY_RECORDING: { width: 72,  height: 112 },
  OVERLAY_GUIDE:     { width: 360, height: 480 },
  DASHBOARD:         { width: 1100, height: 750 },
} as const;

// Pipeline Stages
export const PIPELINE_STAGES = {
  CAPTURE: "capture",
  CONTEXT: "context",
  AI: "ai",
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SESSIONS: "sessions",
  CURRENT_SESSION: "currentSessionId",
  CONFIG: "appConfig",
} as const;
