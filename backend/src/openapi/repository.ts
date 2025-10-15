import type { Db } from 'mongodb';
import { ObjectId } from 'mongodb';
import type { OpenAPISpec, CreateOpenAPISpec } from './types.ts';

const COLLECTION_NAME = 'openapi_specs';

export class OpenAPISpecRepository {
  constructor(private db: Db) {}

  async create(data: CreateOpenAPISpec): Promise<OpenAPISpec> {
    const collection = this.db.collection(COLLECTION_NAME);

    const doc = {
      name: data.name,
      spec: data.spec,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(doc);

    return {
      id: result.insertedId.toString(),
      name: doc.name,
      spec: doc.spec,
      createdAt: doc.createdAt,
    };
  }

  async findById(id: string): Promise<OpenAPISpec | null> {
    const collection = this.db.collection(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return null; // Invalid ID format
    }

    const doc = await collection.findOne({ _id: objectId });

    if (!doc) {
      return null;
    }

    return {
      id: doc._id.toString(),
      name: doc.name,
      spec: doc.spec,
      createdAt: doc.createdAt,
    };
  }

  async findAll(): Promise<OpenAPISpec[]> {
    const collection = this.db.collection(COLLECTION_NAME);

    const docs = await collection.find().toArray();

    return docs.map(doc => ({
      id: doc._id.toString(),
      name: doc.name,
      spec: doc.spec,
      createdAt: doc.createdAt,
    }));
  }

  async delete(id: string): Promise<void> {
    const collection = this.db.collection(COLLECTION_NAME);

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return; // Invalid ID format, silently return
    }

    await collection.deleteOne({ _id: objectId });
  }
}
