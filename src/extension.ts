import * as vscode from 'vscode';
import { ContextBridgeViewProvider } from './webview/provider';

/**
 * Extension Activation
 * Initializes the Context Bridge extension with sidebar provider and event listeners
 */
export function activate(context: vscode.ExtensionContext) {
  const provider = new ContextBridgeViewProvider(context.extensionUri);

  // Register the webview view provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'contextBridgeSidebar',
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Listen for text selection events (State_Trigger)
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const selection = event.textEditor.document.getText(event.selections[0]);
      if (selection.trim().length > 0) {
        provider.updateContextForSelection(selection);
      }
    })
  );

  // Listen for active editor changes (State_Idle monitoring)
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        const fileName = editor.document.fileName;
        provider.updateContextForFile(fileName);
      }
    })
  );

  vscode.window.showInformationMessage('Context Bridge activated! Highlight code to see related context.');
}

/**
 * Extension Deactivation
 */
export function deactivate() {
  return undefined;
}
