import { wait } from 'src/helpers';
import { Content } from '../content';
import { AiResponse } from './interfaces';
import * as core from '@actions/core';

export function getOpenAiSettings() {
  const openAiApiKey = core.getInput('OPENAI_API_KEY');
  const assistantId = core.getInput('OPENAI_ASSISTANT_ID');
  const language = core.getInput('LANGUAGE') || 'pt-br';

  if (!openAiApiKey) {
    core.setFailed('OpenAI API Key is required');
    process.exit(1);
  }

  if (!assistantId) {
    core.setFailed('Assistant ID is required');
    process.exit(1);
  }

  return { openAiApiKey, assistantId, language };
}

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
