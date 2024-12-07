import { readFileSync } from 'fs';
import * as github from '@actions/github';
import * as core from '@actions/core';

export function getGithubToken(): string {
  const token = core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN;
  if (!token) {
    core.setFailed('GITHUB_TOKEN is not set');
    process.exit(1);
  }
  return token;
}

type PREventData = {
  number: number;
  action: 'opened' | 'closed' | 'reopened' | 'synchronize';
  state: 'open';
  locked: boolean;
  title: string;
  repository: {
    name: string;
    owner: {
      avatar_url: string;
      email: string;
      id: number;
      login: string;
      name: string;
    };
  };
  before?: string;
  after?: string;
};

export function getEventData(): PREventData {
  const eventPath = process.env.GITHUB_EVENT_PATH ?? '';
  const eventData = JSON.parse(readFileSync(eventPath ?? '', 'utf8'));
  // console.log('\neventData\n', stringify(eventData));
  if (!eventData) {
    core.setFailed(`Event data not found: ${eventPath}`);
    process.exit(1);
  }
  return eventData as PREventData;
}

export type PRDetails = {
  action: 'opened' | 'closed' | 'reopened' | 'synchronize';
  owner: string;
  repo: string;
  pullNumber: number;
  title: string;
  description: string | null;
  baseSha?: string; // before
  headSha?: string; // after
};

export async function getPRDetails(): Promise<PRDetails> {
  const token = getGithubToken();
  const event = getEventData();
  // console.log('EVENT', stringify(event));
  core.notice(`PR Event: ${event?.action}`);

  const params = {
    owner: event.repository.owner.login,
    repo: event.repository.name,
    pull_number: event.number
  };

  const octokit = github.getOctokit(token);
  const response = await octokit.rest.pulls.get(params);

  if (!response) {
    core.setFailed('PR details not found');
    process.exit(1);
  }

  const result: PRDetails = {
    action: event.action,
    description: response.data.body,
    owner: event.repository.owner.login,
    pullNumber: event.number,
    repo: event.repository.name,
    title: response.data.title,
    baseSha: event?.before || response?.data?.base?.sha,
    headSha: event?.after || response?.data?.head?.sha
  };

  return result;
}

export async function getDiff(owner: string, repo: string, pullNumber: number): Promise<string | null> {
  const token = getGithubToken();
  const octokit = github.getOctokit(token);

  const response = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: { format: 'diff' }
  });
  // @ts-expect-error - response.data is a string
  return (response?.data || '') as string;
}

export async function compareCommits({ owner, repo, baseSha, headSha }: PRDetails) {
  const token = getGithubToken();

  if (!baseSha || !headSha) return null;

  const octokit = github.getOctokit(token);
  const response = await octokit.rest.repos.compareCommits({
    headers: { accept: 'application/vnd.github.v3.diff' },
    owner,
    repo,
    base: baseSha,
    head: headSha
  });

  // @ts-ignore
  return (response?.data || '') as string;
}

export type Comment = {
  body: string;
  path: string;
  line: number;
};
export async function createReviewComment({ owner, repo, pullNumber }: PRDetails, comments: Comment[]) {
  const token = getGithubToken();
  const octokit = github.getOctokit(token);
  const filename = comments?.[0]?.path;

  const message = `filename: ${filename}, comments: ${comments?.length}`;

  try {
    const response = await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      comments,
      event: 'COMMENT'
    });

    if (!response) {
      core.info(`Failed to create review: ${message}`);
      process.exit(0);
    }

    if (response?.data.html_url) {
      core.notice(`Review comment created: ${response?.data.html_url}`);
    }
    return response;
  } catch (error: any) {
    core.setFailed(`Failed to create review (${message}): ${error?.message}`);
    return null;
  }
}
