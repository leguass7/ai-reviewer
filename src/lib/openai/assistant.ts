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
