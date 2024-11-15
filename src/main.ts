import * as core from '@actions/core';
import * as github from '@actions/github';
import { wait } from './helpers';
import { parsedDifference } from './lib/diff';
import { getPRDetails } from './lib/github';
import { assemblesContentToAnalyze } from './lib/content';
import { analyzeCode } from './lib/openapi';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const prDetails = await getPRDetails();
    if (!prDetails) throw new Error('PR details not found');

    const parsedDiff = await parsedDifference(prDetails);
    if (!parsedDiff || !parsedDiff?.length) throw new Error('diff not found');

    const contents = assemblesContentToAnalyze(parsedDiff, prDetails);
    contents.map(c => console.log('CONTENTS:', c.filename, '\n', c.content));

    const comments = await analyzeCode(contents, prDetails);
    comments.forEach(c => console.log('COMMENTS:', c?.prompt));

    await wait(parseInt('1000', 10));

    // Set outputs for other workflow steps to use
    core.setOutput('countFiles', contents?.length);

    const context = github?.context;
    const payload = JSON.stringify(context, undefined, 2);
    // console.log(`CONTEXT PAYLOAD: ${payload}`);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
