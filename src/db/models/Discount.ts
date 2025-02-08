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
	HasManyAddAssociationMixin,
	HasManyAddAssociationsMixin,
	HasManyCountAssociationsMixin,
	HasManyCreateAssociationMixin,
	HasManyGetAssociationsMixin,
	HasManyHasAssociationMixin,
	HasManyHasAssociationsMixin,
	HasManyRemoveAssociationMixin,
	HasManyRemoveAssociationsMixin,
	HasManySetAssociationsMixin,
	HasOneCreateAssociationMixin,
	HasOneGetAssociationMixin,
	HasOneSetAssociationMixin
} from 'sequelize';
import logger from '../../logger';
import db from '../db';
import { DiscountType, discountTypes, PriceableType } from '../types';
import { BadRequestError } from '../../errors';
import { Order, OrderInterface } from './Order';
import { Product } from './Product';
import { Price, PriceInterface } from './Price';
import { fetchSingleData, fetchMultiData } from '../helper';

interface DiscountBaseInterface {
	id: string;

	type: DiscountType;
	value?: number;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

interface DiscountAssociationsInterface {
	price: PriceInterface | string;
	orders: OrderInterface[] | string[];
	products: any[] | string[];
}

export interface DiscountInterface
	extends DiscountBaseInterface,
	DiscountAssociationsInterface { }

type DiscountAssociations = 'orders' | 'products' | 'price';

export class Discount extends Model<
	InferAttributes<Discount, { omit: DiscountAssociations }>,
	InferCreationAttributes<Discount, { omit: DiscountAssociations }>
> {
	declare id: CreationOptional<string>;

	declare type: CreationOptional<DiscountType>;

	declare value: CreationOptional<number>;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare deletedAt: CreationOptional<Date>;

	// Discount belongsTo Price
	declare price?: NonAttribute<Price>;
	declare getPrice: HasOneGetAssociationMixin<Price>;
	declare setPrice: HasOneSetAssociationMixin<Price, string>;
	declare createPrice: HasOneCreateAssociationMixin<Price>;

	// Discount hasMany Orders
	declare orders?: NonAttribute<Order[]>;
	declare getOrders: HasManyGetAssociationsMixin<Order>;
	declare setOrders: HasManySetAssociationsMixin<Order, string>;
	declare addOrder: HasManyAddAssociationMixin<Order, string>;
	declare addOrders: HasManyAddAssociationsMixin<Order, string>;
	declare createOrder: HasManyCreateAssociationMixin<Order>;
	declare removeOrder: HasManyRemoveAssociationMixin<Order, string>;
	declare removeOrders: HasManyRemoveAssociationsMixin<Order, string>;
	declare hasOrder: HasManyHasAssociationMixin<Order, string>;
	declare hasOrders: HasManyHasAssociationsMixin<Order, string>;
	declare countOrders: HasManyCountAssociationsMixin;

	// Discount hasMany Products
	declare products?: NonAttribute<Product[]>;
	declare getProducts: HasManyGetAssociationsMixin<Product>;
	declare setProducts: HasManySetAssociationsMixin<Product, string>;
	declare addProduct: HasManyAddAssociationMixin<Product, string>;
	declare addProducts: HasManyAddAssociationsMixin<Product, string>;
	declare createProduct: HasManyCreateAssociationMixin<Product>;
	declare removeProduct: HasManyRemoveAssociationMixin<Product, string>;
	declare removeProducts: HasManyRemoveAssociationsMixin<Product, string>;
	declare hasProduct: HasManyHasAssociationMixin<Product, string>;
	declare hasProducts: HasManyHasAssociationsMixin<Product, string>;
	declare countProducts: HasManyCountAssociationsMixin;

	declare static associations: {
		price: Association<Discount, Price>;
		orders: Association<Discount, Order>;
		products: Association<Discount, Product>;
	};

	static initModel(sequelize: Sequelize): typeof Discount {
		Discount.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4
				},
				type: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [discountTypes]
					},
					defaultValue: DiscountType.fixed
				},
				value: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						isDecimal: {
							msg: 'Value must be a number'
						},
						min: {
							args: [0],
							msg: 'Value must be greater than or equal to 0'
						},
						max: {
							args: [100],
							msg: 'Value must be less than or equal to 100'
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
				paranoid: true,
				hooks: {
					beforeValidate(discount) {
						if (discount.type === DiscountType.fixed) {
							if (!discount.price) {
								throw new BadRequestError(
									'Price is required for discount that is fixed price'
								);
							}
						} else if (discount.type === DiscountType.percentage) {
							if (!discount.value) {
								throw new BadRequestError(
									'Value is required for discount that is percentage'
								);
							}
						}
					}
				}
			}
		);

		return Discount;
	}

	static associate() {
		// Discount has no deps

		Discount.hasMany(Order, {
			foreignKey: 'discountId'
		});

		Discount.hasMany(Product, {
			foreignKey: 'discountId'
		});

		Discount.hasOne(Price, {
			foreignKey: 'discountId',
			scope: {
				priceableType: PriceableType.discount
			}
		});
	}

	public async data(dto: boolean = true): Promise<DiscountInterface> {
		const fields = [
			'id',
			'type',
			'value',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : [])
		];

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Discount]
			};
		}, {}) as DiscountInterface;

		const [price, orders, products] = await Promise.all([
			fetchSingleData<PriceInterface, Price>(() => this.getPrice(), dto),
			fetchMultiData<OrderInterface, Order>(() => this.getOrders(), dto),
			fetchMultiData<any, Product>(() => this.getProducts(), dto)
		]);

		if (price === undefined) {
			throw new Error('Price not found');
		}

		const associated_data: DiscountAssociationsInterface = {
			price,
			orders: orders as OrderInterface[] | string[],
			products: products as any[] | string[]
		};

		return {
			...base_data,

			...associated_data
		};
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
			logger.error('Delete Address error, ', err);
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
