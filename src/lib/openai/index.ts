import { extractJson, stringify } from 'src/helpers';
import { Content } from '../content';
import { Comment, PRDetails } from '../github';
import { getAiResponse, getOpenAiSettings } from './assistant';
import { AiComment, AiResponse } from './interfaces';
import { OpenAiService, RunnerResult, RunnerResultSuccess } from './openai.service';
import { bodyComment, createFirstThreadMessage, createPrompt } from './prompt';
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
      if (!created) return { reviews: [], success: false };
      const response = await openAiService.assistantCreateRunner(thread.id, { additionalInstructions });
      return { ...safeReturnDto(response), path: prompt.filename };
    };
    return handler;
  };

  const aiComments = await Promise.all(prompts.map(async prompt => addQueue(createTask(prompt))));
  if (!aiComments?.length) {
    core.info('No comments found');
    process.exit(0);
  }

  const comments: Comment[] = aiComments
    ?.filter(({ success, data }) => success && !!data?.success && !!data?.reviews?.length)
    .reduce((acc, { data }) => {
      const { reviews, path } = data as AiResponse;
      reviews.forEach(review => {
        acc.push({ body: bodyComment(review), path: path || '', line: review.lineNumber });
      });
      return acc;
    }, [] as Comment[]);

  if (!comments?.length) {
    core.info('No comments found');
    process.exit(0);
  }

  return comments;
}
