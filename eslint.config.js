import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/** Regras que valem tanto para JS quanto para TS. */
const regrasComuns = {
  // ADR-005 e constituição Art. 9: nenhum componente faz I/O de rede.
  // Esta é a checagem barata; a verificação estrutural é TEST-PF-022.
  'no-restricted-imports': ['error', {
    paths: [
      { name: 'axios', message: 'ADR-005: nenhum componente faz I/O de rede.' },
      { name: 'node-fetch', message: 'ADR-005: nenhum componente faz I/O de rede.' },
      { name: 'got', message: 'ADR-005: nenhum componente faz I/O de rede.' },
    ],
    patterns: [
      {
        group: ['node:http', 'node:https', 'node:net', 'node:dgram', 'node:tls'],
        message: 'ADR-005: nenhum componente faz I/O de rede.',
      },
    ],
  }],
  'prefer-const': 'error',
  'eqeqeq': ['error', 'always'],
  'no-console': 'off',
}

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'examples/**',
      // Templates contêm marcadores {{…}} e não são código executável.
      'plugins/sdd-kit/templates/**',
      // A extensão VS Code é um subprojeto npm próprio, com eslint e CI próprios
      // (job "Extensão VS Code"). O lint do root não deve relintá-la com esta
      // config — que não define os globals de Node dos scripts .mjs/.cjs dela.
      'extensions_vscode/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: regrasComuns,
  },
  {
    // Ferramenta de desenvolvimento, não componente do produto: `scripts/` não é
    // empacotado no plugin nem na extensão, e roda só na máquina de quem desenvolve.
    //
    // Dois ajustes, ambos estreitos:
    //
    // 1. Globals de Node. Estes arquivos são `.mjs` executados por `node`, então
    //    `process`, `console` e `URL` existem — a config base não os declara e acusava
    //    `no-undef` em todos.
    //
    // 2. `node:http` liberado APENAS aqui. O Artigo 9.4 diz "nenhum código sai para
    //    serviço externo sem ação explícita"; o painel de progresso serve `localhost` e
    //    não manda nada para fora, então não viola a regra — viola o proxy barato dela,
    //    como o próprio comentário acima reconhece ser. A verificação estrutural que vale
    //    para o produto é TEST-PF-022, e ela não olha para `scripts/`.
    files: ['scripts/**/*.mjs', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      ...regrasComuns,
      'no-restricted-imports': 'off',
    },
  },
  ...tseslint.configs.recommended.map((c) => ({ ...c, files: ['**/*.ts'] })),
  {
    files: ['**/*.ts'],
    rules: {
      ...regrasComuns,
      // Os testes navegam YAML e JSON arbitrários; `any` na fronteira de
      // desserialização é honesto e evita asserções de tipo espalhadas.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
