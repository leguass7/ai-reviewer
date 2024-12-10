import { EntitySchema } from 'typeorm';
import type { Topic } from './topic.entity';

export interface TopicMessage {
  id: string;
  topicId: string;
  role: 'assistant' | 'user';
  content: string;
  metadata?: Record<string, unknown>;
  //
  topic?: Topic;
}

export const TopicMessageEntity = new EntitySchema<TopicMessage>({
  name: 'topic-message',
  columns: {
    id: {
      type: 'varchar',
      primary: true,
      length: 255
    },
    topicId: {
      type: 'varchar',
      length: 255,
      nullable: false
    },
    role: {
      type: 'enum',
      enum: ['assistant', 'user'],
      nullable: false
    },
    content: {
      type: 'longtext',
      nullable: true
    },
    metadata: {
      type: 'json',
      nullable: true
    }
  },
  relations: {
    topic: {
      target: 'topic',
      type: 'many-to-one',
      inverseSide: 'topic',
      joinColumn: {
        referencedColumnName: 'id',
        name: 'topicId',
        foreignKeyConstraintName: 'topic_message_topic_id_fk'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  }
});
