import { extractJson, stringify } from 'src/helpers';
import { Content } from '../content';
import { PRDetails } from '../github';
import { getAiResponse, getOpenAiSettings } from './assistant';
import { AiComment, AiResponse } from './interfaces';
import { OpenAiService, RunnerResult, RunnerResultSuccess } from './openai.service';
import { createFirstThreadMessage, createPrompt } from './prompt';
import { addQueue, QueueTaskHandler } from './queue';
import * as core from '@actions/core';

function safeReturnDto(d: RunnerResult | null): AiResponse {
  if (d?.success) {
    const { content } = d as RunnerResultSuccess;
    const reviews = extractJson<AiResponse>(content);
    return { success: !!reviews, ...((reviews || {}) as AiResponse) };
  }
  return { success: !!d?.success, reviews: [] };
}

export async function analyzeCode(contentList: Content[], pRDetails: PRDetails) {
  const prompts = contentList.map(item => {
    const prompt = createPrompt(item, pRDetails);
    return { ...item, prompt };
  });

  const { assistantId, openAiApiKey, language } = getOpenAiSettings();
  const openAiService = new OpenAiService(openAiApiKey, assistantId);

  const thread = await openAiService.assistantCreateThread({
    messages: [createFirstThreadMessage(pRDetails)],
    metadata: { repo: pRDetails.repo, pullNumber: `${pRDetails.pullNumber}` }
  });

  if (!thread?.id) {
    core.setFailed('No thread found');
    process.exit(1);
  }

  const additionalInstructions = `Responda no idiôma '${language}'`;

  const createTask = (prompt: Content) => {
    const handler: QueueTaskHandler<AiResponse> = async ({ jobId }) => {
      console.log('jobId', jobId, 'prompt', prompt);
      const content = `${prompt?.prompt}`;
      const metadata = { filename: prompt.filename };
      const created = await openAiService.assistantThreadCreateMessage(thread.id, content, metadata);
      if (!created) return { reviews: [] };
      const response = await openAiService.assistantCreateRunner(thread.id, { additionalInstructions });
      console.log('response', response);
      return safeReturnDto(response);
    };
    return handler;
  };

  const comments = await Promise.all(prompts.map(async prompt => addQueue(createTask(prompt))));
  if (!comments?.length) {
    core.info('No comments found');
    process.exit(0);
  }

  comments?.forEach(comment => {
    console.log('comment', stringify(comment));
  });

  // for (const file of parsedDiff) {
  //   if (file.to === '/dev/null') continue; // Ignore deleted files
  //   for (const chunk of file.chunks) {
  //     const prompt = createPrompt(file, chunk, prDetails);
  //     const aiResponse = await getAIResponse(prompt);
  //     if (aiResponse) {
  //       const newComments = createComment(file, chunk, aiResponse);
  //       if (newComments) {
  //         comments.push(...newComments);
  //       }
  //     }
  //   }
  // }

  // console.log('w', await w);
  return comments;
}
