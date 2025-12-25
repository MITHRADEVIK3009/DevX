var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import * as vscode from "vscode";
function getContextDatabase(db) {
  return [];
}
class ContextBridgeStateMachine {
  constructor() {
    __publicField(this, "currentState", "State_Idle");
    __publicField(this, "sessionCache", /* @__PURE__ */ new Map());
    __publicField(this, "stateHistory", []);
  }
  /**
   * State_Trigger: Extract intent metadata from user selection
   */
  static extractIntentMetadata(selectedText, fileName, fileLanguage, lineNumber) {
    return {
      selectedText,
      fileName,
      fileLanguage,
      lineNumber,
      timestamp: Date.now()
    };
  }
  /**
   * State_Retrieval: Fetch context from mock database with semantic ranking
   */
  static retrieveContextNuggets(metadata) {
    try {
      const database = getContextDatabase();
      const selectedKeywords = metadata.selectedText.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const rankedContexts = database.map((ctx) => {
        const keywordMatches = ctx.keywords.filter(
          (kw) => selectedKeywords.some(
            (sk) => kw.toLowerCase().includes(sk) || sk.includes(kw.toLowerCase())
          )
        ).length;
        const matchScore = keywordMatches / Math.max(ctx.keywords.length, 1);
        const ctxDate = new Date(ctx.timestamp).getTime();
        const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1e3;
        const recencyScore = ctxDate > sixMonthsAgo ? 1 : 0.5;
        return {
          ...ctx,
          calculatedScore: matchScore * 0.7 + recencyScore * 0.3
        };
      }).filter((ctx) => ctx.calculatedScore > 0).sort(
        (a, b) => b.calculatedScore - a.calculatedScore
      ).slice(0, 3).map(({ calculatedScore, ...ctx }) => ctx);
      return rankedContexts;
    } catch (error) {
      console.error("Error retrieving context nuggets:", error);
      return [];
    }
  }
  /**
   * State_Display: Generate displayable context map
   */
  generateContextMap(metadata, nuggets) {
    return {
      metadata,
      nuggets,
      cachedAt: Date.now(),
      sessionId: this.generateSessionId()
    };
  }
  /**
   * Process a user selection event and emit context updates
   */
  processSelection(selectedText, fileName, fileLanguage, lineNumber) {
    this.transitionState("State_Idle", "State_Trigger", "text-selected");
    const metadata = ContextBridgeStateMachine.extractIntentMetadata(
      selectedText,
      fileName,
      fileLanguage,
      lineNumber
    );
    this.transitionState("State_Trigger", "State_Retrieval", "metadata-extracted");
    const nuggets = ContextBridgeStateMachine.retrieveContextNuggets(metadata);
    this.transitionState("State_Retrieval", "State_Display", "context-retrieved");
    const contextMap = this.generateContextMap(metadata, nuggets);
    this.sessionCache.set(contextMap.sessionId, contextMap);
    this.transitionState("State_Display", "State_Idle", "context-displayed");
    return contextMap;
  }
  /**
   * Log a state transition for observability
   */
  transitionState(from, to, trigger) {
    this.currentState = to;
    this.stateHistory.push({
      from,
      to,
      trigger,
      data: { timestamp: Date.now() }
    });
  }
  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  /**
   * Get the current state
   */
  getState() {
    return this.currentState;
  }
  /**
   * Get state history for debugging/metrics
   */
  getStateHistory() {
    return this.stateHistory;
  }
  /**
   * Clear session cache (optional cleanup)
   */
  clearSessionCache() {
    this.sessionCache.clear();
  }
}
class ContextBridgeViewProvider {
  constructor(_extensionUri) {
    __publicField(this, "_view");
    __publicField(this, "stateMachine");
    this._extensionUri = _extensionUri;
    this.stateMachine = new ContextBridgeStateMachine();
  }
  resolveWebviewView(webviewView, _context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "navigate-link":
          vscode.env.openExternal(vscode.Uri.parse(message.payload.url));
          this.logToOutput(`[Validation] User clicked: ${message.payload.nuggetId}`);
          break;
        case "log-metric":
          this.logToOutput(`[Metric] ${message.payload.label}: ${message.payload.value}`);
          break;
      }
    });
  }
  updateContextForSelection(selectedText) {
    if (this._view) {
      this._view.webview.postMessage({
        type: "loading"
      });
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const fileName = editor.document.fileName;
      const fileLanguage = editor.document.languageId;
      const lineNumber = editor.selection.active.line + 1;
      const contextMap = this.stateMachine.processSelection(
        selectedText,
        fileName,
        fileLanguage,
        lineNumber
      );
      if (contextMap) {
        this._view.webview.postMessage({
          type: "update-context",
          payload: contextMap
        });
        const mttc = Date.now() - contextMap.cachedAt;
        this.logToOutput(`[MTTC Metric] ${mttc}ms (Target: <30000ms)`);
      }
    }
  }
  updateContextForFile(fileName) {
    if (this._view) ;
  }
  logToOutput(message) {
    const outputChannel = vscode.window.createOutputChannel("Context Bridge");
    outputChannel.appendLine(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`);
  }
  getHtmlForWebview(webview) {
    const { join } = require("path");
    const webviewMainPath = join(this._extensionUri.fsPath, "dist", "webview.js");
    webview.asWebviewUri(vscode.Uri.file(webviewMainPath));
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Context Bridge</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 12px;
            font-size: 13px;
            line-height: 1.6;
          }

          #root {
            height: 100vh;
            overflow: hidden;
          }

          .container {
            display: flex;
            flex-direction: column;
            gap: 12px;
            height: 100%;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            flex-shrink: 0;
          }

          .header-icon {
            font-size: 18px;
          }

          .header-title {
            font-weight: 600;
            font-size: 14px;
            color: var(--vscode-foreground);
          }

          .content {
            flex: 1;
            overflow-y: auto;
          }

          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--vscode-descriptionForeground);
          }

          .spinner {
            width: 24px;
            height: 24px;
            border: 2px solid var(--vscode-editor-lineHighlightBorder);
            border-top-color: var(--vscode-textLink-foreground);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 12px;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .nugget-card {
            background: var(--vscode-editor-inlineValue-background);
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
          }

          .nugget-card:hover {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-editor-hoverHighlightBackground);
          }

          .nugget-title {
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 8px;
            color: var(--vscode-textLink-foreground);
          }

          .nugget-content {
            font-size: 12px;
            line-height: 1.5;
            margin-bottom: 10px;
            color: var(--vscode-editor-foreground);
            padding: 8px;
            background: var(--vscode-editor-background);
            border-radius: 3px;
            border-left: 3px solid var(--vscode-textLink-foreground);
          }

          .nugget-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            padding: 4px 0;
            border-top: 1px solid var(--vscode-editor-lineHighlightBorder);
            border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder);
            padding-top: 8px;
            padding-bottom: 8px;
          }

          .nugget-source {
            display: inline-block;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 500;
          }

          .nugget-relevance {
            background: var(--vscode-diffEditor-insertedLineBackground);
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
          }

          .keywords {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 8px;
          }

          .keyword-tag {
            font-size: 11px;
            background: var(--vscode-editor-inlineValue-background);
            color: var(--vscode-editor-inlineValue-foreground);
            padding: 2px 4px;
            border-radius: 2px;
            border: 1px solid var(--vscode-editor-lineHighlightBorder);
          }

          .nugget-button {
            width: 100%;
            padding: 8px 12px;
            background: var(--vscode-textLink-foreground);
            color: var(--vscode-editor-background);
            border: none;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          }

          .nugget-button:hover {
            opacity: 0.8;
          }

          .footer {
            flex-shrink: 0;
            border-top: 1px solid var(--vscode-editor-lineHighlightBorder);
            padding-top: 8px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-icon">🔗</div>
            <div class="header-title">Context Bridge</div>
          </div>
          <div id="root" class="content"></div>
          <div class="footer">MTTC Target: &lt;30s | Powered by Context Bridge</div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();

          window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'loading') {
              renderLoading();
            } else if (message.type === 'update-context') {
              renderContext(message.payload);
            } else if (message.type === 'clear') {
              clearContext();
            }
          });

          function renderLoading() {
            const root = document.getElementById('root');
            root.innerHTML = \`
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Searching for context...</p>
              </div>
            \`;
          }

          function renderContext(contextMap) {
            const root = document.getElementById('root');
            if (!contextMap || !contextMap.nuggets || contextMap.nuggets.length === 0) {
              root.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--vscode-descriptionForeground);">📝 Highlight code to see related context</div>';
              return;
            }

            const nuggetsHtml = contextMap.nuggets.map((nugget, idx) => \`
              <div class="nugget-card">
                <div class="nugget-title">\${idx + 1}. \${nugget.source} - \${nugget.title || 'Context'}</div>
                <div class="nugget-content">\${nugget.content}</div>
                <div class="nugget-meta">
                  <span class="nugget-source">\${nugget.source}</span>
                  <span class="nugget-relevance">\${(nugget.relevanceScore * 100).toFixed(0)}% relevant</span>
                </div>
                <div class="keywords">
                  \${nugget.keywords.slice(0, 3).map(kw => \`<span class="keyword-tag">#\${kw}</span>\`).join('')}
                </div>
                <button class="nugget-button" onclick="openContext('\${nugget.id}', '\${nugget.source}', '\${nugget.url}')">
                  View Full Context →
                </button>
              </div>
            \`).join('');

            root.innerHTML = nuggetsHtml;
          }

          function openContext(nuggetId, source, url) {
            vscode.postMessage({
              type: 'navigate-link',
              payload: {
                nuggetId: nuggetId,
                source: source,
                url: url,
                timestamp: Date.now()
              }
            });
          }

          function clearContext() {
            document.getElementById('root').innerHTML = '';
          }
        <\/script>
      </body>
      </html>`;
  }
}
__publicField(ContextBridgeViewProvider, "viewType", "contextBridgeSidebar");
function activate(context) {
  const provider = new ContextBridgeViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "contextBridgeSidebar",
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const selection = event.textEditor.document.getText(event.selections[0]);
      if (selection.trim().length > 0) {
        provider.updateContextForSelection(selection);
      }
    })
  );
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        const fileName = editor.document.fileName;
        provider.updateContextForFile(fileName);
      }
    })
  );
  vscode.window.showInformationMessage("Context Bridge activated! Highlight code to see related context.");
}
function deactivate() {
  return void 0;
}
export {
  activate,
  deactivate
};
//# sourceMappingURL=extension.js.map
