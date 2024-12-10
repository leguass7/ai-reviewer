import * as core from '@actions/core';
import { assemblesContentToAnalyze } from './lib/content';
import { createGithubService } from './lib/github';
import { createTopicManager } from './lib/topic-manager';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const githubService = await createGithubService();
    const pullRequestDetails = await githubService.getPullRequestDetails();
    const parsedDiff = await githubService.parsedDifference();

    const contents = assemblesContentToAnalyze(parsedDiff, pullRequestDetails);

    const topicManager = await createTopicManager(githubService);
    const topicResults = await Promise.all(contents.map(content => topicManager.syncTopic(content)));

    const aiComments = await topicManager.codeAnalyzer.analyze(topicResults);
    const totalComments = aiComments.reduce((acc, comment) => acc + comment?.reviews?.length, 0);

    const urls = aiComments
      .map(comment => comment?.htmlUrl)
      .filter(Boolean)
      .join(', ');
    // Set outputs for other workflow steps to use
    core.setOutput('commentUrl', urls);
    core.setOutput('countComments', totalComments);
    core.setOutput('countFiles', contents?.length);

    process.exit(0);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
    process.exit(1);
  }
}
