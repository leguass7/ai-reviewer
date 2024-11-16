import { Content } from '../content';
import type { PRDetails } from '../github';

// Revise o seguinte código diff no arquivo "${content.filename}" e leve em consideração o título e a descrição da solicitação pull ao escrever a resposta.
// título da PR: ${prDetails.title}
// Descrição da PR: ${prDetails.description}

// ---
// ${prDetails.description}
// ---

export function createPrompt(content: Content, prDetails: PRDetails): string {
  return `
Git diff para revisão:

\`\`\`diff
${content.content}
\`\`\`

`;
}
