import React, { useState, useEffect } from "react";
import SessionHistory from "./SessionHistory";
import { Session } from "../../shared/types";
import { IPC_CHANNELS } from "../../shared/constants";

declare global {
  interface Window {
    electronAPI?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
      off: (channel: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

type DashboardTab = "sessions" | "settings";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("sessions");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI?.invoke(IPC_CHANNELS.SESSION_LIST) as Session[];
      setSessions(result ?? []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await window.electronAPI?.invoke(IPC_CHANNELS.SESSION_DELETE, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo">
          <span className="logo-text">CLARO</span>
          <span className="logo-subtitle">강의 보조 AI</span>
        </div>
        <nav className="dashboard-nav">
          <button
            className={`nav-btn ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            세션 기록
          </button>
          <button
            className={`nav-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            설정
          </button>
        </nav>
      </header>

      <main className="dashboard-main">
        {activeTab === "sessions" && (
          <SessionHistory
            sessions={sessions}
            loading={loading}
            onRefresh={loadSessions}
            onDelete={handleDeleteSession}
          />
        )}
        {activeTab === "settings" && (
          <div className="settings-panel">
            <h2>설정</h2>
            <div className="settings-group">
              <label>단축키</label>
              <div className="setting-item">
                <span>오버레이 토글</span>
                <kbd>Ctrl + Shift + H</kbd>
              </div>
              <div className="setting-item">
                <span>대시보드 열기</span>
                <kbd>Ctrl + Shift + D</kbd>
              </div>
              <div className="setting-item">
                <span>녹음 시작/중지</span>
                <kbd>Ctrl + Shift + R</kbd>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0f0f11;
          color: #e0e0e8;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          height: 100vh;
          overflow: hidden;
        }
        .dashboard {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: #16161a;
          border-bottom: 1px solid #2a2a35;
        }
        .logo { display: flex; flex-direction: column; }
        .logo-text { font-size: 20px; font-weight: 700; color: #7c6af7; letter-spacing: 2px; }
        .logo-subtitle { font-size: 11px; color: #888; margin-top: 2px; }
        .dashboard-nav { display: flex; gap: 8px; }
        .nav-btn {
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #888;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .nav-btn:hover { background: #222230; color: #e0e0e8; }
        .nav-btn.active { background: #7c6af722; color: #7c6af7; font-weight: 600; }
        .dashboard-main { flex: 1; overflow-y: auto; padding: 24px; }
        .settings-panel h2 { font-size: 18px; margin-bottom: 20px; }
        .settings-group { background: #16161a; border-radius: 12px; padding: 16px; }
        .settings-group label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 12px; }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #2a2a35;
          font-size: 14px;
        }
        .setting-item:last-child { border-bottom: none; }
        kbd {
          background: #2a2a35;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          color: #a0a0b0;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default App;
