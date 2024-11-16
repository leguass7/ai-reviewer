import { Content } from '../content';
import { PRDetails } from '../github';
import { getAiResponse, getOpenAiSettings } from './assistant';
import { AiResponse } from './interfaces';
import { createPrompt } from './prompt';
import { addQueue, QueueTaskHandler } from './queue';
import * as core from '@actions/core';

export async function analyzeCode(contentList: Content[], pRDetails: PRDetails) {
  const openAiSettings = getOpenAiSettings();

  const prompts = contentList.map(item => {
    const prompt = createPrompt(item, pRDetails);
    return { ...item, prompt };
  });

  const createTask = (prompt: Content) => {
    const handler: QueueTaskHandler<AiResponse> = async ({ jobId }) => {
      console.log('jobId', jobId, 'prompt', prompt);
      return getAiResponse(prompt);
    };
    return handler;
  };

  const comments = await Promise.all(prompts.map(async prompt => addQueue(createTask(prompt))));
  if (!comments?.length) {
    core.info('No comments found');
    process.exit(0);
  }

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
