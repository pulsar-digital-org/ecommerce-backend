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
	BelongsToCreateAssociationMixin,
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
	HasOneCreateAssociationMixin,
	HasOneGetAssociationMixin,
	HasOneSetAssociationMixin
} from 'sequelize';
import { fetchSingleData, validateStringField } from '../helper';
import logger from '../../logger';
import db from '../db';
import { Order, OrderInterface } from './Order';
import { Price, PriceInterface } from './Price';
import { PriceableType } from '../types';

interface PaymentBaseInterface {
	id: string;

	stripeId: string;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

interface PaymentAssociationsInterface {
	price: PriceInterface | string;
	order: OrderInterface | string;
}

export interface PaymentInterface
	extends PaymentBaseInterface,
		PaymentAssociationsInterface {}

type PaymentAssociations = 'price' | 'order';

export class Payment extends Model<
	InferAttributes<Payment, { omit: PaymentAssociations }>,
	InferCreationAttributes<Payment, { omit: PaymentAssociations }>
> {
	declare id: CreationOptional<string>;

	declare stripeId: CreationOptional<string>;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare deletedAt: CreationOptional<Date>;

	// Payment hasOne Price
	declare price?: NonAttribute<Price>;
	declare getPrice: HasOneGetAssociationMixin<Price>;
	declare setPrice: HasOneSetAssociationMixin<Price, string>;
	declare createPrice: HasOneCreateAssociationMixin<Price>;

	// Payment belongsTo Order
	declare order?: NonAttribute<Order>;
	declare getOrder: BelongsToGetAssociationMixin<Order>;
	declare setOrder: BelongsToSetAssociationMixin<Order, string>;
	declare createOrder: BelongsToCreateAssociationMixin<Order>;

	declare static associations: {
		price: Association<Payment, Price>;
		order: Association<Payment, Order>;
	};

	static initModel(sequelize: Sequelize): typeof Payment {
		Payment.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4
				},
				stripeId: {
					type: DataTypes.STRING,
					allowNull: true,
					validate: {
						isString: validateStringField('stripeId'),
						len: {
							args: [0, 1024],
							msg: 'Name max length is 1024 characters'
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

		return Payment;
	}

	static associate() {
		Payment.hasOne(Price, {
			foreignKey: 'paymentId',
			scope: {
				priceableType: PriceableType.payment
			}
		});

		Payment.belongsTo(Order, {
			foreignKey: 'orderId',
			onDelete: 'CASCADE'
		});
	}

	public async data(dto: boolean = true): Promise<PaymentInterface> {
		const fields = [
			'id',
			'stripeId',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : [])
		];

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Payment]
			};
		}, {}) as PaymentBaseInterface;

		const [price, order] = await Promise.all([
			fetchSingleData<PriceInterface, Price>(() => this.getPrice(), dto),
			fetchSingleData<OrderInterface, Order>(() => this.getOrder(), dto)
		]);

		if (price === undefined) {
			throw new Error('Price not found');
		}

		if (order === undefined) {
			throw new Error('Order not found');
		}

		const associated_data: PaymentAssociationsInterface = {
			price,
			order
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
