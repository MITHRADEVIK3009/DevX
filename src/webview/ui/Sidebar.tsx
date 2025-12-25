import React, { useEffect, useState } from "react";
import { ContextNugget, ContextMap } from "../../types";
import "./Sidebar.css";

interface SidebarProps {
  contextMap: ContextMap | null;
  isLoading: boolean;
}

/**
 * Context Bridge Sidebar UI Component
 * Displays context nuggets with source links and accessibility support (high contrast)
 */
export function Sidebar({ contextMap, isLoading }: SidebarProps) {
  const [displayNuggets, setDisplayNuggets] = useState<ContextNugget[]>([]);

  useEffect(() => {
    if (contextMap?.nuggets) {
      setDisplayNuggets(contextMap.nuggets);
    }
  }, [contextMap]);

  const handleLinkClick = (nugget: ContextNugget) => {
    // Post message to extension for metrics tracking
    const vscodeApi = (window as any).acquireVsCodeApi?.();
    if (vscodeApi) {
      vscodeApi.postMessage({
        type: "navigate-link",
        payload: {
          nuggetId: nugget.id,
          source: nugget.source,
          url: nugget.url,
          timestamp: Date.now(),
        },
      });
    }

    // Open link in external browser
    window.open(nugget.url, "_blank");
  };

  return (
    <div className="context-bridge-sidebar" role="region" aria-label="Context Bridge">
      <div className="sidebar-header">
        <h2 className="sidebar-title">🔗 Context Bridge</h2>
        <p className="sidebar-subtitle">Relevant context from Teams & GitHub</p>
      </div>

      {isLoading && (
        <div className="loading-state" role="status" aria-live="polite">
          <div className="spinner"></div>
          <p>Searching for context...</p>
        </div>
      )}

      {!isLoading && displayNuggets.length === 0 && (
        <div className="empty-state">
          <p className="empty-message">
            📝 Highlight code to see related context from Teams chats and
            documentation.
          </p>
        </div>
      )}

      {!isLoading && displayNuggets.length > 0 && (
        <div className="nuggets-container" role="list">
          {displayNuggets.map((nugget, index) => (
            <NuggetCard
              key={nugget.id}
              nugget={nugget}
              index={index}
              onClick={() => handleLinkClick(nugget)}
            />
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        <p className="footer-text">
          MTTC Target: &lt;30s | Powered by Context Bridge
        </p>
      </div>
    </div>
  );
}

interface NuggetCardProps {
  nugget: ContextNugget;
  index: number;
  onClick: () => void;
}

/**
 * Individual context nugget card
 * Displays source, content, and clickable link
 */
function NuggetCard({ nugget, index, onClick }: NuggetCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const sourceIcon: Record<string, string> = {
    Teams: "💬",
    SharePoint: "📄",
    "GitHub PR": "🔀",
    "GitHub Issue": "🐛",
  };

  return (
    <div
      className="nugget-card"
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Nugget Header */}
      <div className="nugget-header">
        <span className="nugget-index">{index + 1}</span>
        <span className="nugget-source" title={nugget.source}>
          {sourceIcon[nugget.source] || "📌"} {nugget.source}
        </span>
        <span className="nugget-date" aria-label={`Posted on ${formatDate(nugget.timestamp)}`}>
          {formatDate(nugget.timestamp)}
        </span>
      </div>

      {/* Nugget Content */}
      <div className="nugget-content">
        <p className="nugget-text">{nugget.content}</p>
      </div>

      {/* Nugget Metadata */}
      <div className="nugget-meta">
        <span className="nugget-author">by {nugget.author}</span>
        <span className="nugget-relevance" aria-label={`Relevance: ${(nugget.relevanceScore * 100).toFixed(0)}%`}>
          {(nugget.relevanceScore * 100).toFixed(0)}% relevant
        </span>
      </div>

      {/* Keywords */}
      <div className="nugget-keywords">
        {nugget.keywords.slice(0, 3).map((kw) => (
          <span key={kw} className="keyword-tag">
            #{kw}
          </span>
        ))}
      </div>

      {/* CTA Button */}
      <button
        className="nugget-link-btn"
        onClick={onClick}
        aria-label={`View full context from ${nugget.source}`}
      >
        View Full Context →
      </button>
    </div>
  );
}

export default Sidebar;
