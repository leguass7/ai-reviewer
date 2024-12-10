export type AiComment = {
  /** Aspecto identificado com uma breve explicação. */
  reviewComment: string;
  /** Descrição do porquê a alteração é necessária ou benéfica. */
  reason: string;
  /** Número da linha onde o problema foi encontrado. */
  lineNumber: number;
  /** Severidade do problema. */
  severity: 'error' | 'warning' | 'info';
};

export type AiResponse = {
  success?: boolean;
  topicId: string | null;
  path?: string;
  reviews: AiComment[];
};

export type TaskResult = AiResponse & {
  htmlUrl?: string;
};
