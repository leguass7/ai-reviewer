import { getDataSource } from '../datasource';
import { TopicService } from '../datasource/topic.service';
import { getOpenAiSettings } from '../openai/assistant';
import { OpenAiService } from '../openai/openai.service';
import { PullRequestDetails } from './topic-manager.interface';
import { TopicManager } from './topic-manager';

export async function createTopicManager(pullRequestDetails: PullRequestDetails) {
  const dataSource = await getDataSource();
  const topicService = new TopicService(dataSource);

  const options = getOpenAiSettings();
  const openAiService = new OpenAiService(options);

  return new TopicManager(pullRequestDetails, topicService, openAiService);
}
