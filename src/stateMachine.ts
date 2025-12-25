import {
  IntentMetadata,
  ContextNugget,
  ContextMap,
  ApplicationState,
  StateTransition,
} from "./types";

/**
 * Context Bridge State Machine
 * Orchestrates the 4-state MVP flow: Idle → Trigger → Retrieval → Display
 */

// Export function to be called from extension.ts (Node context)
// Webview will receive data via IPC, not directly load from filesystem
export function getContextDatabase(db?: ContextNugget[]): ContextNugget[] {
  // If called from extension (Node context), it can pass the loaded database
  // If called from webview, use embedded fallback
  return db || [];
}

/**
 * Compute relevance scores for each context nugget given selection metadata.
 * Returns the original nugget objects augmented with `calculatedScore`.
 * This helper is exported so tests can validate scoring/ranking logic.
 */
export function computeRelevanceScores(
  metadata: IntentMetadata,
  db?: ContextNugget[]
): Array<ContextNugget & { calculatedScore: number }> {
  const database = getContextDatabase(db);

  const selectedKeywords = metadata.selectedText
    .toLowerCase()
    .split(/\W+/)
    .filter((w: string) => w.length > 3);

  return database.map((ctx: ContextNugget) => {
    const keywordMatches = ctx.keywords.filter((kw: string) =>
      selectedKeywords.some((sk: string) =>
        kw.toLowerCase().includes(sk) || sk.includes(kw.toLowerCase())
      )
    ).length;

    const matchScore = keywordMatches / Math.max(ctx.keywords.length, 1);

    const ctxDate = new Date(ctx.timestamp).getTime();
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const recencyScore = ctxDate > sixMonthsAgo ? 1 : 0.5;

    const calculatedScore = matchScore * 0.7 + recencyScore * 0.3;

    return { ...ctx, calculatedScore };
  });
}

export class ContextBridgeStateMachine {
  private currentState: ApplicationState = "State_Idle";
  private sessionCache: Map<string, ContextMap> = new Map();
  private stateHistory: StateTransition[] = [];

  /**
   * State_Trigger: Extract intent metadata from user selection
   */
  static extractIntentMetadata(
    selectedText: string,
    fileName: string,
    fileLanguage: string,
    lineNumber: number
  ): IntentMetadata {
    return {
      selectedText,
      fileName,
      fileLanguage,
      lineNumber,
      timestamp: Date.now(),
    };
  }

  /**
   * State_Retrieval: Fetch context from mock database with semantic ranking
   */
  static retrieveContextNuggets(
    metadata: IntentMetadata,
    db?: ContextNugget[]
  ): ContextNugget[] {
    try {
      const scored = computeRelevanceScores(metadata, db || undefined);

      const rankedContexts = scored
        .filter((ctx) => ctx.calculatedScore > 0)
        .sort((a, b) => b.calculatedScore - a.calculatedScore)
        .slice(0, 3)
        .map(({ calculatedScore, ...ctx }) => ctx as ContextNugget);

      return rankedContexts;
    } catch (error) {
      console.error("Error retrieving context nuggets:", error);
      return [];
    }
  }

  /**
   * State_Display: Generate displayable context map
   */
  generateContextMap(
    metadata: IntentMetadata,
    nuggets: ContextNugget[]
  ): ContextMap {
    return {
      metadata,
      nuggets,
      cachedAt: Date.now(),
      sessionId: this.generateSessionId(),
    };
  }

  /**
   * Process a user selection event and emit context updates
   */
  processSelection(
    selectedText: string,
    fileName: string,
    fileLanguage: string,
    lineNumber: number
  ): ContextMap | null {
    // Transition: Idle → Trigger
    this.transitionState("State_Idle", "State_Trigger", "text-selected");

    // Extract metadata
    const metadata = ContextBridgeStateMachine.extractIntentMetadata(
      selectedText,
      fileName,
      fileLanguage,
      lineNumber
    );

    // Transition: Trigger → Retrieval
    this.transitionState("State_Trigger", "State_Retrieval", "metadata-extracted");

    // Retrieve context
    const nuggets = ContextBridgeStateMachine.retrieveContextNuggets(metadata);

    // Transition: Retrieval → Display
    this.transitionState("State_Retrieval", "State_Display", "context-retrieved");

    // Generate context map
    const contextMap = this.generateContextMap(metadata, nuggets);

    // Cache for session persistence
    this.sessionCache.set(contextMap.sessionId, contextMap);

    // Transition back to idle
    this.transitionState("State_Display", "State_Idle", "context-displayed");

    return contextMap;
  }

  /**
   * Log a state transition for observability
   */
  private transitionState(from: ApplicationState, to: ApplicationState, trigger: string): void {
    this.currentState = to;
    this.stateHistory.push({
      from,
      to,
      trigger,
      data: { timestamp: Date.now() },
    });
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get the current state
   */
  getState(): ApplicationState {
    return this.currentState;
  }

  /**
   * Get state history for debugging/metrics
   */
  getStateHistory(): StateTransition[] {
    return this.stateHistory;
  }

  /**
   * Clear session cache (optional cleanup)
   */
  clearSessionCache(): void {
    this.sessionCache.clear();
  }
}
