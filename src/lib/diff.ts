import { compareCommits, getDiff, PRDetails } from './github';
import parseDiff, { type File } from 'parse-diff';
import * as core from '@actions/core';
import { minimatch } from 'minimatch';
import { stringify } from 'src/helpers';

export function excludeFilter(files: File[] | null = []) {
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

export async function parsedDifference(params: PRDetails) {
  const { action, baseSha, headSha, ...prDetails } = params;

  let diff: string | null = null;

  if (action === 'opened') {
    diff = await getDiff(prDetails.owner, prDetails.repo, prDetails.pullNumber);
  } else if (action === 'synchronize') {
    const response = await compareCommits(params);
    diff = response ? String(response) || null : null;
  } else {
    core.warning(`Unsupported PR action: ${action}`);
    process.exit(0);
  }

  const parsedDiff = !!diff ? parseDiff(diff) : null;
  const result = excludeFilter(parsedDiff);

  if (!result?.length) {
    core.warning('No files found to analyze');
    process.exit(0);
  }

  return result;
}
