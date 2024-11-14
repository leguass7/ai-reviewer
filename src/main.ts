import * as core from '@actions/core';
import * as github from '@actions/github';
import { wait } from './helpers';
import { parsedDifference } from './lib/diff';
import { getPRDetails } from './lib/github';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const prDetails = await getPRDetails();
    if (!prDetails) throw new Error('PR details not found');

    const parsedDiff = await parsedDifference(prDetails);
    if (!parsedDiff) throw new Error('diff not found');

    const ms: string = core.getInput('milliseconds');

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${ms} milliseconds ...`);

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString());
    await wait(parseInt(ms, 10));
    core.debug(new Date().toTimeString());

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString());

    const context = github?.context;
    const payload = JSON.stringify(context, undefined, 2);
    console.log(`CONTEXT PAYLOAD: ${payload}`);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
