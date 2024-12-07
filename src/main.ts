import * as core from '@actions/core';
import { assemblesContentToAnalyze } from './lib/content';
import { parsedDifference } from './lib/diff';
import { getPRDetails } from './lib/github';
import { analyzeCode } from './lib/openai';
import { createTopicManager } from './lib/topic-manager';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const prDetails = await getPRDetails();
    const parsedDiff = await parsedDifference(prDetails);
    const contents = assemblesContentToAnalyze(parsedDiff, prDetails);

    const topicManager = await createTopicManager();

    // console.log('coments', contents);
    process.exit(0);

    const comments = await analyzeCode(contents, prDetails);
    const urls = comments?.map(comment => comment?.data?.htmlUrl).filter(Boolean);

    // Set outputs for other workflow steps to use
    core.setOutput('commentUrl', urls.join(', '));
    core.setOutput('countComments', comments?.length);
    core.setOutput('countFiles', contents?.length);

    process.exit(0);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
    process.exit(1);
  }
}
