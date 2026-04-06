import React, { useState } from "react";
import { Session } from "../../shared/types";

interface Props {
  sessions: Session[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

const SessionHistory: React.FC<Props> = ({ sessions, loading, onRefresh, onDelete }) => {
  const [selected, setSelected] = useState<Session | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (start: number, end?: number) => {
    const ms = (end ?? Date.now()) - start;
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}분 ${sec}초`;
  };

  const statusLabel: Record<Session["status"], string> = {
    active: "진행 중",
    paused: "일시정지",
    completed: "완료",
  };

  const statusColor: Record<Session["status"], string> = {
    active: "#4caf88",
    paused: "#f0a040",
    completed: "#7c6af7",
  };

  if (loading) {
    return (
      <div className="session-loading">
        <span>세션 기록 불러오는 중...</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="session-empty">
        <div className="empty-icon">📚</div>
        <p>아직 세션 기록이 없습니다.</p>
        <p className="empty-hint">오버레이에서 녹음을 시작하면 세션이 생성됩니다.</p>
        <button className="refresh-btn" onClick={onRefresh}>새로고침</button>
      </div>
    );
  }

  return (
    <div className="session-history">
      <div className="session-list-header">
        <h2>세션 기록 ({sessions.length}개)</h2>
        <button className="refresh-btn" onClick={onRefresh}>새로고침</button>
      </div>

      <div className="session-layout">
        <ul className="session-list">
          {sessions.map((session) => (
            <li
              key={session.id}
              className={`session-item ${selected?.id === session.id ? "selected" : ""}`}
              onClick={() => setSelected(session)}
            >
              <div className="session-item-header">
                <span className="session-name">{session.name}</span>
                <span
                  className="session-status"
                  style={{ color: statusColor[session.status] }}
                >
                  {statusLabel[session.status]}
                </span>
              </div>
              <div className="session-meta">
                <span>{formatDate(session.startTime)}</span>
                <span>{formatDuration(session.startTime, session.endTime)}</span>
                <span>요약 {session.summaries.length}개</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="session-detail">
          {selected ? (
            <>
              <div className="detail-header">
                <h3>{selected.name}</h3>
                <button
                  className="delete-btn"
                  onClick={() => {
                    onDelete(selected.id);
                    setSelected(null);
                  }}
                >
                  삭제
                </button>
              </div>
              <div className="detail-meta">
                <span>시작: {formatDate(selected.startTime)}</span>
                {selected.endTime && <span>종료: {formatDate(selected.endTime)}</span>}
                <span>소요: {formatDuration(selected.startTime, selected.endTime)}</span>
              </div>
              <h4>AI 요약 기록</h4>
              {selected.summaries.length === 0 ? (
                <p className="no-summaries">이 세션에 요약 기록이 없습니다.</p>
              ) : (
                <ul className="summary-list">
                  {selected.summaries.map((s) => (
                    <li key={s.id} className="summary-item">
                      <div className="summary-time">{formatDate(s.timestamp)}</div>
                      <p className="summary-content">{s.content}</p>
                      {s.keyPoints.length > 0 && (
                        <ul className="key-points">
                          {s.keyPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="detail-placeholder">
              <p>왼쪽에서 세션을 선택하세요</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .session-loading, .session-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #888;
          gap: 12px;
        }
        .empty-icon { font-size: 48px; }
        .empty-hint { font-size: 13px; color: #555; }
        .session-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .session-list-header h2 { font-size: 18px; }
        .refresh-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid #2a2a35;
          background: transparent;
          color: #a0a0b0;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .refresh-btn:hover { background: #2a2a35; color: #e0e0e8; }
        .session-layout { display: grid; grid-template-columns: 340px 1fr; gap: 16px; height: calc(100vh - 180px); }
        .session-list { list-style: none; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .session-item {
          background: #16161a;
          border-radius: 10px;
          padding: 14px 16px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
        }
        .session-item:hover { border-color: #2a2a35; }
        .session-item.selected { border-color: #7c6af7; background: #7c6af710; }
        .session-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .session-name { font-size: 14px; font-weight: 600; }
        .session-status { font-size: 12px; }
        .session-meta { display: flex; gap: 10px; font-size: 12px; color: #666; }
        .session-detail { background: #16161a; border-radius: 12px; padding: 20px; overflow-y: auto; }
        .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .detail-header h3 { font-size: 18px; }
        .delete-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid #e05555;
          background: transparent;
          color: #e05555;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .delete-btn:hover { background: #e0555520; }
        .detail-meta { display: flex; gap: 16px; font-size: 13px; color: #888; margin-bottom: 20px; }
        h4 { font-size: 14px; color: #a0a0b0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .no-summaries { color: #555; font-size: 14px; }
        .summary-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .summary-item { background: #0f0f11; border-radius: 8px; padding: 14px; border-left: 3px solid #7c6af7; }
        .summary-time { font-size: 11px; color: #666; margin-bottom: 6px; }
        .summary-content { font-size: 14px; line-height: 1.6; margin-bottom: 8px; }
        .key-points { list-style: disc; padding-left: 18px; }
        .key-points li { font-size: 13px; color: #a0a0b0; line-height: 1.8; }
        .detail-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #555; }
      `}</style>
    </div>
  );
};

export default SessionHistory;
