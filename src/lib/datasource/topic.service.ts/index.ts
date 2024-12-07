import { DataSource, FindOptionsWhere, Repository, type FindOneOptions } from 'typeorm';
import { Topic, TopicEntity } from '../topic.entity';
import { TopicMessage, TopicMessageEntity } from '../topic-message.entity';

export type FindOneParams = {
  id?: string;
  projectId?: string;
  filename?: string;
};

export class TopicService {
  private topicRepository: Repository<Topic>;
  private topicMessageRepository: Repository<TopicMessage>;

  constructor(private readonly dataSource: DataSource) {
    this.topicRepository = this.dataSource.getRepository<Topic>(TopicEntity);
    this.topicMessageRepository = this.dataSource.getRepository<TopicMessage>(TopicMessageEntity);
  }

  async findOne(where: FindOptionsWhere<Topic>) {
    return this.topicRepository.findOne({ where, relations: ['messages'] });
  }
}
