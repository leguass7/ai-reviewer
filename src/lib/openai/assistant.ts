import { wait } from 'src/helpers';
import { Content } from '../content';
import { AiResponse } from './interfaces';

export async function getAiResponse(prompt: Content): Promise<AiResponse> {
  await wait(500);
  return {
    reviews: [
      {
        reviewComment: 'Evite o uso de `console.log` para debugging em produção',
        lineNumber: 30020,
        reason:
          'Utilizar `console.log` pode expor informações sensíveis no log de produção e afetar a performance. Considere utilizar uma biblioteca de logging com diferentes níveis de log para ambientes de desenvolvimento e produção.'
      }
    ]
  };
}
