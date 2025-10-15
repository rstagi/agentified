import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { MongoClient, Db } from 'mongodb';
import { randomUUID } from 'crypto';

export class MongoDBTestHelper {
  private container: StartedMongoDBContainer | null = null;
  private client: MongoClient | null = null;
  public db: Db | null = null;
  private dbName: string;

  constructor() {
    this.dbName = `test_agents_${randomUUID().replace(/-/g, '_')}`;
  }

  async setup() {
    // Start MongoDB container
    this.container = await new MongoDBContainer("mongo:8.0").start();

    // Connect to MongoDB
    const connectionUri = this.container.getConnectionString();
    this.client = new MongoClient(connectionUri, { directConnection: true });
    await this.client.connect();

    // Use a unique test database
    this.db = this.client.db(this.dbName);
  }

  async teardown() {
    if (this.client) {
      await this.client.close();
    }

    if (this.container) {
      await this.container.stop();
    }
  }

  async clearDatabase() {
    if (this.db && this.client) {
      await this.db.dropDatabase();
      this.db = this.client.db(this.dbName);
    }
  }

  getConnectionString(): string {
    if (!this.container) {
      throw new Error('MongoDB container not started');
    }
    return this.container.getConnectionString();
  }

  getDatabaseName(): string {
    return this.dbName;
  }
}
