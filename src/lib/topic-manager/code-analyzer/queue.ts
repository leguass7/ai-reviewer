import PQueue from 'p-queue';
import { randomUUID } from 'crypto';

export const queue = new PQueue({ concurrency: 1 });

export type QueueData = {
  jobId?: string;
};

export type QueueTaskResult<T = unknown> = {
  jobId: string;
  success: boolean;
  data?: T;
};

export type QueueTaskHandler<T = unknown> = (data: QueueData) => Promise<T>;

export async function addQueue<T = unknown>(fn: QueueTaskHandler<T>): Promise<QueueTaskResult<T>> {
  const callback = async () => {
    const jobId = randomUUID();
    try {
      const data = await fn({ jobId });
      return { success: true, jobId, data };
    } catch (error) {
      return { success: false, jobId };
    }
  };

  const result = await queue.add(callback);
  return result as QueueTaskResult<T>;
}
