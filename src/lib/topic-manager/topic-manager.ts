import { TopicService } from '../datasource/topic.service.ts/index.js';
import { OpenAiService } from '../openai/openai.service.js';

export type CreateTopicParams = {
  projectId: string;
  filename: string;
};

export class TopicManager {
  constructor(
    public readonly topicService: TopicService,
    public readonly openAiService: OpenAiService
  ) {}

  async createOrRetrieveTopic({ filename, projectId }: CreateTopicParams) {
    const topic = await this.topicService.findOne({ projectId, file: filename });
  }
}
