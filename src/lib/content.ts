import type { File, Chunk } from 'parse-diff';
import type { PRDetails } from './github';
import * as core from '@actions/core';

function removeDeletedFilter(file: File) {
  const conditions = [
    file.to === '/dev/null',
    file?.chunks?.length <= 0
    //...
  ];

  return !conditions.some(condition => condition);
}

function chunkToContent(chunk: Chunk): string {
  const changeLines = chunk.changes
    .map(change => {
      if (change?.type === 'normal') return `${change?.ln1 ? change?.ln1 : change?.ln2} ${change?.content || ''}`;
      return `${change?.ln ? change?.ln : ''} ${change?.content || ''}`;
    })
    .join('\n');

  return `
${chunk?.content}
${changeLines}
`;
}

export type Content = {
  filename: string;
  content: string;
  prTitle: string;
  prDescription: string;
  prompt?: string;
};

export function assemblesContentToAnalyze(parsedDiff: File[], prDetails: PRDetails): Content[] {
  const content = parsedDiff.filter(removeDeletedFilter).reduce((acc, file) => {
    acc.push({
      filename: file.to ?? '',
      content: file.chunks.map(chunkToContent).join('\n'),
      prTitle: prDetails.title,
      prDescription: prDetails.description ?? ''
    });
    return acc;
  }, [] as Content[]);

  if (!content?.length) {
    core.info('No files found to analyze');
    process.exit(0);
  }

  return content;
}
