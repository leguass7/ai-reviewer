import * as core from '@actions/core';
import { assemblesContentToAnalyze } from './lib/content';
import { parsedDifference } from './lib/diff';
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

    const topicManager = await createTopicManager(pullRequestDetails);
    const topicResults = await Promise.all(contents.map(content => topicManager.syncTopic(content)));
    console.log('topicResults', topicResults?.length);

    topicResults.forEach(comment => {
      console.log(
        'topicResults: ',
        `file=${comment.filename}`,
        `topicId=${comment.topicId}`,
        `success=${comment.success}`,
        `isDeleted=${comment.isDeleted}`
      );
    });

    const validTopics = topicResults.filter(({ isDeleted, success, topicId }) => !isDeleted && success && topicId) as ValidTopic[];

    console.log('validTopics', validTopics?.length);
    // process.exit(0);

    const aiComments = await topicManager.codeAnalyzer.analyze(validTopics);
    const commentList = aiComments.reduce((acc, item) => {
      if (item?.success && item?.reviews?.length) {
        if (!!item?.path) {
          item?.reviews.forEach(review => {
            if (!!review?.reviewComment) acc.push({ body: bodyComment(review), path: item.path as string, line: review.lineNumber });
          });
        }
      }

      return acc;
    }, [] as Comment[]);

    const comments = await createReviewComment(pullRequestDetails, commentList);

    // Set outputs for other workflow steps to use
    core.setOutput('commentUrl', comments?.url);
    core.setOutput('countComments', commentList?.length);
    core.setOutput('countFiles', contents?.length);

    process.exit(0);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
    process.exit(1);
  }
}
