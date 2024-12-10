import * as core from '@actions/core';
import { assemblesContentToAnalyze } from './lib/content';
import { createTopicManager } from './lib/topic-manager';
import { ValidTopic } from './lib/topic-manager/topic-manager.interface';
import { bodyComment } from './lib/openai/prompt';
import { GitHubService } from './lib/github/github.service';
import { createGithubService } from './lib/github';
import { Comment, createReviewComment } from './lib/github_old';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const githubService = createGithubService();
    const pullRequestDetails = await githubService.getPullRequestDetails();
    const parsedDiff = await githubService.parsedDifference();

    const contents = assemblesContentToAnalyze(parsedDiff, pullRequestDetails);

    const topicManager = await createTopicManager(githubService);
    const topicResults = await Promise.all(contents.map(content => topicManager.syncTopic(content)));

    const aiComments = await topicManager.codeAnalyzer.analyze(topicResults);

    const urls = aiComments.map(comment => comment.htmlUrl).join(', ');
    // Set outputs for other workflow steps to use
    core.setOutput('commentUrl', urls);
    core.setOutput('countComments', aiComments?.length);
    core.setOutput('countFiles', contents?.length);

    process.exit(0);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
    process.exit(1);
  }
}
