import * as vscode from 'vscode'
import { randomBytes } from 'node:crypto'
import { renderSpecEditorHtml } from './specEditorHtml'
import { renderSpecView } from './specView'

/**
 * Editor de spec (RF-006, TASK-EDIT-004). `CustomTextEditorProvider` para `spec.md`:
 * o webview projeta o `TextDocument` (textarea + visão SDD-aware). Por ADR-006, o
 * documento é a fonte de verdade — a edição do webview vira um `WorkspaceEdit` de
 * documento inteiro (EOL preservado), sem transformação estrutural (NFR-EDIT-001);
 * mudanças no documento reprojetam no webview.
 */
export class SpecEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = 'sddClaudeKit.specEditor'

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
  ): void {
    webviewPanel.webview.options = { enableScripts: true, localResourceRoots: [] }
    webviewPanel.webview.html = renderSpecEditorHtml(document.getText(), nonce())

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        void webviewPanel.webview.postMessage({
          type: 'update',
          text: document.getText(),
          viewHtml: renderSpecView(document.getText()),
        })
      }
    })
    webviewPanel.onDidDispose(() => changeSub.dispose())

    webviewPanel.webview.onDidReceiveMessage((message: unknown) => {
      if (isEdit(message)) {
        void applyFullText(document, message.text)
      }
    })
  }
}

interface EditMessage {
  type: 'edit'
  text: string
}

function isEdit(message: unknown): message is EditMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as { type?: unknown }).type === 'edit' &&
    typeof (message as { text?: unknown }).text === 'string'
  )
}

/**
 * Substitui o documento inteiro pelo texto do editor, preservando o EOL do
 * documento. Não faz nada se o conteúdo já é igual (evita o eco da própria edição).
 */
async function applyFullText(document: vscode.TextDocument, text: string): Promise<void> {
  const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n'
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, eol)
  if (document.getText() === normalized) {
    return
  }
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length),
  )
  const edit = new vscode.WorkspaceEdit()
  edit.replace(document.uri, fullRange, normalized)
  await vscode.workspace.applyEdit(edit)
}

function nonce(): string {
  return randomBytes(16).toString('base64').replace(/[^a-zA-Z0-9]/g, '')
}
