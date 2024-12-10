import * as core from '@actions/core';
import { extractJson } from 'src/helpers';
import { addQueue, QueueTaskHandler } from 'src/lib/topic-manager/code-analyzer/queue';
import { AiResponse, TaskResult } from '../../openai/interfaces';
import { RunnerResult, RunnerResultSuccess } from '../../openai/openai.service';
import { createPrompt, getAdditionalInstructions } from '../../openai/prompt';
import { TopicManager } from '../topic-manager';
import { PullRequestDetails, ValidTopic } from '../topic-manager.interface';

export class CodeAnalyzer {
  constructor(
    private readonly prDetails: PullRequestDetails,
    private readonly manager: TopicManager
  ) {}

  private safeReturnDto(d: RunnerResult | null): AiResponse {
    if (!d?.success) return { success: false, reviews: [], topicId: null };
    const { content } = d as RunnerResultSuccess;
    const reviews = extractJson<AiResponse>(content);
    return { success: !!reviews, ...((reviews || {}) as AiResponse) };
  }

  private preparePrompts(contentList: ValidTopic[]) {
    return contentList.map(item => ({
      ...item,
      prompt: createPrompt(item)
    }));
  }

  private getLanguageInstructions(language = 'pt-br') {
    return getAdditionalInstructions(language);
  }

  private createAnalysisTask(prompt: ValidTopic, additionalInstructions: string): QueueTaskHandler<TaskResult> {
    return async ({ jobId = '--' }) => {
      const threadId = prompt.topicId;
      return this.processThread(jobId, prompt, threadId, additionalInstructions);
    };
  }

  private async processThread(jobId: string, prompt: ValidTopic, threadId: string, additionalInstructions: string): Promise<TaskResult> {
    core.info(`Processing job ${jobId} ${prompt.filename} threadId: ${threadId}`);

    const messageCreated = await this.manager.createTopicMessage(threadId, {
      role: 'user',
      content: prompt?.prompt || '--',
      metadata: { filename: prompt.filename }
    });
    if (!messageCreated) return { reviews: [], success: false, topicId: threadId };

    return this.processResponse(threadId, prompt.filename, additionalInstructions);
  }

  private async processResponse(topicId: string, filename: string, additionalInstructions: string): Promise<TaskResult> {
    const response = await this.manager.openAiService.assistantCreateRunner(topicId, { additionalInstructions });
    const comment: TaskResult = { ...this.safeReturnDto(response), path: filename, topicId };

    if (!comment?.success || !comment?.reviews?.length) {
      core.info(`No comments found for ${filename}`);
    } else {
      const content = JSON.stringify({ reviews: comment?.reviews || [] }, null, 2);
      await this.manager.createTopicMessage(topicId, { role: 'assistant', content });
    }

    return comment;
  }

  async analyze(contentList: ValidTopic[]) {
    const prompts = this.preparePrompts(contentList);
    const { language } = this.manager.openAiService.getOptions();
    const additionalInstructions = this.getLanguageInstructions(language);

    // Criar as tasks e adicionar à fila
    const tasks = await Promise.all(prompts.map(prompt => addQueue(this.createAnalysisTask(prompt, additionalInstructions))));
    const results = tasks.filter(({ success }) => !!success).map(({ data }) => data) as TaskResult[];

    return results;
  }
}
