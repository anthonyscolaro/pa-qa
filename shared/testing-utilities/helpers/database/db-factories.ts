/**
 * Database Record Factories for Test Data Generation
 * Provides factory patterns for creating realistic test data with relationships
 */

import { faker } from '@faker-js/faker';

export interface FactoryOptions {
  count?: number;
  overrides?: Partial<any>;
  traits?: string[];
  locale?: string;
  seed?: number;
}

export interface RelatedFactory {
  factory: string;
  relationship: 'hasOne' | 'hasMany' | 'belongsTo';
  foreignKey: string;
  count?: number;
}

export interface FactoryDefinition {
  name: string;
  attributes: Record<string, () => any>;
  traits: Record<string, Record<string, () => any>>;
  relationships: Record<string, RelatedFactory>;
  hooks: {
    beforeCreate?: (attributes: any) => any;
    afterCreate?: (instance: any) => any;
  };
}

export class DatabaseFactory {
  private static factories = new Map<string, FactoryDefinition>();
  private static instances = new Map<string, any[]>();
  private static sequenceCounters = new Map<string, number>();

  /**
   * Register a factory definition
   */
  static define(name: string, definition: Partial<FactoryDefinition>): void {
    const factory: FactoryDefinition = {
      name,
      attributes: definition.attributes || {},
      traits: definition.traits || {},
      relationships: definition.relationships || {},
      hooks: definition.hooks || {}
    };

    this.factories.set(name, factory);
  }

  /**
   * Create instances using a factory
   */
  static async create<T = any>(
    factoryName: string,
    options: FactoryOptions = {}
  ): Promise<T[]> {
    const count = options.count || 1;
    const instances: T[] = [];

    // Set faker locale and seed if provided
    if (options.locale) {
      faker.setLocale(options.locale);
    }
    if (options.seed !== undefined) {
      faker.seed(options.seed);
    }

    for (let i = 0; i < count; i++) {
      const instance = await this.createSingle<T>(factoryName, options);
      instances.push(instance);
    }

    // Store instances for relationship building
    const existing = this.instances.get(factoryName) || [];
    this.instances.set(factoryName, [...existing, ...instances]);

    return instances;
  }

  /**
   * Create a single instance
   */
  static async createSingle<T = any>(
    factoryName: string,
    options: FactoryOptions = {}
  ): Promise<T> {
    const factory = this.factories.get(factoryName);
    if (!factory) {
      throw new Error(`Factory '${factoryName}' not found`);
    }

    // Build base attributes
    let attributes = this.buildAttributes(factory);

    // Apply traits
    if (options.traits) {
      for (const trait of options.traits) {
        const traitAttributes = factory.traits[trait];
        if (traitAttributes) {
          attributes = { ...attributes, ...this.buildAttributes({ attributes: traitAttributes } as FactoryDefinition) };
        }
      }
    }

    // Apply overrides
    if (options.overrides) {
      attributes = { ...attributes, ...options.overrides };
    }

    // Run before create hook
    if (factory.hooks.beforeCreate) {
      attributes = factory.hooks.beforeCreate(attributes);
    }

    // Create the instance
    const instance = attributes as T;

    // Run after create hook
    if (factory.hooks.afterCreate) {
      factory.hooks.afterCreate(instance);
    }

    return instance;
  }

  /**
   * Build relationships for created instances
   */
  static async buildRelationships(factoryName: string): Promise<void> {
    const factory = this.factories.get(factoryName);
    const instances = this.instances.get(factoryName);
    
    if (!factory || !instances) {
      return;
    }

    for (const [relationName, relation] of Object.entries(factory.relationships)) {
      switch (relation.relationship) {
        case 'hasOne':
          await this.buildHasOneRelationship(instances, relation);
          break;
        case 'hasMany':
          await this.buildHasManyRelationship(instances, relation);
          break;
        case 'belongsTo':
          await this.buildBelongsToRelationship(instances, relation);
          break;
      }
    }
  }

