/**
 * MongoDB-Specific Database Testing Helpers
 * Provides MongoDB-optimized utilities for testing scenarios
 */

import { MongoClient, Db, Collection, ClientSession, MongoClientOptions } from 'mongodb';
import { TransactionContext } from './transaction-helpers';

export interface MongoConfig {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  authSource?: string;
  ssl?: boolean;
  replicaSet?: string;
  options?: MongoClientOptions;
}

export interface MongoIndex {
  name: string;
  collection: string;
  keys: Record<string, 1 | -1 | 'text' | '2dsphere'>;
  unique?: boolean;
  sparse?: boolean;
  partial?: Record<string, any>;
  ttl?: number;
}

export interface MongoValidation {
  collection: string;
  validator: Record<string, any>;
  validationLevel: 'off' | 'strict' | 'moderate';
  validationAction: 'error' | 'warn';
}

export interface MongoAggregationPipeline {
  name: string;
  pipeline: Record<string, any>[];
  collection: string;
}

export interface MongoStats {
  db: any;
  collections: Map<string, any>;
  indexes: Map<string, any>;
  serverStatus: any;
}

export class MongoTestHelper {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: MongoConfig;

  constructor(config: MongoConfig) {
    this.config = config;
  }

  /**
   * Connect to MongoDB
   */
  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    const uri = this.buildConnectionUri();
    const options: MongoClientOptions = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      ...this.config.options
    };

    this.client = new MongoClient(uri, options);
    await this.client.connect();
    this.db = this.client.db(this.config.database);
  }

  /**
   * Create a test database
   */
  async createTestDatabase(dbName: string): Promise<void> {
    await this.connect();
    
    // MongoDB creates databases automatically when first collection is created
    const testDb = this.client!.db(dbName);
    await testDb.createCollection('_test_collection');
    await testDb.dropCollection('_test_collection');
  }

  /**
   * Drop a test database
   */
  async dropTestDatabase(dbName: string): Promise<void> {
    await this.connect();
    await this.client!.db(dbName).dropDatabase();
  }

  /**
   * Get database instance
   */
  async getDatabase(dbName?: string): Promise<Db> {
    await this.connect();
    return dbName ? this.client!.db(dbName) : this.db!;
  }

  /**
   * Get collection with type safety
   */
  async getCollection<T = any>(collectionName: string, dbName?: string): Promise<Collection<T>> {
    const database = await this.getDatabase(dbName);
    return database.collection<T>(collectionName);
  }

  /**
   * Create collection with validation
   */
  async createCollection(
    collectionName: string,
    validation?: MongoValidation,
    options?: any
  ): Promise<Collection> {
    await this.connect();
    
    const createOptions: any = options || {};
    
    if (validation) {
      createOptions.validator = validation.validator;
      createOptions.validationLevel = validation.validationLevel;
      createOptions.validationAction = validation.validationAction;
    }

    return await this.db!.createCollection(collectionName, createOptions);
  }

  /**
   * Test collection operations
   */
  async testCollectionOperations<T>(
    collectionName: string,
    testData: T[]
  ): Promise<{
    insertResult: any;
    findResult: T[];
    updateResult: any;
    deleteResult: any;
  }> {
    const collection = await this.getCollection<T>(collectionName);

    // Insert test data
    const insertResult = await collection.insertMany(testData);

    // Find data
    const findResult = await collection.find({}).toArray();

    // Update data
    const updateResult = await collection.updateMany(
      {},
      { $set: { testField: 'updated' } }
    );

    // Delete data
    const deleteResult = await collection.deleteMany({});

    return {
      insertResult,
      findResult,
      updateResult,
      deleteResult
    };
  }

  /**
   * Create indexes for testing
   */
  async createIndexes(collectionName: string, indexes: MongoIndex[]): Promise<string[]> {
    const collection = await this.getCollection(collectionName);
    const indexSpecs = indexes.map(index => ({
      key: index.keys,
      name: index.name,
      unique: index.unique,
      sparse: index.sparse,
      partialFilterExpression: index.partial,
      expireAfterSeconds: index.ttl
    }));

    return await collection.createIndexes(indexSpecs);
  }

  /**
   * Get collection indexes
   */
  async getCollectionIndexes(collectionName: string): Promise<any[]> {
    const collection = await this.getCollection(collectionName);
    return await collection.listIndexes().toArray();
  }

  /**
   * Test aggregation pipelines
   */
  async testAggregation<T>(
    collectionName: string,
    pipeline: Record<string, any>[],
    options?: any
  ): Promise<T[]> {
    const collection = await this.getCollection(collectionName);
    return await collection.aggregate<T>(pipeline, options).toArray();
  }

  /**
   * Test common aggregation patterns
   */
  async testCommonAggregations(collectionName: string): Promise<{
    groupBy: any[];
    matchAndProject: any[];
    sort: any[];
    lookup: any[];
    unwind: any[];
  }> {
    const collection = await this.getCollection(collectionName);

    const groupBy = await collection.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).toArray();

    const matchAndProject = await collection.aggregate([
      { $match: { active: true } },
      { $project: { name: 1, category: 1 } }
    ]).toArray();

    const sort = await collection.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]).toArray();

    const lookup = await collection.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      }
    ]).toArray();

    const unwind = await collection.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } }
    ]).toArray();

    return {
      groupBy,
      matchAndProject,
      sort,
      lookup,
      unwind
    };
  }

  /**
   * Test transactions (requires replica set)
   */
  async testTransaction<T>(
    operations: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    await this.connect();
    const session = this.client!.startSession();

    try {
      return await session.withTransaction(async () => {
        return await operations(session);
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Test geospatial operations
   */
  async testGeospatialOperations(
    collectionName: string,
    location: { type: 'Point'; coordinates: [number, number] },
    maxDistance: number = 1000
  ): Promise<{
    near: any[];
    within: any[];
    intersects: any[];
  }> {
    const collection = await this.getCollection(collectionName);

    // Create 2dsphere index if not exists
    try {
      await collection.createIndex({ location: '2dsphere' });
    } catch (error) {
      // Index might already exist
    }

    const near = await collection.find({
      location: {
        $near: {
          $geometry: location,
          $maxDistance: maxDistance
        }
      }
    }).toArray();

    const within = await collection.find({
      location: {
        $geoWithin: {
          $centerSphere: [location.coordinates, maxDistance / 6378100] // Earth radius in meters
        }
      }
    }).toArray();

    const intersects = await collection.find({
      location: {
        $geoIntersects: {
          $geometry: location
        }
      }
    }).toArray();

    return { near, within, intersects };
  }

  /**
   * Test text search
   */
  async testTextSearch(
    collectionName: string,
    searchText: string,
    textFields: string[] = ['title', 'content']
  ): Promise<any[]> {
    const collection = await this.getCollection(collectionName);

    // Create text index if not exists
    try {
      const textIndex: Record<string, 'text'> = {};
      textFields.forEach(field => {
        textIndex[field] = 'text';
      });
      await collection.createIndex(textIndex);
    } catch (error) {
      // Index might already exist
    }

    return await collection.find({
      $text: { $search: searchText }
    }).toArray();
  }

  /**
   * Test schema validation
   */
  async testSchemaValidation(
    collectionName: string,
    validator: Record<string, any>,
    validData: any,
    invalidData: any
  ): Promise<{
    validationSuccess: boolean;
    validationError: string | null;
  }> {
    // Drop and recreate collection with validation
    await this.db!.dropCollection(collectionName).catch(() => {});
    
    await this.db!.createCollection(collectionName, {
      validator,
      validationLevel: 'strict',
      validationAction: 'error'
    });

    const collection = await this.getCollection(collectionName);

    try {
      // Test valid data
      await collection.insertOne(validData);
      
      // Test invalid data
      try {
        await collection.insertOne(invalidData);
        return { validationSuccess: false, validationError: 'Invalid data was accepted' };
      } catch (error) {
        return { validationSuccess: true, validationError: null };
      }
    } catch (error) {
      return { validationSuccess: false, validationError: error.message };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<MongoStats> {
    await this.connect();

    const dbStats = await this.db!.stats();
    const serverStatus = await this.db!.admin().serverStatus();
    
    const collections = new Map();
    const indexes = new Map();

    const collectionNames = await this.db!.listCollections().toArray();
    
    for (const collInfo of collectionNames) {
      const collName = collInfo.name;
      const collection = this.db!.collection(collName);
      
      const collStats = await this.db!.command({ collStats: collName });
      collections.set(collName, collStats);
      
      const collIndexes = await collection.listIndexes().toArray();
      indexes.set(collName, collIndexes);
    }

    return {
      db: dbStats,
      collections,
      indexes,
      serverStatus
    };
  }

  /**
   * Test replica set operations
   */
  async testReplicaSet(): Promise<{
    isReplicaSet: boolean;
    members: any[];
    primary: string | null;
    secondary: string[];
  }> {
    await this.connect();

    try {
      const replicaSetStatus = await this.db!.admin().command({ replSetGetStatus: 1 });
      
      const members = replicaSetStatus.members || [];
      const primary = members.find(m => m.stateStr === 'PRIMARY')?.name || null;
      const secondary = members.filter(m => m.stateStr === 'SECONDARY').map(m => m.name);

      return {
        isReplicaSet: true,
        members,
        primary,
        secondary
      };
    } catch (error) {
      return {
        isReplicaSet: false,
        members: [],
        primary: null,
        secondary: []
      };
    }
  }

  /**
   * Test sharding operations
   */
  async testSharding(): Promise<{
    isSharded: boolean;
    shards: any[];
    collections: any[];
  }> {
    await this.connect();

    try {
      const shardStatus = await this.db!.admin().command({ listShards: 1 });
      const shardedCollections = await this.db!.admin().command({
        listCollections: 1,
        filter: { 'options.shardKey': { $exists: true } }
      });

      return {
        isSharded: true,
        shards: shardStatus.shards || [],
        collections: shardedCollections.cursor?.firstBatch || []
      };
    } catch (error) {
      return {
        isSharded: false,
        shards: [],
        collections: []
      };
    }
  }

  /**
   * Monitor MongoDB operations
   */
  async getCurrentOperations(filter?: Record<string, any>): Promise<any[]> {
    await this.connect();
    
    const operations = await this.db!.admin().command({
      currentOp: true,
      ...filter
    });

    return operations.inprog || [];
  }

  /**
   * Test GridFS operations
   */
  async testGridFS(
    bucketName: string = 'fs',
    testData: Buffer
  ): Promise<{
    uploadSuccess: boolean;
    downloadSuccess: boolean;
    metadata: any;
  }> {
    await this.connect();
    
    const bucket = new this.client!.db().GridFSBucket({ bucketName });
    
    try {
      // Upload file
      const uploadStream = bucket.openUploadStream('test-file.txt', {
        metadata: { testFile: true }
      });
      
      uploadStream.end(testData);
      
      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      // Download file
      const downloadStream = bucket.openDownloadStreamByName('test-file.txt');
      const chunks: Buffer[] = [];
      
      await new Promise((resolve, reject) => {
        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('end', resolve);
        downloadStream.on('error', reject);
      });

      const downloadedData = Buffer.concat(chunks);
      const downloadSuccess = downloadedData.equals(testData);

      // Get metadata
      const files = await bucket.find({ filename: 'test-file.txt' }).toArray();
      const metadata = files[0];

      // Cleanup
      await bucket.delete(metadata._id);

      return {
        uploadSuccess: true,
        downloadSuccess,
        metadata
      };
    } catch (error) {
      return {
        uploadSuccess: false,
        downloadSuccess: false,
        metadata: null
      };
    }
  }

  /**
   * Close MongoDB connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  /**
   * Private helper methods
   */
  private buildConnectionUri(): string {
    const { host, port, username, password, authSource, ssl, replicaSet } = this.config;
    
    let uri = 'mongodb://';
    
    if (username && password) {
      uri += `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
    }
    
    uri += `${host}:${port}`;
    
    const options = [];
    if (authSource) options.push(`authSource=${authSource}`);
    if (ssl) options.push('ssl=true');
    if (replicaSet) options.push(`replicaSet=${replicaSet}`);
    
    if (options.length > 0) {
      uri += `?${options.join('&')}`;
    }
    
    return uri;
  }
}

/**
 * MongoDB-specific test utilities
 */
export class MongoTestUtils {
  /**
   * Generate MongoDB test configuration
   */
  static createTestConfig(overrides: Partial<MongoConfig> = {}): MongoConfig {
    return {
      host: 'localhost',
      port: 27017,
      database: 'test_db',
      username: undefined,
      password: undefined,
      ssl: false,
      ...overrides
    };
  }

  /**
   * Common MongoDB data types for testing
   */
  static generateTestData() {
    return {
      objectId: () => '507f1f77bcf86cd799439011',
      date: () => new Date(),
      binary: () => Buffer.from('test data'),
      regex: () => /test.*/i,
      decimal128: () => 123.456,
      coordinates: () => ({ type: 'Point', coordinates: [-73.856077, 40.848447] }),
      polygon: () => ({
        type: 'Polygon',
        coordinates: [[
          [-73.9857, 40.7484],
          [-73.9857, 40.7584],
          [-73.9757, 40.7584],
          [-73.9757, 40.7484],
          [-73.9857, 40.7484]
        ]]
      })
    };
  }

  /**
   * Common aggregation operators for testing
   */
  static getAggregationOperators() {
    return {
      match: (criteria: any) => ({ $match: criteria }),
      group: (id: any, accumulator: any) => ({ $group: { _id: id, ...accumulator } }),
      project: (fields: any) => ({ $project: fields }),
      sort: (fields: any) => ({ $sort: fields }),
      limit: (count: number) => ({ $limit: count }),
      skip: (count: number) => ({ $skip: count }),
      lookup: (from: string, localField: string, foreignField: string, as: string) => ({
        $lookup: { from, localField, foreignField, as }
      }),
      unwind: (path: string, preserveNullAndEmptyArrays = false) => ({
        $unwind: { path, preserveNullAndEmptyArrays }
      }),
      addFields: (fields: any) => ({ $addFields: fields }),
      replaceRoot: (newRoot: any) => ({ $replaceRoot: { newRoot } })
    };
  }

  /**
   * Schema validation patterns
   */
  static getValidationSchemas() {
    return {
      user: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'email'],
          properties: {
            name: { bsonType: 'string', minLength: 1 },
            email: { bsonType: 'string', pattern: '^.+@.+\..+$' },
            age: { bsonType: 'int', minimum: 0, maximum: 150 }
          }
        }
      },
      product: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'price'],
          properties: {
            name: { bsonType: 'string', minLength: 1 },
            price: { bsonType: 'number', minimum: 0 },
            category: { enum: ['electronics', 'clothing', 'books'] }
          }
        }
      }
    };
  }
}

/**
 * MongoDB performance testing utilities
 */
export class MongoPerformanceHelper {
  private helper: MongoTestHelper;

  constructor(helper: MongoTestHelper) {
    this.helper = helper;
  }

  /**
   * Benchmark operations
   */
  async benchmarkOperation<T>(
    operation: () => Promise<T>,
    iterations: number = 100
  ): Promise<{
    avgTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
    results: T[];
  }> {
    const times: number[] = [];
    const results: T[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();
      const result = await operation();
      const endTime = process.hrtime.bigint();

      times.push(Number(endTime - startTime) / 1000000); // Convert to milliseconds
      results.push(result);
    }

    return {
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      totalTime: times.reduce((a, b) => a + b, 0),
      results
    };
  }

  /**
   * Benchmark aggregation pipeline
   */
  async benchmarkAggregation(
    collectionName: string,
    pipeline: Record<string, any>[],
    iterations: number = 10
  ): Promise<any> {
    const collection = await this.helper.getCollection(collectionName);
    
    return await this.benchmarkOperation(async () => {
      return await collection.aggregate(pipeline).toArray();
    }, iterations);
  }

  /**
   * Monitor collection performance
   */
  async getCollectionPerformanceMetrics(collectionName: string): Promise<any> {
    const db = await this.helper.getDatabase();
    
    const collStats = await db.command({ collStats: collectionName });
    const indexStats = await db.command({ collStats: collectionName, indexDetails: true });
    
    return {
      collectionStats: collStats,
      indexStats: indexStats
    };
  }
}