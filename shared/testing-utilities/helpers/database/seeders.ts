/**
 * Database Seeding Utilities for Test Data
 * Provides factory patterns and relationship management for test data creation
 */

import { TransactionContext, TransactionManager } from './transaction-helpers';
import { faker } from '@faker-js/faker';

export interface SeederConfig {
  truncateBeforeSeeding?: boolean;
  preserveOrder?: boolean;
  batchSize?: number;
}

export interface RelationshipDefinition {
  table: string;
  foreignKey: string;
  localKey: string;
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany';
  pivotTable?: string;
}

export interface SeederSchema {
  table: string;
  count?: number;
  data?: any[] | (() => any) | (() => Promise<any>);
  relationships?: RelationshipDefinition[];
  dependencies?: string[];
}

export class DatabaseSeeder {
  private transactionManager: TransactionManager;
  private schemas: Map<string, SeederSchema> = new Map();
  private seededData: Map<string, any[]> = new Map();
  private config: SeederConfig;

  constructor(transactionManager: TransactionManager, config: SeederConfig = {}) {
    this.transactionManager = transactionManager;
    this.config = {
      truncateBeforeSeeding: true,
      preserveOrder: true,
      batchSize: 100,
      ...config
    };
  }

  /**
   * Register a seeder schema
   */
  register(name: string, schema: SeederSchema): void {
    this.schemas.set(name, schema);
  }

  /**
   * Seed data according to registered schemas
   */
  async seed(context: TransactionContext, seeders?: string[]): Promise<Map<string, any[]>> {
    const toSeed = seeders || Array.from(this.schemas.keys());
    
    if (this.config.truncateBeforeSeeding) {
      await this.truncateRelevantTables(context, toSeed);
    }

    // Resolve dependency order
    const orderedSeeders = this.resolveDependencies(toSeed);
    
    // Execute seeders in order
    for (const seederName of orderedSeeders) {
      await this.executeSingleSeeder(context, seederName);
    }

    return this.seededData;
  }

  /**
   * Get seeded data by seeder name
   */
  getSeededData(seederName: string): any[] {
    return this.seededData.get(seederName) || [];
  }

  /**
   * Get a random record from seeded data
   */
  getRandomRecord(seederName: string): any {
    const data = this.getSeededData(seederName);
    if (data.length === 0) {
      throw new Error(`No seeded data found for ${seederName}`);
    }
    return data[Math.floor(Math.random() * data.length)];
  }

  /**
   * Create relationships between seeded data
   */
  async createRelationships(context: TransactionContext, seederName: string): Promise<void> {
    const schema = this.schemas.get(seederName);
    if (!schema || !schema.relationships) {
      return;
    }

    const seededRecords = this.getSeededData(seederName);
    const client = this.transactionManager.getTransactionClient(context);

    for (const relationship of schema.relationships) {
      await this.createRelationship(client, seededRecords, relationship);
    }
  }

  /**
   * Clear seeded data
   */
  clearSeededData(): void {
    this.seededData.clear();
  }

  /**
   * Private methods
   */
  private async executeSingleSeeder(context: TransactionContext, seederName: string): Promise<void> {
    const schema = this.schemas.get(seederName);
    if (!schema) {
      throw new Error(`Seeder ${seederName} not found`);
    }

    const client = this.transactionManager.getTransactionClient(context);
    let dataToInsert: any[] = [];

    // Generate or use provided data
    if (Array.isArray(schema.data)) {
      dataToInsert = schema.data;
    } else if (typeof schema.data === 'function') {
      const result = await schema.data();
      dataToInsert = Array.isArray(result) ? result : [result];
    } else if (schema.count) {
      dataToInsert = await this.generateFakeData(schema.table, schema.count);
    }

    // Insert data in batches
    const insertedRecords = await this.insertDataInBatches(client, schema.table, dataToInsert);
    this.seededData.set(seederName, insertedRecords);

    // Create relationships if defined
    if (schema.relationships) {
      await this.createRelationships(context, seederName);
    }
  }

  private async insertDataInBatches(client: any, table: string, data: any[]): Promise<any[]> {
    const insertedRecords: any[] = [];
    const batchSize = this.config.batchSize || 100;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const records = await this.insertBatch(client, table, batch);
      insertedRecords.push(...records);
    }

