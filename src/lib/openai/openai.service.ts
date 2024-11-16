import OpenAI, { OpenAIError } from 'openai';
import type { RequestOptions } from 'openai/core';
import type { AssistantStream, RunCreateParamsBaseStream } from 'openai/lib/AssistantStream';
import { ResponseFormatJSONSchema } from 'openai/resources';
import { AssistantTool } from 'openai/resources/beta/assistants';
import { MessageCreateParams } from 'openai/resources/beta/threads/messages';
import type { ThreadCreateParams } from 'openai/resources/beta/threads/threads';
import { wait } from 'src/helpers';

const tool: AssistantTool = {
  type: 'function',
  function: {
    name: 'code-reviewer',
    description: 'Modelo de resposta da Revisão de código',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        reviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reviewComment: {
                type: 'string',
                description: 'Comentário da revisão gerado pelo assistente.'
              },
              reason: {
                type: 'string',
                description: 'Razão para o comentário feito.'
              },
              lineNumber: {
                type: 'integer',
                description: 'Número da linha no código onde o comentário se aplica.'
              }
            },
            required: ['reviewComment', 'reason', 'lineNumber'],
            additionalProperties: false
          }
        }
      },
      required: ['reviews'],
      additionalProperties: false
    }
  }
};
// const schema: ResponseFormatJSONSchema.JSONSchema = {
//   name: 'code-reviewer',
//   description: 'Modelo de resposta da Revisão de código',
//   strict: true,
//   schema: {
//     type: 'object',
//     properties: {
//       reviews: {
//         type: 'array',
//         items: {
//           type: 'object',
//           properties: {
//             reviewComment: {
//               type: 'string',
//               description: 'Comentário da revisão gerado pelo assistente.'
//             },
//             reason: {
//               type: 'string',
//               description: 'Razão para o comentário feito.'
//             },
//             lineNumber: {
//               type: 'integer',
//               description: 'Número da linha no código onde o comentário se aplica.'
//             }
//           },
//           required: ['reviewComment', 'reason', 'lineNumber'],
//           additionalProperties: false
//         }
//       }
//     },
//     required: ['reviews'],
//     additionalProperties: false
//   }
// };

type SafeReturn = { success: boolean } & Record<string, any>;

export type CreateRunnerOptions = {
  timeout?: number;
  additionalInstructions: string;
  streamParams?: Partial<RunCreateParamsBaseStream>;
  execTimeout?: number;
  temperature?: number;
  model?: RunCreateParamsBaseStream['model'];
};

type RunnerResultError = {
  error?: string;
  threadId?: string;
};

export type RunnerResultSuccess = {
  runId?: string;
  content: string;
  messageId?: string;
  role?: 'assistant' | 'user';
};

export type RunnerResult = {
  success: boolean;
} & (RunnerResultError | RunnerResultSuccess);

export type ConfigureStreamResolver = (value: RunnerResult) => void;
export type ConfigureStreamOptions = { threadId: string };

// timeout padrão de 3 minutos
const defaultTimeout = 3 * 60 * 1000;
export class OpenAiService {
  public openai: OpenAI;

  constructor(
    private readonly apiKey: string,
    private readonly assistantId: string
  ) {
    this.openai = new OpenAI({ apiKey: this.apiKey });
  }

  private prepareParameters({
    additionalInstructions,
    model = 'gpt-4-1106-preview'
  }: Omit<CreateRunnerOptions, 'timeout'>): RunCreateParamsBaseStream {
    return {
      additional_instructions: additionalInstructions,
      assistant_id: this.assistantId,
      // model,
      // response_format: { type: 'json_object' },
      temperature: 0.5
      // tools: [tool]
      // temperature: 0.5
    };
  }

  private configureStream(stream: AssistantStream, resolve: ConfigureStreamResolver, options: ConfigureStreamOptions) {
    const { threadId } = options;

    stream.on('textDone', async (data, { id, role }) => {
      const runId = stream?.currentRun?.()?.id;
      const result: RunnerResultSuccess = { content: data?.value, messageId: id, role, runId };
      console.error('configureStream textDone', threadId, result);
      return resolve({ ...result, success: true });
    });

    stream.on('error', async error => {
      const result: RunnerResultError = { error: error?.message, threadId };
      console.error('configureStream error', threadId, error);
      resolve({ ...result, success: false });
    });
  }

  /** Criar um tópico de conversa na OpenAi */
  public async assistantCreateThread(body?: ThreadCreateParams, options?: RequestOptions<unknown>) {
    try {
      const thread = await this.openai.beta.threads.create(body, options);
      return thread || null;
    } catch (error) {
      return null;
    }
  }

  /** Remover um tópico de conversa na OpenAi  */
  public async assistentRemoveThread(threadId: string): Promise<SafeReturn> {
    try {
      const deleted = await this.openai.beta.threads.del(threadId);
      return { ...deleted, success: !!deleted?.deleted };
    } catch (error: any) {
      if (error?.status === 404) return { success: true };
      return { message: error?.message || error?.type, success: false };
    }
  }

  /** Criar uma mensagem de usuário no tópico de conversa na OpenAi */
  public async assistantThreadCreateMessage(threadId: string, body: string, metadata?: Record<string, string>) {
    try {
      const message: MessageCreateParams = { role: 'user', content: body, metadata };
      const thread = await this.openai.beta.threads.messages.create(threadId, message);
      return thread || null;
    } catch {
      return null;
    }
  }

  async assistantCreateRunner(threadId: string, { timeout = defaultTimeout, ...options }: CreateRunnerOptions) {
    // esperar 10ms a menos que o timeout para garantir que o timeout seja acionado
    const waiting = new Promise(async resolve => {
      await wait(timeout - 10);
      // eslint-disable-next-line no-console
      console.log('RUNNER TIMEOUT', threadId);
      return resolve({ success: false, threadId, error: 'Timeout' });
    });

    const params = this.prepareParameters(options);

    const execute = new Promise(async resolve => {
      try {
        const stream = this.openai.beta.threads.runs.stream(threadId, params, { timeout }) as AssistantStream;
        this.configureStream(stream, resolve, { threadId });
      } catch (error) {
        let err = null;
        if (error instanceof OpenAIError) err = error.message;
        resolve({ success: false, threadId, error: err });
      }
    });

    try {
      const result = (await Promise.race([waiting, execute])) as Promise<RunnerResult>;
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('assistantCreateRunner', threadId, error);
      return null;
    }
  }
}
