import { DataSource } from 'typeorm';
import * as core from '@actions/core';
import { TopicMessageEntity } from './topic-message.entity';
import { TopicEntity } from './topic.entity';

export async function getDataSource() {
  try {
    const url = core.getInput('MYSQL_URL') || process.env.MYSQL_URL;
    const appDataSource = new DataSource({
      type: 'mysql',
      url,
      entities: [TopicEntity, TopicMessageEntity],
      synchronize: true
    });
    await appDataSource?.initialize();
    core.info('Database connected');

    return appDataSource;
  } catch (error) {
    // @ts-ignore
    const errorMessage = `Database connection failed: ${error?.message}`;
    core.setFailed(errorMessage);
    process.exit(1);
  }
}