  /**
   * Get created instances
   */
  static getInstances<T = any>(factoryName: string): T[] {
    return (this.instances.get(factoryName) || []) as T[];
  }

  /**
   * Clear all instances
   */
  static clearInstances(factoryName?: string): void {
    if (factoryName) {
      this.instances.delete(factoryName);
    } else {
      this.instances.clear();
    }
  }

  /**
   * Create a sequence for unique values
   */
  static sequence(name: string, fn: (n: number) => any): () => any {
    return () => {
      const current = this.sequenceCounters.get(name) || 0;
      this.sequenceCounters.set(name, current + 1);
      return fn(current + 1);
    };
  }

  /**
   * Create a factory state/trait
   */
  static state(name: string, attributes: Record<string, () => any>): string {
    return name; // Return the state name for use in traits
  }

  /**
   * Private helper methods
   */
  private static buildAttributes(factory: FactoryDefinition): any {
    const attributes: any = {};
    
    for (const [key, generator] of Object.entries(factory.attributes)) {
      attributes[key] = generator();
    }

    return attributes;
  }

  private static async buildHasOneRelationship(
    instances: any[],
    relation: RelatedFactory
  ): Promise<void> {
    const relatedInstances = await this.create(relation.factory, { count: instances.length });
    
    instances.forEach((instance, index) => {
      if (relatedInstances[index]) {
        relatedInstances[index][relation.foreignKey] = instance.id;
      }
    });
  }

  private static async buildHasManyRelationship(
    instances: any[],
    relation: RelatedFactory
  ): Promise<void> {
    const countPerInstance = relation.count || 3;
    
    for (const instance of instances) {
      const relatedInstances = await this.create(relation.factory, { count: countPerInstance });
      relatedInstances.forEach(related => {
        related[relation.foreignKey] = instance.id;
      });
    }
  }

  private static async buildBelongsToRelationship(
    instances: any[],
    relation: RelatedFactory
  ): Promise<void> {
    const relatedInstances = this.getInstances(relation.factory);
    
    if (relatedInstances.length === 0) {
      // Create some related instances if none exist
      await this.create(relation.factory, { count: Math.ceil(instances.length / 3) });
    }

    const updatedRelatedInstances = this.getInstances(relation.factory);
    
    instances.forEach(instance => {
      const randomRelated = updatedRelatedInstances[
        Math.floor(Math.random() * updatedRelatedInstances.length)
      ];
      instance[relation.foreignKey] = randomRelated.id;
    });
  }
}

/**
 * Pre-defined factories for common entities
 */
export class CommonFactories {
  static registerAll(): void {
    this.registerUserFactory();
    this.registerPostFactory();
    this.registerCommentFactory();
    this.registerCategoryFactory();
    this.registerProductFactory();
    this.registerOrderFactory();
    this.registerCustomerFactory();
  }

  private static registerUserFactory(): void {
    DatabaseFactory.define('user', {
      attributes: {
        id: DatabaseFactory.sequence('user_id', n => n),
        firstName: () => faker.person.firstName(),
        lastName: () => faker.person.lastName(),
        email: DatabaseFactory.sequence('user_email', n => `user${n}@example.com`),
        username: DatabaseFactory.sequence('username', n => `user${n}`),
        password: () => faker.internet.password(),
        avatar: () => faker.image.avatar(),
        bio: () => faker.lorem.paragraph(),
        isActive: () => true,
        isVerified: () => faker.datatype.boolean(),
        lastLoginAt: () => faker.date.recent(),
        createdAt: () => faker.date.past(),
        updatedAt: () => faker.date.recent()
      },
      traits: {
        admin: {
          role: () => 'admin',
          isActive: () => true,
          isVerified: () => true
        },
        inactive: {
          isActive: () => false,
          lastLoginAt: () => null
        },
        newUser: {
          createdAt: () => faker.date.recent(),
          lastLoginAt: () => null,
          isVerified: () => false
        }
      },
      relationships: {
        posts: {
          factory: 'post',
          relationship: 'hasMany',
          foreignKey: 'userId',
          count: 5
        }
      }
    });
  }

