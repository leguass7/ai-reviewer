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

export function createPrompt(content: Content, prDetails: PRDetails): string {
  return `
Git diff para revisão:

\`\`\`diff
${content.content}
\`\`\`

`;
}

export function bodyComment({ reviewComment, reason }: AiComment): string {
  return `
${reviewComment || ''}
${reason || ''}
`;
}
