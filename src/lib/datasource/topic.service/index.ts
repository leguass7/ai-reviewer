import { DataSource, FindOptionsWhere, Repository, type FindOneOptions } from 'typeorm';
import { Topic, TopicEntity } from '../topic.entity';
import { TopicMessage, TopicMessageEntity } from '../topic-message.entity';

export type CreateTopic = {
  id: string;
  projectId: string;
  file: string;
};

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

  async remove(topicId: string) {
    return this.topicRepository.delete(topicId);
  }

  async create({ ...data }: Topic) {
    const toSave = this.topicRepository.create(data);
    return this.topicRepository.save(toSave);
  }

  async update(topicId: string, data: Partial<Topic>) {
    const toSave = this.topicRepository.create({ ...data, id: topicId });
    return this.topicRepository.save(toSave);
  }

  async findOne(where: FindOptionsWhere<Topic>) {
    const query = this.topicRepository.createQueryBuilder('topic').select().leftJoinAndSelect('topic.messages', 'messages');
    return query.getOne();
  }
  //

  async createMessage(topicId: string, data: Omit<TopicMessage, 'topicId'>) {
    const toSave = this.topicMessageRepository.create({ ...data, topicId });
    return this.topicMessageRepository.save(toSave);
  }
}
