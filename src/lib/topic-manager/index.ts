import { getDataSource } from '../datasource/index.js';
import { TopicService } from '../datasource/topic.service.ts';
import { getOpenAiSettings } from '../openai/assistant';
import { OpenAiService } from '../openai/openai.service';
import { TopicManager } from './topic-manager';

export async function createTopicManager() {
  const dataSource = await getDataSource();
  const topicService = new TopicService(dataSource);

  const options = getOpenAiSettings();
  const openAiService = new OpenAiService(options);

  return new TopicManager(topicService, openAiService);
}
