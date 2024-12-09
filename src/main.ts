import * as core from '@actions/core';
import { assemblesContentToAnalyze } from './lib/content';
import { parsedDifference } from './lib/diff';
import { Comment, createReviewComment, getPRDetails } from './lib/github';
import { createTopicManager } from './lib/topic-manager';
import { ValidTopic } from './lib/topic-manager/topic-manager.interface';
import { bodyComment } from './lib/openai/prompt';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const prDetails = await getPRDetails();
    const parsedDiff = await parsedDifference(prDetails);
    const contents = assemblesContentToAnalyze(parsedDiff, prDetails);

    const topicManager = await createTopicManager(prDetails);
    const topicResults = await Promise.all(contents.map(content => topicManager.syncTopic(content)));
    console.log('topicResults', topicResults?.length);

    topicResults.forEach(comment => {
      console.log('topicResults', comment.topicId, comment.success, comment.isDeleted);
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

    const comments = await createReviewComment(prDetails, commentList);

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
