export type AiComment = {
  reviewComment: string;
  reason: string;
  lineNumber: number;
};

export type AiResponse = {
  reviews: AiComment[];
};
