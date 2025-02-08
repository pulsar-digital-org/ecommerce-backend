import {
  Association,
  CreationOptional,
  DataTypes,
  InferCreationAttributes,
  InferAttributes,
  Model,
  NonAttribute,
  Sequelize,
  Transaction,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  BelongsToCreateAssociationMixin
} from 'sequelize';
import { Product } from './Product';
import { Order, OrderInterface } from './Order';
import logger from '../../logger';
import db from '../db';
import { fetchSingleData } from '../helper';

interface OrderItemBaseInterface {
  id: string;

  quantity: number;
  price: number;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface OrderItemAssociationsInterface {
  order: OrderInterface | string;
  product: any | string;
}

export interface OrderItemInterface
  extends OrderItemBaseInterface,
  OrderItemAssociationsInterface { }

type OrderItemAssociations = 'product' | 'order';

export class OrderItem extends Model<
  InferAttributes<OrderItem, { omit: OrderItemAssociations }>,
  InferCreationAttributes<OrderItem, { omit: OrderItemAssociations }>
> {
  declare id: CreationOptional<string>;

  declare quantity: CreationOptional<number>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date>;

  // OrderItem belongsTo Order
  declare order?: NonAttribute<Order>;
  declare getOrder: BelongsToGetAssociationMixin<Order>;
  declare setOrder: BelongsToSetAssociationMixin<Order, string>;
  declare createOrder: BelongsToCreateAssociationMixin<Order>;

  // OrderItem belongsTo Product
  declare product?: NonAttribute<Product>;
  declare getProduct: BelongsToGetAssociationMixin<Product>;
  declare setProduct: BelongsToSetAssociationMixin<Product, string>;
  declare createProduct: BelongsToCreateAssociationMixin<Product>;

  declare static associations: {
    order: Association<OrderItem, Order>;
    product: Association<OrderItem, Product>;
  };

  static initModel(sequelize: Sequelize): typeof OrderItem {
    OrderItem.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          allowNull: false,
          unique: true,
          defaultValue: DataTypes.UUIDV4
        },
        quantity: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
          validate: {
            isInt: {
              msg: "Field 'quantity' must be an integer"
            },
            min: {
              args: [1],
              msg: "Field 'quantity' must be greater than or equal to 1"
            }
          }
        },
        createdAt: {
          type: DataTypes.DATE
        },
        updatedAt: {
          type: DataTypes.DATE
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        paranoid: true
      }
    );

    return OrderItem;
  }

  static associate() {
    OrderItem.belongsTo(Order, {
      foreignKey: 'orderId',
      onDelete: 'CASCADE'
    });

    OrderItem.belongsTo(Product, {
      foreignKey: 'productId',
      onDelete: 'CASCADE'
    });
  }

  public async data(dto: boolean = true): Promise<OrderItemInterface> {
    const fields = [
      'id',
      'quantity',
      'createdAt',
      'updatedAt',
      ...(this.deletedAt ? ['deletedAt'] : [])
    ];

    const base_data = fields.reduce((acc, field) => {
      return {
        ...acc,
        [field]: this[field as keyof OrderItem]
      };
    }, {}) as OrderItemInterface;

    const [order, product] = await Promise.all([
      fetchSingleData<OrderInterface, Order>(() => this.getOrder(), dto),
      fetchSingleData<any, Product>(() => this.getProduct(), dto)
    ]);

    if (!order) {
      throw new Error('Order not found');
    }

    if (!product) {
      throw new Error('Product not found');
    }

    const associated_data: OrderItemAssociationsInterface = {
      order,
      product
    };

    return {
      ...base_data,

      price: await this.getPrice(),

      ...associated_data
    };
  }

  public async getPrice(): Promise<number> {
    const product = await this.getProduct();
    const activePrice = await product.getActivePrice();

    if (!activePrice) {
      // throw new Error('Product does not have an active price');
      return 0;
    }

    const price = activePrice.price * this.quantity;

    return price;
  }

  public async addQuantity(quantity: number): Promise<void> {
    this.quantity += quantity;

    if (this.quantity < 1) {
      this.quantity = 1;
    }

    const product = await this.getProduct();

    if (product?.stock < this.quantity) {
      this.quantity = product?.stock ?? 1;

      throw new Error('Not enough stock');
    }

    await this.save();
  }

  public async delete(options?: {
    force?: boolean;
    transaction?: Transaction;
  }): Promise<void> {
    try {
      const force = options?.force ?? false;
      const transaction = options?.transaction;

      if (force) {
        if (transaction) {
          await this.cleanUp({ force, transaction });
        } else {
          await db.transaction(async (transaction: Transaction) => {
            await this.cleanUp({ force, transaction });
          });
        }
      } else {
        if (transaction) {
          await this.destroy({ transaction });
        } else {
          await db.transaction(async (transaction: Transaction) => {
            await this.destroy({ transaction });
          });
        }
      }
    } catch (err: unknown) {
      logger.error('Delete order item error, ', err);
      throw err;
    }
  }

  public async cleanUp(options: {
    force: boolean;
    transaction: Transaction;
  }): Promise<void> {
    await this.destroy(options);
  }
}
