import { ThreadCreateParams } from 'openai/resources/beta/threads/threads';
import { Content } from '../content';
import type { PRDetails } from '../github';
import { AiComment } from './interfaces';

export function createFirstThreadMessage({ pullNumber, action, description, title, repo }: PRDetails): ThreadCreateParams.Message {
  return {
    role: 'user',
    content: `
Revise a pull request e forneça feedback sobre as alterações propostas. Considere o seguinte contexto:
Repositório: ${repo}
Número da PR: ${pullNumber}
Evento da PR: ${action}

Título da PR: ${title}

Descrição da PR:

${description}

`
  };
}

export function createPrompt(content: Content): string {
  return `
Git diff para revisão:

filename: \`${content.filename}\`

\`\`\`diff
${content.content}
\`\`\`

`;
}

export function getAdditionalInstructions(language: string = 'pt-br'): string {
  return `IMPORTANTE:
- Não faça comentários positivos ou elogios;
- Responda no idiôma '${language}'.`;
}

export function bodyComment({ reviewComment, reason }: AiComment): string {
  return `
${reviewComment || ''}
${reason || ''}
`;
}