  private static registerPostFactory(): void {
    DatabaseFactory.define('post', {
      attributes: {
        id: DatabaseFactory.sequence('post_id', n => n),
        title: () => faker.lorem.sentence(),
        slug: () => faker.lorem.slug(),
        content: () => faker.lorem.paragraphs(3),
        excerpt: () => faker.lorem.paragraph(),
        status: () => faker.helpers.arrayElement(['draft', 'published', 'archived']),
        featuredImage: () => faker.image.url(),
        viewCount: () => faker.number.int({ min: 0, max: 10000 }),
        likesCount: () => faker.number.int({ min: 0, max: 500 }),
        commentsCount: () => faker.number.int({ min: 0, max: 100 }),
        publishedAt: () => faker.date.past(),
        createdAt: () => faker.date.past(),
        updatedAt: () => faker.date.recent()
      },
      traits: {
        published: {
          status: () => 'published',
          publishedAt: () => faker.date.past()
        },
        draft: {
          status: () => 'draft',
          publishedAt: () => null
        },
        popular: {
          viewCount: () => faker.number.int({ min: 5000, max: 50000 }),
          likesCount: () => faker.number.int({ min: 100, max: 1000 })
        }
      },
      relationships: {
        user: {
          factory: 'user',
          relationship: 'belongsTo',
          foreignKey: 'userId'
        },
        comments: {
          factory: 'comment',
          relationship: 'hasMany',
          foreignKey: 'postId',
          count: 3
        }
      }
    });
  }

  private static registerCommentFactory(): void {
    DatabaseFactory.define('comment', {
      attributes: {
        id: DatabaseFactory.sequence('comment_id', n => n),
        content: () => faker.lorem.paragraph(),
        authorName: () => faker.person.fullName(),
        authorEmail: () => faker.internet.email(),
        authorUrl: () => faker.internet.url(),
        isApproved: () => faker.datatype.boolean(),
        parentId: () => null,
        createdAt: () => faker.date.recent(),
        updatedAt: () => faker.date.recent()
      },
      traits: {
        approved: {
          isApproved: () => true
        },
        pending: {
          isApproved: () => false
        },
        reply: {
          parentId: () => faker.number.int({ min: 1, max: 100 })
        }
      },
      relationships: {
        post: {
          factory: 'post',
          relationship: 'belongsTo',
          foreignKey: 'postId'
        }
      }
    });
  }

  private static registerCategoryFactory(): void {
    DatabaseFactory.define('category', {
      attributes: {
        id: DatabaseFactory.sequence('category_id', n => n),
        name: () => faker.lorem.word(),
        slug: () => faker.lorem.slug(),
        description: () => faker.lorem.sentence(),
        color: () => faker.internet.color(),
        icon: () => faker.helpers.arrayElement(['📱', '💻', '🎮', '📚', '🎵', '🎨']),
        isActive: () => true,
        sortOrder: DatabaseFactory.sequence('category_sort', n => n),
        parentId: () => null,
        createdAt: () => faker.date.past(),
        updatedAt: () => faker.date.recent()
      },
      traits: {
        subcategory: {
          parentId: () => faker.number.int({ min: 1, max: 10 })
        },
        inactive: {
          isActive: () => false
        }
      }
    });
  }

