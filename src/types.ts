/**
 * Type definitions for Context Bridge
 * Represents data structures flowing through the state machine
 */

export interface IntentMetadata {
  selectedText: string;
  fileName: string;
  fileLanguage: string;
  lineNumber: number;
  timestamp: number;
}

export interface ContextNugget {
  id: string;
  source: "Teams" | "SharePoint" | "GitHub PR" | "GitHub Issue";
  title: string;
  content: string;
  keywords: string[];
  timestamp: string;
  author: string;
  relevanceScore: number;
  url: string;
}

export interface ContextMap {
  metadata: IntentMetadata;
  nuggets: ContextNugget[];
  cachedAt: number;
  sessionId: string;
}

export interface StateTransition {
  from: ApplicationState;
  to: ApplicationState;
  trigger: string;
  data?: Record<string, unknown>;
}

export type ApplicationState = 
  | "State_Idle"
  | "State_Trigger"
  | "State_Retrieval"
  | "State_Display"
  | "State_Validation"
  | "State_Persistence";

export interface WebviewMessage {
  type: "update-context" | "navigate-link" | "log-metric";
  payload: Record<string, unknown>;
}
