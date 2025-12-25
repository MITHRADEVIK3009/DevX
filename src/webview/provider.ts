import * as vscode from 'vscode';
import { ContextBridgeStateMachine } from '../stateMachine';
import { ContextMap, WebviewMessage } from '../types';

export class ContextBridgeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'contextBridgeSidebar';
  private _view?: vscode.WebviewView;
  private stateMachine: ContextBridgeStateMachine;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this.stateMachine = new ContextBridgeStateMachine();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      switch (message.type) {
        case 'navigate-link':
          vscode.env.openExternal(vscode.Uri.parse(message.payload.url as string));
          this.logToOutput(`[Validation] User clicked: ${message.payload.nuggetId}`);
          break;
        case 'log-metric':
          this.logToOutput(`[Metric] ${message.payload.label}: ${message.payload.value}`);
          break;
      }
    });
  }

  public updateContextForSelection(selectedText: string) {
    if (this._view) {
      // Send loading state
      this._view.webview.postMessage({
        type: 'loading'
      });

      // Get current editor
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const fileName = editor.document.fileName;
      const fileLanguage = editor.document.languageId;
      const lineNumber = editor.selection.active.line + 1;

      // Process through state machine
      const contextMap = this.stateMachine.processSelection(
        selectedText,
        fileName,
        fileLanguage,
        lineNumber
      );

      if (contextMap) {
        // Send context to webview
        this._view.webview.postMessage({
          type: 'update-context',
          payload: contextMap
        });

        // Log MTTC metric
        const mttc = Date.now() - contextMap.cachedAt;
        this.logToOutput(`[MTTC Metric] ${mttc}ms (Target: <30000ms)`);
      }
    }
  }

  public updateContextForFile(fileName: string) {
    if (this._view) {
      // For MVP, we only process on explicit selection
      // Future: could implement proactive surfacing based on file type
    }
  }

  private logToOutput(message: string) {
    const outputChannel = vscode.window.createOutputChannel('Context Bridge');
    outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const { join } = require('path');
    const webviewMainPath = join(this._extensionUri.fsPath, 'dist', 'webview.js');
    const mainUri = webview.asWebviewUri(vscode.Uri.file(webviewMainPath));

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
        </script>
      </body>
      </html>`;
  }
}
