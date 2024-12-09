import { ThreadCreateParams } from 'openai/resources/beta/threads/threads';
import { Content } from '../content.js';
import { TopicService } from '../datasource/topic.service';
import { PRDetails } from '../github';
import { OpenAiService } from '../openai/openai.service';
import { createFirstThreadMessage } from '../openai/prompt';
import * as core from '@actions/core';
import { TopicMessage } from '../datasource/topic-message.entity';
import { Topic } from '../datasource/topic.entity';
import { PullRequestDetails, TopicContent, ValidTopic } from './topic-manager.interface.js';
import { CodeAnalyzer } from './code-analyzer';

export class TopicManager {
  private projectId = 'default';
  private topicMetadata = {};
  private _codeAnalyzer: CodeAnalyzer | null = null;

  constructor(
    private readonly prDetails: PullRequestDetails,
    public readonly topicService: TopicService,
    public readonly openAiService: OpenAiService
  ) {
    this.projectId = `${prDetails.owner}/${prDetails.repo}`;
    this.topicMetadata = { repo: prDetails.repo, pullNumber: `${prDetails.pullNumber}` };
  }

  get codeAnalyzer() {
    if (!this?._codeAnalyzer) {
      this._codeAnalyzer = new CodeAnalyzer(this.prDetails, this);
    }
    return this._codeAnalyzer;
  }

  private failExit(message: string) {
    core.setFailed(message);
    process.exit(1);
  }

  private async deletedTopic(topic: Topic): Promise<boolean> {
    try {
      const threadDeleted = await this.openAiService.assistentRemoveThread(topic.id);
      if (!threadDeleted) {
        core.warning(`Não foi possível remover thread '${topic?.id}' na OpenAI`);
      }
      // Marca o tópico como deletado mas mantém histórico
      const deleted = await this.topicService.remove(topic.id);
      return !!deleted?.affected;
    } catch (error: Error | any) {
      core.warning(`Erro ao remover: ${error?.message}`);
      return false;
    }
  }

  async createTopicFile(file: string) {
    const thread = await this.openAiService.assistantCreateThread({ metadata: this.topicMetadata });
    if (!thread?.id) {
      this.failExit('Create thread failed');
      return null;
    }

    const firstMessage = createFirstThreadMessage(this.prDetails);
    const message = await this.openAiService.assistantThreadCreateMessage(thread.id, firstMessage.content as string);
    if (!message) {
      this.failExit('Create message failed');
      return null;
    }

    const topicMessage: TopicMessage = {
      id: message.id,
      role: message.role,
      topicId: thread.id,
      content: firstMessage.content as string
    };

    const topic = await this.topicService.create({ id: thread.id, file, projectId: this.projectId, messages: [topicMessage] });
    return topic;
  }

  private async migrateTopicToNewThread(topic: Topic) {
    const messages =
      topic?.messages?.map(m => ({
        role: m.role,
        content: m.content as string,
        metadata: m?.metadata || {}
      })) || [];

    const newThread = await this.openAiService.assistantCreateThread({
      messages,
      metadata: this.topicMetadata
    });

    if (!newThread?.id) {
      this.failExit('Falha ao criar nova thread');
      return null;
    }

    return newThread;
  }

  /** Tenta recuperar um tópico de conversa na OpenAi, se não existir, cria um novo baseado no registro do banco de dados */
  async retrieveTopicFile(threadId: string, file: string) {
    try {
      const thread = await this.openAiService.assistantRetrieveThread(threadId);
      let topic = await this.topicService.findOne({ projectId: this.projectId, file });

      if (!thread) {
        // recupera do banco de dados e cria novo tópico na openai
        if (!topic) return this.createTopicFile(file);

        // Migração dos dados existentes para nova thread
        const newThread = await this.migrateTopicToNewThread(topic);
        if (!newThread) return null;

        topic = await this.topicService.update(newThread.id, { id: newThread.id });
      }

      return topic;
    } catch (error: Error | any) {
      this.failExit(`Erro ao recuperar tópico: ${error?.message}`);
      return null;
    }
  }

  async syncTopic(content: Content): Promise<TopicContent> {
    try {
      const file = content.filename;
      if (!file) throw new Error('Nome do arquivo não fornecido');

      let topic = await this.topicService.findOne({ projectId: this.projectId, file });

      // Se o arquivo foi deletado, marca o tópico
      if (content.isDeleted && topic) {
        await this.deletedTopic(topic);
        return { ...content, success: true, isDeleted: true };
      }

      if (!topic) topic = await this.createTopicFile(file);
      else topic = await this.retrieveTopicFile(topic.id, file);

      if (!topic) throw new Error('Falha ao sincronizar tópico');

      return { ...content, topicId: topic.id, success: true };
    } catch (error: Error | any) {
      console.log(error);
      core.warning(`Erro ao sincronizar tópico: ${error?.message}`);
      return { ...content, success: false, error: error?.message };
    }
  }

  async createTopicMessage(topicId: string, { content, role, metadata }: TopicMessageCreate) {
    const theadMessage = await this.openAiService.assistantThreadCreateMessage(topicId, content, metadata);

    if (!theadMessage?.id) {
      this.failExit('Create message failed');
      return null;
    }
    const message = this.topicService.createMessage(topicId, { content, role, id: theadMessage.id, metadata });
    return message;
  }

  // async createComments(topicId: string, prompt: ValidTopic, additionalInstructions: string) {
  //   const messageCreated = await this.createTopicMessage(topicId, prompt, 'user');
  // }
}

type TopicMessageCreate = {
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
};
