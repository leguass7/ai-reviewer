import { compareCommits, getDiff, PRDetails } from './github';
import parseDiff, { Chunk, File } from 'parse-diff';
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

  core.debug(`EXCLUDE PATTERNS: ${stringify(excludePatterns)}`);

  return filteredDiff;
}

export async function parsedDifference(params: PRDetails) {
  const { action, baseSha, headSha, ...prDetails } = params;

  let diff: string | null = null;

  core.debug(`PR DIFF ACTION: ${action}`);

  if (action === 'opened') {
    diff = await getDiff(prDetails.owner, prDetails.repo, prDetails.pullNumber);
  } else if (action === 'synchronize') {
    const response = await compareCommits(params);
    diff = response ? String(response) || null : null;
  }

  const parsedDiff = !!diff ? parseDiff(diff) : null;
  const result = excludeFilter(parsedDiff);
  // result?.forEach((file: File) => {
  //   console.log('parsedDiff file chunks:', file);
  //   file.chunks.forEach((chunk: Chunk) => {
  //     console.log('parsedDiff chunk changes:', chunk.content, '\n', chunk.changes);
  //   });
  // });

  return result;
}
