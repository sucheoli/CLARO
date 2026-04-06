import React, { useState } from "react";
import { AISummary } from "../../shared/types";

interface SummaryCardProps {
  summary: AISummary;
  onDismiss: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ summary, onDismiss }) => {
  const [activeTab, setActiveTab] = useState<"summary" | "points" | "questions">(
    "summary"
  );

  const formattedTime = new Date(summary.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <span className="summary-time">{formattedTime}</span>
        <div className="summary-tabs">
          <button
            className={`tab-btn ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            Summary
          </button>
          <button
            className={`tab-btn ${activeTab === "points" ? "active" : ""}`}
            onClick={() => setActiveTab("points")}
          >
            Points ({summary.keyPoints.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
            onClick={() => setActiveTab("questions")}
          >
            Q&A ({summary.questions.length})
          </button>
        </div>
      </div>

      <div className="summary-card-body">
        {activeTab === "summary" && (
          <p className="summary-content">{summary.content}</p>
        )}

        {activeTab === "points" && (
          <ul className="key-points-list">
            {summary.keyPoints.length > 0 ? (
              summary.keyPoints.map((point, index) => (
                <li key={index} className="key-point-item">
                  {point}
                </li>
              ))
            ) : (
              <li className="empty-state">No key points available</li>
            )}
          </ul>
        )}

        {activeTab === "questions" && (
          <ul className="questions-list">
            {summary.questions.length > 0 ? (
              summary.questions.map((question, index) => (
                <li key={index} className="question-item">
                  {question}
                </li>
              ))
            ) : (
              <li className="empty-state">No questions available</li>
            )}
          </ul>
        )}
      </div>

      <div className="summary-card-footer">
        <span className="model-badge">{summary.model}</span>
        <button className="dismiss-btn" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default SummaryCard;