  private static registerProductFactory(): void {
    DatabaseFactory.define('product', {
      attributes: {
        id: DatabaseFactory.sequence('product_id', n => n),
        name: () => faker.commerce.productName(),
        description: () => faker.commerce.productDescription(),
        sku: DatabaseFactory.sequence('product_sku', n => `SKU-${String(n).padStart(6, '0')}`),
        price: () => parseFloat(faker.commerce.price()),
        compareAtPrice: () => parseFloat(faker.commerce.price()),
        costPrice: () => parseFloat(faker.commerce.price()),
        stock: () => faker.number.int({ min: 0, max: 1000 }),
        weight: () => faker.number.float({ min: 0.1, max: 10.0, precision: 0.1 }),
        dimensions: () => ({
          length: faker.number.float({ min: 1, max: 50, precision: 0.1 }),
          width: faker.number.float({ min: 1, max: 50, precision: 0.1 }),
          height: faker.number.float({ min: 1, max: 50, precision: 0.1 })
        }),
        images: () => Array.from({ length: 3 }, () => faker.image.url()),
        isActive: () => true,
        isFeatured: () => faker.datatype.boolean(),
        tags: () => Array.from({ length: 3 }, () => faker.lorem.word()),
        createdAt: () => faker.date.past(),
        updatedAt: () => faker.date.recent()
      },
      traits: {
        featured: {
          isFeatured: () => true,
          stock: () => faker.number.int({ min: 50, max: 1000 })
        },
        outOfStock: {
          stock: () => 0
        },
        expensive: {
          price: () => parseFloat(faker.commerce.price(100, 1000))
        },
        cheap: {
          price: () => parseFloat(faker.commerce.price(1, 50))
        }
      },
      relationships: {
        category: {
          factory: 'category',
          relationship: 'belongsTo',
          foreignKey: 'categoryId'
        }
      }
    });
  }

  private static registerOrderFactory(): void {
    DatabaseFactory.define('order', {
      attributes: {
        id: DatabaseFactory.sequence('order_id', n => n),
        orderNumber: DatabaseFactory.sequence('order_number', n => `ORD-${String(n).padStart(8, '0')}`),
        status: () => faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
        subtotal: () => parseFloat(faker.commerce.price(10, 500)),
        taxAmount: () => parseFloat(faker.commerce.price(1, 50)),
        shippingAmount: () => parseFloat(faker.commerce.price(5, 25)),
        discountAmount: () => parseFloat(faker.commerce.price(0, 20)),
        totalAmount: () => parseFloat(faker.commerce.price(15, 600)),
        currency: () => 'USD',
        paymentStatus: () => faker.helpers.arrayElement(['pending', 'paid', 'failed', 'refunded']),
        paymentMethod: () => faker.helpers.arrayElement(['credit_card', 'paypal', 'bank_transfer']),
        shippingAddress: () => ({
          name: faker.person.fullName(),
          address1: faker.location.streetAddress(),
          address2: faker.location.secondaryAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country()
        }),
        billingAddress: () => ({
          name: faker.person.fullName(),
          address1: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country()
        }),
        notes: () => faker.lorem.sentence(),
        placedAt: () => faker.date.recent(),
        shippedAt: () => null,
        deliveredAt: () => null,
        createdAt: () => faker.date.recent(),
        updatedAt: () => faker.date.recent()
      },
      traits: {
        completed: {
          status: () => 'delivered',
          paymentStatus: () => 'paid',
          shippedAt: () => faker.date.recent(),
          deliveredAt: () => faker.date.recent()
        },
        cancelled: {
          status: () => 'cancelled',
          paymentStatus: () => 'refunded'
        },
        large: {
          subtotal: () => parseFloat(faker.commerce.price(200, 1000)),
          totalAmount: () => parseFloat(faker.commerce.price(250, 1200))
        }
      },
      relationships: {
        customer: {
          factory: 'customer',
          relationship: 'belongsTo',
          foreignKey: 'customerId'
        }
      }
    });
  }

