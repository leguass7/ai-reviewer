import { compareCommits, getDiff, PRDetails } from './github';
import parseDiff, { Chunk, File } from 'parse-diff';

export async function parsedDifference(params: PRDetails) {
  const { action, baseSha, headSha, ...prDetails } = params;

  let diff: string | null = null;

  console.log('parsedDifference action:', action);

  if (action === 'opened') {
    diff = await getDiff(prDetails.owner, prDetails.repo, prDetails.pullNumber);
  } else if (action === 'synchronize') {
    const response = await compareCommits(params);
    diff = response ? String(response) || null : null;
  }

  const parsedDiff = !!diff ? parseDiff(diff) : null;
  console.log('parsedDiff:', parsedDiff);
  return parsedDiff;
}
