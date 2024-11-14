import { readFileSync } from 'fs';
import * as github from '@actions/github';
import * as core from '@actions/core';
import { stringify } from 'src/helpers';

export function getGithubToken(): string {
  return core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN || '';
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
  return eventData;
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

export async function getPRDetails(): Promise<PRDetails | null> {
  const token = getGithubToken();
  if (!token) throw new Error('GITHUB_TOKEN is not set');

  const event = getEventData();

  console.log('EVENT: \n', stringify(event));

  const params = {
    owner: event.repository.owner.login,
    repo: event.repository.name,
    pull_number: event.number
  };

  const octokit = github.getOctokit(token);

  console.log('PARAMS: \n', stringify(params));
  const response = await octokit.rest.pulls.get(params);

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
  if (!token) throw new Error('GITHUB_TOKEN is not set');

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
  if (!token) throw new Error('GITHUB_TOKEN is not set');

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
