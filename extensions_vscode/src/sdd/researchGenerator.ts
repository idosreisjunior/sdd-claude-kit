// Núcleo puro específico do research (feature 0017, RF-007) — sem a API do VS Code
// (standards §6, NFR-RES-003). O contrato das oito frentes. A montagem do
// esqueleto é compartilhada em skeleton.ts (`buildSkeleton`). Por ADR-017.

/**
 * As oito frentes de research do RF-007. É o CONTRATO do template
 * `feature/research.md`: o teste garante que o template não derive desta lista.
 */
export const RESEARCH_TOPICS = [
  'Estrutura do projeto',
  'Arquivos relacionados',
  'Dependências',
  'Padrões existentes',
  'Documentação local',
  'Riscos',
  'Soluções já implementadas',
  'APIs e integrações relevantes',
] as const