    return insertedRecords;
  }

  private async insertBatch(client: any, table: string, data: any[]): Promise<any[]> {
    if (data.length === 0) return [];

    // This is a simplified implementation - in practice, you'd need database-specific logic
    const columns = Object.keys(data[0]);
    const placeholders = data.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const values = data.flatMap(record => columns.map(col => record[col]));

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} RETURNING *`;
    
    try {
      const result = await client.query(query, values);
      return result.rows || result[0] || data; // Handle different database response formats
    } catch (error) {
      throw new Error(`Failed to insert batch into ${table}: ${error.message}`);
    }
  }

  private async createRelationship(client: any, records: any[], relationship: RelationshipDefinition): Promise<void> {
    const relatedData = this.getSeededData(relationship.table);
    
    switch (relationship.type) {
      case 'hasOne':
        await this.createHasOneRelationship(client, records, relatedData, relationship);
        break;
      case 'hasMany':
        await this.createHasManyRelationship(client, records, relatedData, relationship);
        break;
      case 'belongsTo':
        await this.createBelongsToRelationship(client, records, relatedData, relationship);
        break;
      case 'manyToMany':
        await this.createManyToManyRelationship(client, records, relatedData, relationship);
        break;
    }
  }

  private async createHasOneRelationship(client: any, records: any[], relatedData: any[], relationship: RelationshipDefinition): Promise<void> {
    for (let i = 0; i < records.length && i < relatedData.length; i++) {
      const updateQuery = `UPDATE ${relationship.table} SET ${relationship.foreignKey} = ? WHERE ${relationship.localKey} = ?`;
      await client.query(updateQuery, [records[i].id, relatedData[i].id]);
    }
  }

  private async createHasManyRelationship(client: any, records: any[], relatedData: any[], relationship: RelationshipDefinition): Promise<void> {
    const recordsPerParent = Math.ceil(relatedData.length / records.length);
    
    for (let i = 0; i < records.length; i++) {
      const startIndex = i * recordsPerParent;
      const endIndex = Math.min(startIndex + recordsPerParent, relatedData.length);
      
      for (let j = startIndex; j < endIndex; j++) {
        const updateQuery = `UPDATE ${relationship.table} SET ${relationship.foreignKey} = ? WHERE ${relationship.localKey} = ?`;
        await client.query(updateQuery, [records[i].id, relatedData[j].id]);
      }
    }
  }

  private async createBelongsToRelationship(client: any, records: any[], relatedData: any[], relationship: RelationshipDefinition): Promise<void> {
    for (const record of records) {
      const relatedRecord = relatedData[Math.floor(Math.random() * relatedData.length)];
      const updateQuery = `UPDATE ${relationship.table} SET ${relationship.foreignKey} = ? WHERE id = ?`;
      await client.query(updateQuery, [relatedRecord.id, record.id]);
    }
  }

  private async createManyToManyRelationship(client: any, records: any[], relatedData: any[], relationship: RelationshipDefinition): Promise<void> {
    if (!relationship.pivotTable) {
      throw new Error('Pivot table required for many-to-many relationship');
    }

    const relationships: Array<{record_id: any, related_id: any}> = [];
    
    for (const record of records) {
      // Create 1-3 relationships per record
      const relationshipCount = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...relatedData].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < Math.min(relationshipCount, shuffled.length); i++) {
        relationships.push({
          record_id: record.id,
          related_id: shuffled[i].id
        });
      }
    }

    // Insert pivot table records
    for (const rel of relationships) {
      const insertQuery = `INSERT INTO ${relationship.pivotTable} (${relationship.localKey}, ${relationship.foreignKey}) VALUES (?, ?)`;
      await client.query(insertQuery, [rel.record_id, rel.related_id]);
    }
  }

  private async generateFakeData(table: string, count: number): Promise<any[]> {
    const data: any[] = [];

    for (let i = 0; i < count; i++) {
      const record = await this.generateFakeRecord(table);
      data.push(record);
    }

    return data;
  }

  private async generateFakeRecord(table: string): Promise<any> {
    // This is a basic implementation - in practice, you'd have more sophisticated
    // schema-based generation or table-specific generators
    const baseFields = {
      created_at: faker.date.recent(),
      updated_at: faker.date.recent()
    };

    // Table-specific fake data generation
    switch (table.toLowerCase()) {
      case 'users':
        return {
          ...baseFields,
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
          avatar: faker.image.avatar(),
          bio: faker.lorem.paragraph(),
          is_active: faker.datatype.boolean()
        };

      case 'posts':
        return {
          ...baseFields,
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(),
          slug: faker.lorem.slug(),
          status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
          view_count: faker.number.int({ min: 0, max: 10000 })
        };

      case 'comments':
        return {
          ...baseFields,
          content: faker.lorem.paragraph(),
          author_name: faker.person.fullName(),
          author_email: faker.internet.email(),
          is_approved: faker.datatype.boolean()
        };

      case 'categories':
        return {
          ...baseFields,
          name: faker.lorem.word(),
          description: faker.lorem.sentence(),
          slug: faker.lorem.slug()
        };

      case 'products':
        return {
          ...baseFields,
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: faker.commerce.price(),
          sku: faker.string.alphanumeric(8),
          stock: faker.number.int({ min: 0, max: 100 }),
          is_active: faker.datatype.boolean()
        };

      default:
        return {
          ...baseFields,
          name: faker.lorem.word(),
          description: faker.lorem.sentence()
        };
    }
  }

  private resolveDependencies(seeders: string[]): string[] {
    const resolved: string[] = [];
    const visiting: Set<string> = new Set();
    const visited: Set<string> = new Set();

    const visit = (seederName: string) => {
      if (visited.has(seederName)) return;
      if (visiting.has(seederName)) {
        throw new Error(`Circular dependency detected involving ${seederName}`);
      }

      visiting.add(seederName);
      
      const schema = this.schemas.get(seederName);
      if (schema?.dependencies) {
        for (const dependency of schema.dependencies) {
          if (seeders.includes(dependency)) {
            visit(dependency);
          }
        }
      }

      visiting.delete(seederName);
      visited.add(seederName);
      resolved.push(seederName);
    };

    for (const seeder of seeders) {
      visit(seeder);
    }

    return resolved;
  }

  private async truncateRelevantTables(context: TransactionContext, seeders: string[]): Promise<void> {
    const client = this.transactionManager.getTransactionClient(context);
    const tablesToTruncate = new Set<string>();

    // Collect all tables that will be seeded
    for (const seederName of seeders) {
      const schema = this.schemas.get(seederName);
      if (schema) {
        tablesToTruncate.add(schema.table);
        
        // Add relationship tables
        if (schema.relationships) {
          for (const rel of schema.relationships) {
            tablesToTruncate.add(rel.table);
            if (rel.pivotTable) {
              tablesToTruncate.add(rel.pivotTable);
            }
          }
        }
      }
    }

    // Truncate in reverse dependency order to avoid FK constraints
    const orderedTables = Array.from(tablesToTruncate).reverse();
    
    for (const table of orderedTables) {
      try {
        await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
      } catch (error) {
        // Fallback for databases that don't support TRUNCATE with CASCADE
        await client.query(`DELETE FROM ${table}`);
      }
    }
  }
}

/**
 * Factory class for creating common test data patterns
 */
export class TestDataFactory {
  static user(overrides: any = {}): any {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      created_at: faker.date.recent(),
      updated_at: faker.date.recent(),
      ...overrides
    };
  }

  static post(overrides: any = {}): any {
    return {
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(),
      slug: faker.lorem.slug(),
      status: 'published',
      created_at: faker.date.recent(),
      updated_at: faker.date.recent(),
      ...overrides
    };
  }

  static comment(overrides: any = {}): any {
    return {
      content: faker.lorem.paragraph(),
      author_name: faker.person.fullName(),
      author_email: faker.internet.email(),
      is_approved: true,
      created_at: faker.date.recent(),
      updated_at: faker.date.recent(),
      ...overrides
    };
  }

  static product(overrides: any = {}): any {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      sku: faker.string.alphanumeric(8),
      stock: faker.number.int({ min: 0, max: 100 }),
      is_active: true,
      created_at: faker.date.recent(),
      updated_at: faker.date.recent(),
      ...overrides
    };
  }

  static category(overrides: any = {}): any {
    return {
      name: faker.lorem.word(),
      description: faker.lorem.sentence(),
      slug: faker.lorem.slug(),
      created_at: faker.date.recent(),
      updated_at: faker.date.recent(),
      ...overrides
    };
  }
}

/**
 * Helper function to create a seeder with common patterns
 */
export function createSeeder(
  table: string,
  count: number = 10,
  factory?: () => any,
  relationships?: RelationshipDefinition[]
): SeederSchema {
  return {
    table,
    count,
    data: factory,
    relationships
  };
}

/**
 * Preset seeder configurations
 */
export const CommonSeeders = {
  users: createSeeder('users', 10, TestDataFactory.user),
  posts: createSeeder('posts', 20, TestDataFactory.post, [
    { table: 'users', foreignKey: 'user_id', localKey: 'id', type: 'belongsTo' }
  ]),
  comments: createSeeder('comments', 50, TestDataFactory.comment, [
    { table: 'posts', foreignKey: 'post_id', localKey: 'id', type: 'belongsTo' },
    { table: 'users', foreignKey: 'user_id', localKey: 'id', type: 'belongsTo' }
  ]),
  categories: createSeeder('categories', 5, TestDataFactory.category),
  products: createSeeder('products', 30, TestDataFactory.product, [
    { table: 'categories', foreignKey: 'category_id', localKey: 'id', type: 'belongsTo' }
  ])
};