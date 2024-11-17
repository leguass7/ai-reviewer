import * as core from '@actions/core';
import { extractJson } from 'src/helpers';
import { Content } from '../content';
import { Comment, createReviewComment, PRDetails } from '../github';
import { getOpenAiSettings } from './assistant';
import { AiResponse } from './interfaces';
import { OpenAiService, RunnerResult, RunnerResultSuccess } from './openai.service';
import { bodyComment, createFirstThreadMessage, createPrompt, getAdditionalInstructions } from './prompt';
import { addQueue, QueueTaskHandler } from './queue';

type TaskResult = AiResponse & {
  htmlUrl?: string;
};

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

  const additionalInstructions = getAdditionalInstructions(language);

  const createTask = (prompt: Content) => {
    const handler: QueueTaskHandler<TaskResult> = async ({ jobId }) => {
      core.info(`Processing job ${jobId} ${prompt.filename}`);
      const content = `${prompt?.prompt}`;
      const metadata = { filename: prompt.filename };

      const created = await openAiService.assistantThreadCreateMessage(thread.id, content, metadata);
      if (!created) return { reviews: [], success: false };

      const response = await openAiService.assistantCreateRunner(thread.id, { additionalInstructions });

      const comment = { ...safeReturnDto(response), path: prompt.filename };

      if (!comment?.success || !comment?.reviews?.length) {
        core.info(`No comments found for ${prompt.filename}`);
        return comment;
      }

      const batch: Comment[] = comment.reviews.map(review => ({ body: bodyComment(review), path: prompt.filename, line: review.lineNumber }));
      const resComment = await createReviewComment(pRDetails, batch);

      const htmlUrl = resComment?.data?.html_url;

      if (htmlUrl) {
        core.notice(`Comment created for ${prompt.filename}: ${resComment?.data?.html_url}`);
      }

      return { ...comment, htmlUrl };
    };
    return handler;
  };

  const aiComments = await Promise.all(prompts.map(async prompt => addQueue(createTask(prompt))));

  if (!aiComments?.length) {
    core.info('No comments found');
    process.exit(0);
  }

  await openAiService.assistentRemoveThread(thread.id);

  return aiComments;
}
