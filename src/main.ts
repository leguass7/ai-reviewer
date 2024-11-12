import * as core from '@actions/core';
import * as github from '@actions/github';
import { wait } from './helpers';
import { getEventData } from './lib/github';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const GITHUB_TOKEN: string = core.getInput('GITHUB_TOKEN');
    // const octokit = github.getOctokit(GITHUB_TOKEN);

    const eventData = getEventData();
    console.log(`Event data:`, GITHUB_TOKEN, JSON.stringify(eventData, undefined, 2));
    //   const { data: pullRequest } = await octokit.rest.pulls.get({
    //     owner: 'octokit',
    //     repo: 'rest.js',
    //     pull_number: 123,
    //     mediaType: {
    //       format: 'diff'
    //     }
    // });

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
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}
