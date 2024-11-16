export type AiComment = {
  reviewComment: string;
  reason: string;
  lineNumber: number;
};

export type AiResponse = {
  success?: boolean;
  path?: string;
  reviews: AiComment[];
};
