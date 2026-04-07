import React, { useState, useEffect, useRef, useCallback } from "react";
import { IPC_CHANNELS } from "../../shared/constants";
import { GuideResponse } from "../../core/ai/Pipeline";

type OverlayState = "idle" | "recording" | "loading" | "guide";

interface TextEntry { text: string; timestamp: number; }

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, cb: (...args: unknown[]) => void) => void;
      off: (channel: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}

const App: React.FC = () => {
  const [state, setState] = useState<OverlayState>("idle");
  const [guide, setGuide] = useState<GuideResponse | null>(null);

  const textBuffer = useRef<TextEntry[]>([]);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  // ── 드래그 ─────────────────────────────────────────
  // clientX/Y = 창 내 커서 위치(고정 오프셋), screenX/Y = 절대 화면 위치
  // 창 위치 = screenX - clientX_at_start (수학적으로 정확, IPC 불필요)
  const drag = useRef({
    active: false,
    offsetX: 0, offsetY: 0,       // pointerDown 시 창 내 커서 위치 (고정)
    startScreenX: 0, startScreenY: 0, // 클릭 판별용
    lastScreenX: 0, lastScreenY: 0,
    rafId: 0,
  });

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // 버튼 클릭이면 드래그 시작하지 않음 (버튼의 onClick이 직접 처리)
    if ((e.target as HTMLElement).closest("button")) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
    drag.current = {
      active: true,
      offsetX: e.clientX,
      offsetY: e.clientY,
      startScreenX: e.screenX, startScreenY: e.screenY,
      lastScreenX: e.screenX,  lastScreenY: e.screenY,
      rafId: 0,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.lastScreenX = e.screenX;
    drag.current.lastScreenY = e.screenY;
    if (!drag.current.rafId) {
      drag.current.rafId = requestAnimationFrame(() => {
        drag.current.rafId = 0;
        if (!drag.current.active) return;
        window.electronAPI?.invoke(
          IPC_CHANNELS.WINDOW_MOVE,
          Math.round(drag.current.lastScreenX - drag.current.offsetX),
          Math.round(drag.current.lastScreenY - drag.current.offsetY),
        );
      });
    }
  }, []);

  const onPointerUp = useCallback((_e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current.rafId) {
      cancelAnimationFrame(drag.current.rafId);
      drag.current.rafId = 0;
    }
    drag.current.active = false;
  }, []);

  // ── 스트림 수신 ────────────────────────────────────
  useEffect(() => {
    const onEnd = (...args: unknown[]) => {
      const data = args[0] as GuideResponse;
      setGuide(data);
      setState("guide");
      window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_RESIZE, "guide");
    };
    window.electronAPI?.on(IPC_CHANNELS.AI_STREAM_END, onEnd);
    return () => window.electronAPI?.off(IPC_CHANNELS.AI_STREAM_END, onEnd);
  }, []);

  // ── 녹음 시작 ─────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      recorder.ondataavailable = async (e) => {
        if (e.data.size < 1000) return;
        const arrayBuffer = await e.data.arrayBuffer();
        const result = await window.electronAPI?.invoke(
          IPC_CHANNELS.CAPTURE_TRANSCRIBE, arrayBuffer
        ) as { success: boolean; text: string } | undefined;

        if (result?.success && result.text) {
          const now = Date.now();
          textBuffer.current.push({ text: result.text, timestamp: now });
          const cutoff = now - 5 * 60 * 1000;
          textBuffer.current = textBuffer.current.filter(t => t.timestamp >= cutoff);
        }
      };

      recorder.start(5000);
      mediaRecorder.current = recorder;
      textBuffer.current = [];
      setState("recording");
      window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_RESIZE, "recording");
    } catch (err) {
      console.error("[Recording] Failed:", err);
      alert("마이크 권한이 필요합니다.");
    }
  }, []);

  // ── 가이드 요청 ────────────────────────────────────
  const requestGuide = useCallback(async () => {
    if (state !== "recording") return;
    const cutoff = Date.now() - 60 * 1000;
    const recentText = textBuffer.current
      .filter(t => t.timestamp >= cutoff)
      .map(t => t.text)
      .join(" ")
      .trim();

    if (!recentText) {
      alert("아직 충분한 강의 내용이 수집되지 않았습니다.");
      return;
    }

    setState("loading");
    await window.electronAPI?.invoke(IPC_CHANNELS.AI_AUTO_GUIDE, recentText);
  }, [state]);

  // ── 녹음 중지 ─────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorder.current.stop();
      mediaRecorder.current = null;
    }
    textBuffer.current = [];
    setState("idle");
    window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_RESIZE, "icon");
  }, []);

  // ── 닫기 ──────────────────────────────────────────
  const dismiss = useCallback(() => {
    setState("recording");
    setGuide(null);
    window.electronAPI?.invoke(IPC_CHANNELS.WINDOW_RESIZE, "recording");
  }, []);

  // ── 렌더 ──────────────────────────────────────────

  if (state === "guide") {
    return (
      <div className="guide-card">
        <div className="guide-header">
          <span className="guide-brand">CLARO</span>
          <button className="guide-close" onClick={dismiss}>×</button>
        </div>
        {guide && (
          <>
            <div className="guide-current">
              <span className="guide-label">지금 강의</span>
              <p>{guide.currentAction}</p>
            </div>
            <div className="guide-steps">
              <span className="guide-label">따라하기</span>
              <ol>
                {guide.steps.map((step, i) => (
                  <li key={i}>{step.replace(/^\d+\.\s*/, "")}</li>
                ))}
              </ol>
            </div>
            {guide.result && (
              <div className="guide-result">
                <span className="guide-label">완료 후</span>
                <p>{guide.result}</p>
              </div>
            )}
          </>
        )}
        <button className="guide-done-btn" onClick={dismiss}>완료 ✓</button>
      </div>
    );
  }

  return (
    <div
      className="icon-wrap"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* 버튼 컨테이너 — 중지 버튼을 ? 버튼 기준으로 절대 위치 지정 */}
      <div className="btn-container">
        {state === "recording" && (
          <button
            className="stop-badge"
            onClick={stopRecording}
            title="녹음 중지"
          >
            ■
          </button>
        )}
        <button
          className={`icon-btn ${state}`}
          onClick={
            state === "idle"      ? startRecording :
            state === "recording" ? requestGuide   : undefined
          }
        >
          {state === "loading"   && <span className="spinner" />}
          {state === "idle"      && <span className="icon-play">▶</span>}
          {state === "recording" && <span className="icon-help">?</span>}
        </button>
      </div>
    </div>
  );
};

export default App;
