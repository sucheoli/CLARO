import React, { useState, useRef, useCallback } from "react";

interface HelpButtonProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
}

const HelpButton: React.FC<HelpButtonProps> = ({ onSubmit, disabled }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => {
      if (!prev) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      return !prev;
    });
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed || disabled) return;
      onSubmit(trimmed);
      setQuery("");
      setIsExpanded(false);
    },
    [query, disabled, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
        setQuery("");
      }
    },
    []
  );

  return (
    <div className="help-button-container">
      {isExpanded ? (
        <form className="help-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="help-input"
            placeholder="Ask a question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
          <button
            type="submit"
            className="help-submit-btn"
            disabled={!query.trim() || disabled}
          >
            Ask
          </button>
          <button
            type="button"
            className="help-cancel-btn"
            onClick={() => {
              setIsExpanded(false);
              setQuery("");
            }}
          >
            ×
          </button>
        </form>
      ) : (
        <button
          className="help-toggle-btn"
          onClick={handleToggle}
          disabled={disabled}
          title="Ask a question (AI Help)"
        >
          ? Ask AI
        </button>
      )}
    </div>
  );
};

export default HelpButton;
