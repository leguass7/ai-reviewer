import type { Chunk, File } from 'parse-diff';
import type { Content } from './content';
import type { PRDetails } from './github';

// Revise o seguinte código diff no arquivo "${content.filename}" e leve em consideração o título e a descrição da solicitação pull ao escrever a resposta.
// título da PR: ${prDetails.title}
// Descrição da PR: ${prDetails.description}

// ---
// ${prDetails.description}
// ---

export function createPrompt(content: Content, prDetails: PRDetails): string {
  return `
Git diff para revisão:

\`\`\`diff
${content.content}
\`\`\`

`;
}

export type Comment = {
  body: string;
  path: string;
  line: number;
};

export async function analyzeCode(contentList: Content[], pRDetails: PRDetails) {
  const prompts = contentList.map(item => {
    const prompt = createPrompt(item, pRDetails);
    return { ...item, prompt };
  });

  // for (const file of parsedDiff) {
  //   if (file.to === '/dev/null') continue; // Ignore deleted files
  //   for (const chunk of file.chunks) {
  //     const prompt = createPrompt(file, chunk, prDetails);
  //     const aiResponse = await getAIResponse(prompt);
  //     if (aiResponse) {
  //       const newComments = createComment(file, chunk, aiResponse);
  //       if (newComments) {
  //         comments.push(...newComments);
  //       }
  //     }
  //   }
  // }
  return prompts;
}
