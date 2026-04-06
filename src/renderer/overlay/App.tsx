import React, { useState, useEffect, useCallback } from "react";
import HelpButton from "./HelpButton";
import SummaryCard from "./SummaryCard";
import { AISummary, HelpResponse } from "../../shared/types";
import { IPC_CHANNELS } from "../../shared/constants";

type OverlayView = "idle" | "summary" | "help" | "streaming";

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
      off: (channel: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<OverlayView>("idle");
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [helpResponse, setHelpResponse] = useState<HelpResponse | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleStream = (...args: unknown[]) => {
      const chunk = args[0] as string;
      setView("streaming");
      setStreamingText((prev) => prev + chunk);
    };

    const handleStreamEnd = (...args: unknown[]) => {
      const data = args[0] as AISummary | HelpResponse;
      if ("content" in data) {
        setSummary(data as AISummary);
        setView("summary");
      } else {
        setHelpResponse(data as HelpResponse);
        setView("help");
      }
      setStreamingText("");
    };

    window.electronAPI?.on(IPC_CHANNELS.AI_STREAM, handleStream);
    window.electronAPI?.on(IPC_CHANNELS.AI_STREAM_END, handleStreamEnd);

    return () => {
      window.electronAPI?.off(IPC_CHANNELS.AI_STREAM, handleStream);
      window.electronAPI?.off(IPC_CHANNELS.AI_STREAM_END, handleStreamEnd);
    };
  }, []);

  const handleToggleRecording = useCallback(async () => {
    try {
      setError(null);
      if (isRecording) {
        await window.electronAPI?.invoke(IPC_CHANNELS.CAPTURE_STOP);
        setIsRecording(false);
      } else {
        const result = await window.electronAPI?.invoke(
          IPC_CHANNELS.CAPTURE_START
        ) as { success: boolean; error?: string };
        if (result?.success) {
          setIsRecording(true);
        } else {
          setError(result?.error ?? "Failed to start recording");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recording failed");
    }
  }, [isRecording]);

  const handleHelpRequest = useCallback(async (query: string) => {
    try {
      setError(null);
      setStreamingText("");
      setView("streaming");
      await window.electronAPI?.invoke(IPC_CHANNELS.AI_HELP, query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Help request failed");
      setView("idle");
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setView("idle");
    setSummary(null);
    setHelpResponse(null);
    setStreamingText("");
  }, []);

  return (
    <div className="overlay-container">
      <div className="overlay-header">
        <span className="overlay-title">CLARO</span>
        <div className="overlay-controls">
          <button
            className={`record-btn ${isRecording ? "recording" : ""}`}
            onClick={handleToggleRecording}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? "■" : "●"}
          </button>
          <button
            className="dashboard-btn"
            onClick={() =>
              window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_OPEN_DASHBOARD)
            }
            title="Open Dashboard"
          >
            ☰
          </button>
          <button
            className="close-btn"
            onClick={() =>
              window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_TOGGLE_OVERLAY)
            }
            title="Hide Overlay (Ctrl+Shift+H)"
          >
            ×
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="overlay-body">
        {view === "idle" && (
          <div className="idle-state">
            <p className="idle-text">
              {isRecording ? "Listening..." : "Press ● to start recording"}
            </p>
          </div>
        )}

        {view === "streaming" && (
          <div className="streaming-state">
            <div className="streaming-indicator">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <p className="streaming-text">{streamingText}</p>
          </div>
        )}

        {view === "summary" && summary && (
          <SummaryCard summary={summary} onDismiss={handleDismiss} />
        )}

        {view === "help" && helpResponse && (
          <div className="help-response">
            <p className="help-answer">{helpResponse.answer}</p>
            <button className="dismiss-btn" onClick={handleDismiss}>
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div className="overlay-footer">
        <HelpButton onSubmit={handleHelpRequest} disabled={view === "streaming"} />
      </div>
    </div>
  );
};

export default App;
