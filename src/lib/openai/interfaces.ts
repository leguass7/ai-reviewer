export type AiComment = {
  reviewComment: string;
  reason: string;
  lineNumber: number;
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
