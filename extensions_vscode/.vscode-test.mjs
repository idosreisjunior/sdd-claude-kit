// Configuração dos testes de integração (E2E) — feature 0023, ADR-022.
// Roda os testes compilados em out/e2e/ dentro de uma instância real do VS Code
// (Extension Development Host), separada da suíte unitária (out/test, node --test).
import { defineConfig } from '@vscode/test-cli'

export default defineConfig({
  files: 'out/e2e/**/*.test.js',
  workspaceFolder: 'test-fixtures/e2e-workspace',
  mocha: {
    ui: 'tdd',
    timeout: 60000
  }
})
