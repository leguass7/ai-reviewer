import { EntitySchema } from 'typeorm';
import type { TopicMessage } from './topic-message.entity';

export interface Topic {
  id: string;
  projectId: string;
  file: string;
  messages?: TopicMessage[];
}

export const TopicEntity = new EntitySchema<Topic>({
  name: 'topic',
  columns: {
    id: {
      type: 'varchar',
      primary: true,
      length: 255
    },
    projectId: {
      type: 'varchar',
      length: 255,
      nullable: false
    },
    file: {
      type: 'text',
      nullable: false
    }
  },
  indices: [
    {
      name: 'idx_topic_projectId',
      unique: false,
      columns: ['projectId']
    }
  ],
  relations: {
    messages: {
      target: 'topic-message',
      type: 'one-to-many',
      eager: true,
      cascade: true,
      inverseSide: 'topic'
    }
  }
});
