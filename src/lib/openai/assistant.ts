import * as core from '@actions/core';
import type { ChatModel } from 'openai/resources';
import { OpenAiOptions } from './openai.service';

export function getOpenAiSettings(): OpenAiOptions {
  const apiKey = core.getInput('OPENAI_API_KEY');
  const assistantId = core.getInput('OPENAI_ASSISTANT_ID');
  const language = core.getInput('LANGUAGE') || 'pt-br';
  const model = (core.getInput('MODEL') || 'gpt-4-turbo') as ChatModel;

  if (!apiKey) {
    core.setFailed('OpenAI API Key is required');
    process.exit(1);
  }

  if (!assistantId) {
    core.setFailed('Assistant ID is required');
    process.exit(1);
  }

  return { apiKey, assistantId, language, model };
}