  private static registerCustomerFactory(): void {
    DatabaseFactory.define('customer', {
      attributes: {
        id: DatabaseFactory.sequence('customer_id', n => n),
        firstName: () => faker.person.firstName(),
        lastName: () => faker.person.lastName(),
        email: DatabaseFactory.sequence('customer_email', n => `customer${n}@example.com`),
        phone: () => faker.phone.number(),
        dateOfBirth: () => faker.date.birthdate(),
        gender: () => faker.helpers.arrayElement(['male', 'female', 'other']),
        isActive: () => true,
        acceptsMarketing: () => faker.datatype.boolean(),
        totalOrders: () => faker.number.int({ min: 0, max: 50 }),
        totalSpent: () => parseFloat(faker.commerce.price(0, 5000)),
        averageOrderValue: () => parseFloat(faker.commerce.price(20, 200)),
        lastOrderAt: () => faker.date.recent(),
        createdAt: () => faker.date.past(),
        updatedAt: () => faker.date.recent()
      },
      traits: {
        vip: {
          totalOrders: () => faker.number.int({ min: 20, max: 100 }),
          totalSpent: () => parseFloat(faker.commerce.price(1000, 10000)),
          averageOrderValue: () => parseFloat(faker.commerce.price(100, 500))
        },
        newCustomer: {
          totalOrders: () => 0,
          totalSpent: () => 0,
          lastOrderAt: () => null
        },
        inactive: {
          isActive: () => false,
          lastOrderAt: () => faker.date.past({ years: 2 })
        }
      },
      relationships: {
        orders: {
          factory: 'order',
          relationship: 'hasMany',
          foreignKey: 'customerId',
          count: 3
        }
      }
    });
  }
}

/**
 * Factory builder for fluent interface
 */
export class FactoryBuilder<T = any> {
  constructor(
    private factoryName: string,
    private options: FactoryOptions = {}
  ) {}

  count(count: number): FactoryBuilder<T> {
    this.options.count = count;
    return this;
  }

  with(overrides: Partial<T>): FactoryBuilder<T> {
    this.options.overrides = { ...this.options.overrides, ...overrides };
    return this;
  }

  traits(...traits: string[]): FactoryBuilder<T> {
    this.options.traits = [...(this.options.traits || []), ...traits];
    return this;
  }

  locale(locale: string): FactoryBuilder<T> {
    this.options.locale = locale;
    return this;
  }

  seed(seed: number): FactoryBuilder<T> {
    this.options.seed = seed;
    return this;
  }

  async create(): Promise<T[]> {
    return DatabaseFactory.create<T>(this.factoryName, this.options);
  }

  async createOne(): Promise<T> {
    const results = await this.create();
    return results[0];
  }
}

/**
 * Factory helper functions
 */
export function factory<T = any>(factoryName: string): FactoryBuilder<T> {
  return new FactoryBuilder<T>(factoryName);
}

export function defineFactory(name: string, definition: Partial<FactoryDefinition>): void {
  DatabaseFactory.define(name, definition);
}

export function clearFactoryData(factoryName?: string): void {
  DatabaseFactory.clearInstances(factoryName);
}

/**
 * Database-specific factory helpers
 */
export class DatabaseSpecificFactories {
  /**
   * PostgreSQL specific data types
   */
  static postgresql = {
    uuid: () => faker.string.uuid(),
    jsonb: () => ({ key: faker.lorem.word(), value: faker.lorem.sentence() }),
    array: () => Array.from({ length: 3 }, () => faker.lorem.word()),
    dateRange: () => `[${faker.date.past().toISOString().split('T')[0]},${faker.date.future().toISOString().split('T')[0]})`,
    point: () => `(${faker.location.longitude()}, ${faker.location.latitude()})`,
    inet: () => faker.internet.ip()
  };

  /**
   * MySQL specific data types
   */
  static mysql = {
    json: () => JSON.stringify({ key: faker.lorem.word(), value: faker.lorem.sentence() }),
    set: () => faker.helpers.arrayElements(['option1', 'option2', 'option3', 'option4']).join(','),
    enum: () => faker.helpers.arrayElement(['small', 'medium', 'large']),
    year: () => faker.date.recent().getFullYear(),
    geometry: () => `POINT(${faker.location.longitude()} ${faker.location.latitude()})`
  };

  /**
   * MongoDB specific data types
   */
  static mongodb = {
    objectId: () => faker.database.mongodbObjectId(),
    coordinates: () => [faker.location.longitude(), faker.location.latitude()],
    geoPoint: () => ({
      type: 'Point',
      coordinates: [faker.location.longitude(), faker.location.latitude()]
    }),
    binary: () => Buffer.from(faker.lorem.sentence()),
    decimal128: () => parseFloat(faker.commerce.price())
  };
}