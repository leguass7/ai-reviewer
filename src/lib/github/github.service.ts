import { readFileSync } from 'fs';
import * as github from '@actions/github';
import * as core from '@actions/core';
import { PRDetails, PREventData } from './github.interface';
import parseDiff, { type File } from 'parse-diff';
import { minimatch } from 'minimatch';
import { stringify } from 'src/helpers';

export class GitHubService {
  private octokit: ReturnType<typeof github.getOctokit>;
  private details: PRDetails | null = null;

  constructor() {
    const token = core.getInput('GITHUB_TOKEN') || process.env.GITHUB_TOKEN;
    if (!token) {
      core.setFailed('GITHUB_TOKEN is not set');
      process.exit(1);
    }
    this.octokit = github.getOctokit(token);
  }

  getEventData(): PREventData {
    const eventPath = process.env.GITHUB_EVENT_PATH ?? '';
    const eventData = JSON.parse(readFileSync(eventPath ?? '', 'utf8'));
    if (!eventData) {
      core.setFailed(`Event data not found: ${eventPath}`);
      process.exit(1);
    }
    return eventData as PREventData;
  }

  private excludeFilter(files: File[] | null = []) {
    if (!files) return [];
    const excludePatterns = core
      .getInput('exclude')
      .split(',')
      .map(s => s.trim());

    const filteredDiff = files.filter(file => {
      return !excludePatterns.some(pattern => minimatch(file?.to ?? '', pattern));
    });

    core.notice(`Exclude patterns: ${stringify(excludePatterns)}`);

    return filteredDiff;
  }

  private async getDiff(): Promise<string | null> {
    const { owner, repo, pullNumber } = await this.getPullRequestDetails();
    try {
      const response = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: { format: 'diff' }
      });

      // @ts-expect-error - response.data is a string
      return (response?.data || '') as string;
    } catch (error: Error | any) {
      core.setFailed(`Error getting diff: ${error?.message}`);
      process.exit(1);
    }
  }

  private async compareCommits(): Promise<string | null> {
    const { owner, repo, baseSha: base, headSha: head } = await this.getPullRequestDetails();

    if (!base || !head) return null;
    try {
      const headers = { accept: 'application/vnd.github.v3.diff' };
      const response = await this.octokit.rest.repos.compareCommits({ headers, owner, repo, base, head });
      // @ts-ignore
      return (response?.data || '') as string;
    } catch (error: Error | any) {
      core.setFailed(`Error comparing commits: ${error?.message}`);
      process.exit(1);
    }
  }

  async getPullRequestDetails(): Promise<PRDetails> {
    if (!!this.details) return this.details;

    const { repository, number, action, before, after } = this.getEventData();

    try {
      const params = { owner: repository.owner.login, repo: repository.name, pull_number: number };
      core.notice(`PR Event: ${action} #${number}`);

      const response = await this.octokit.rest.pulls.get(params);
      if (!response) throw new Error('PR details not found');
      this.details = {
        action,
        description: response.data.body,
        owner: repository.owner.login,
        pullNumber: number,
        repo: repository.name,
        title: response.data.title,
        baseSha: before || response?.data?.base?.sha,
        headSha: after || response?.data?.head?.sha
      };
      return this.details;
    } catch (error: Error | any) {
      core.setFailed(`Error getting PR details: ${error?.message}`);
      process.exit(1);
    }
  }

  async parsedDifference() {
    const { action } = await this.getPullRequestDetails();

    let diff: string | null = null;

    if (action === 'opened') {
      diff = await this.getDiff();
    } else if (action === 'synchronize') {
      const response = await this.compareCommits();
      diff = response ? String(response) || null : null;
    } else {
      core.warning(`Unsupported PR action: ${action}`);
      process.exit(0);
    }

    const parsedDiff = !!diff ? parseDiff(diff) : null;
    const result = this.excludeFilter(parsedDiff);

    if (!result?.length) {
      core.warning('No files found to analyze');
      process.exit(0);
    }

    return result;
  }
}
