// Teste de integração (E2E) — TEST-WIZ-010, feature 0035 (TASK-WIZ-009).
//
// O workspace de fixture não tem nenhuma mudança registrada, que é exatamente o
// SCN-WIZ-011: abrir o assistente sem nó deve apresentar o hub com as boas-vindas.
//
// Este teste guarda uma regressão concreta: antes da TASK-WIZ-009, `openWizard` sem nó
// abria um QuickPick (ou desistia com uma mensagem) em vez de abrir o painel. Um
// QuickPick trava a execução, então o próprio fato de o comando resolver e deixar a aba
// aberta é a asserção. O conteúdo renderizado dentro do webview não é alcançável daqui.
import * as assert from 'assert'
import * as vscode from 'vscode'

const EXT_ID = 'idosreisjunior.sdd-claude-kit-vscode'
const PANEL_TITLE = 'Assistente SDD'

function wizardTabs(): vscode.Tab[] {
  return vscode.window.tabGroups.all
    .flatMap((group) => group.tabs)
    .filter((tab) => tab.label === PANEL_TITLE)
}

suite('E2E: hub do assistente', () => {
  suiteSetup(async () => {
    await vscode.extensions.getExtension(EXT_ID)?.activate()
  })

  test('TEST-WIZ-010 — openWizard sem nó abre o hub, sem QuickPick (SCN-WIZ-011)', async () => {
    assert.deepStrictEqual(wizardTabs(), [], 'o assistente não deveria estar aberto ainda')

    // Resolve porque não há mais QuickPick no caminho: um modal deixaria isto pendurado
    // até o timeout do mocha.
    await vscode.commands.executeCommand('sddClaudeKit.openWizard')

    const tabs = wizardTabs()
    assert.strictEqual(tabs.length, 1, `esperava a aba "${PANEL_TITLE}" aberta`)
    // Sem mudança escolhida, o título fica genérico — é o modo hub, não uma mudança.
    assert.strictEqual(tabs[0].label, PANEL_TITLE)

    await vscode.window.tabGroups.close(tabs[0])
  })
})
