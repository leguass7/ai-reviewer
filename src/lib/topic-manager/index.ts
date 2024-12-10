import { getDataSource } from '../datasource';
import { TopicService } from '../datasource/topic.service';
import { getOpenAiSettings } from '../openai/assistant';
import { OpenAiService } from '../openai/openai.service';
import { TopicManager } from './topic-manager';
import type { GitHubService } from '../github';

export async function createTopicManager(githubService: GitHubService): Promise<TopicManager> {
  const dataSource = await getDataSource();
  const topicService = new TopicService(dataSource);

  const options = getOpenAiSettings();
  const openAiService = new OpenAiService(options);
  const topicManager = new TopicManager(githubService, topicService, openAiService);
  return topicManager.init();
}
