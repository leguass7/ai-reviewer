import { ThreadCreateParams } from 'openai/resources/beta/threads/threads';
import { Content } from '../content';
import { PRDetails } from '../github';

export type TopicContent = Content & { topicId?: string; success: boolean; isDeleted?: boolean; error?: string };
export type PullRequestDetails = PRDetails;

export type CreateNewTopicParams = {
  prNumber: number;
  repo: string;
  firstMessage: ThreadCreateParams.Message;
};

export type ValidTopic = Content & {
  topicId: string;
  success: boolean;
  isDeleted?: boolean;
};

export type TopicMessageCreate = {
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
};
