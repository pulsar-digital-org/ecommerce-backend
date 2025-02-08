import {
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	Sequelize,
	Transaction,
	BelongsToCreateAssociationMixin,
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
	NonAttribute,
	Association,
	HasOneGetAssociationMixin,
	HasOneCreateAssociationMixin,
	HasOneSetAssociationMixin
} from 'sequelize';
import logger from '../../logger';
import db from '../db';
import { Product } from './Product';
import { Discount, DiscountInterface } from './Discount';
import { Payment, PaymentInterface } from './Payment';
import { PriceableType } from '../types';
import { ProductPrice } from './ProductPrice';
import { fetchSingleData } from '../helper';

interface PriceBaseInterface {
	id: string;

	price: number;
	tax: number;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

interface PriceAssociationsInterface {
	priceable: any | DiscountInterface | PaymentInterface | string;
}

export interface PriceInterface
	extends PriceBaseInterface,
	PriceAssociationsInterface { }

type PriceAssociations = 'productPrice' | 'discount' | 'payment';

export class Price extends Model<
	InferAttributes<Price, { omit: PriceAssociations }>,
	InferCreationAttributes<Price, { omit: PriceAssociations }>
> {
	declare id: CreationOptional<string>;

	declare price: CreationOptional<number>;
	declare tax: CreationOptional<number>;

	declare priceableType: string;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare deletedAt: CreationOptional<Date>;

	// Price belongsTo Product
	declare productPrice?: NonAttribute<ProductPrice>;
	declare getProductPrice: HasOneGetAssociationMixin<ProductPrice>;
	declare setProductPrice: HasOneSetAssociationMixin<ProductPrice, string>;
	declare createProductPrice: HasOneCreateAssociationMixin<ProductPrice>;

	// Price belongsTo Discount
	declare discount?: NonAttribute<Discount>;
	declare getDiscount: BelongsToGetAssociationMixin<Discount>;
	declare setDiscount: BelongsToSetAssociationMixin<Discount, string>;
	declare createDiscount: BelongsToCreateAssociationMixin<Discount>;

	// Price belongsTo Payment
	declare payment?: NonAttribute<Payment>;
	declare getPayment: BelongsToGetAssociationMixin<Payment>;
	declare setPayment: BelongsToSetAssociationMixin<Payment, string>;
	declare createPayment: BelongsToCreateAssociationMixin<Payment>;

	declare static associations: {
		productPrice: Association<Price, ProductPrice>;
		discount: Association<Price, Discount>;
		payment: Association<Price, Payment>;
	};

	static initModel(sequelize: Sequelize): typeof Price {
		Price.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4
				},
				price: {
					type: DataTypes.INTEGER,
					defaultValue: 0,
					validate: {
						isInt: {
							msg: "Field 'price' must be in cents"
						}
					}
				},
				tax: {
					type: DataTypes.FLOAT,
					defaultValue: 0,
					validate: {
						isFloat: {
							msg: "Field 'tax' must be a float"
						},
						min: {
							args: [0],
							msg: "Field 'tax' must be greater than or equal to 0"
						},
						max: {
							args: [1],
							msg: "Field 'tax' must be less than or equal to 1"
						}
					}
				},
				priceableType: {
					type: DataTypes.STRING,
					allowNull: false
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

		return Price;
	}

	static associate() {
		Price.hasOne(ProductPrice, {
			foreignKey: 'priceId'
		});

		Price.belongsTo(Discount, {
			foreignKey: 'discountId',
			scope: {
				priceableType: PriceableType.discount
			}
		});

		Price.belongsTo(Payment, {
			foreignKey: 'paymentId',
			scope: {
				priceableType: PriceableType.payment
			}
		});
	}

	public async data(dto: boolean = true): Promise<PriceInterface> {
		const fields = [
			'id',
			'price',
			'tax',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : [])
		];

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Price]
			};
		}, {}) as PriceBaseInterface;

		const [priceable] = await Promise.all([
			fetchSingleData<
				any | PaymentInterface | DiscountInterface,
				Product | Payment | Discount
			>(() => this.getPriceable(), dto)
		]);

		if (priceable === undefined) {
			throw new Error('Priceable not found');
		}

		const associated_data: PriceAssociationsInterface = {
			priceable
		};

		return {
			...base_data,

			...associated_data
		};
	}

	private async getPriceable(): Promise<Product | Discount | Payment | null> {
		const priceable = await (async () => {
			if (this.priceableType === PriceableType.product) {
				return (await this.getProductPrice()).getProduct();
			} else if (this.priceableType === PriceableType.discount) {
				return this.getDiscount();
			} else if (this.priceableType === PriceableType.payment) {
				return this.getPayment();
			} else {
				return null;
			}
		})();

		return priceable;
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
			logger.error('Delete product error, ', err);
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
