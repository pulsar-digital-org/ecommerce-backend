import {
	Association,
	CreationOptional,
	DataTypes,
	HasManyGetAssociationsMixin,
	HasManySetAssociationsMixin,
	HasManyAddAssociationMixin,
	HasManyAddAssociationsMixin,
	HasManyCreateAssociationMixin,
	HasManyRemoveAssociationMixin,
	HasManyRemoveAssociationsMixin,
	HasManyHasAssociationMixin,
	HasManyHasAssociationsMixin,
	HasManyCountAssociationsMixin,
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
	HasOneSetAssociationMixin,
	BelongsToManyAddAssociationMixin,
	BelongsToManyAddAssociationsMixin,
	BelongsToManyCountAssociationsMixin,
	BelongsToManyCreateAssociationMixin,
	BelongsToManyGetAssociationsMixin,
	BelongsToManyHasAssociationMixin,
	BelongsToManyHasAssociationsMixin,
	BelongsToManyRemoveAssociationMixin,
	BelongsToManyRemoveAssociationsMixin,
	BelongsToManySetAssociationsMixin
} from 'sequelize';
import { OrderItem, OrderItemInterface } from './OrderItem';
import logger from '../../logger';
import db from '../db';
import { AddressType, OrderStatus, orderStatuses } from '../types';
import { User } from './User';
import { Address, AddressInterface } from './Address';
import { Discount, DiscountInterface } from './Discount';
import { Payment, PaymentInterface } from './Payment';
import { fetchMultiData, fetchSingleData } from '../helper';

interface OrderBaseInterface {
	id: string;

	status: OrderStatus;
	price: number;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}

interface OrderAssociationsInterface {
	user: any | string;
	orderItems: OrderItemInterface[] | string[];
	billingAddress?: AddressInterface | string;
	shippingAddress?: AddressInterface | string;
	discount?: DiscountInterface | string;
	payment?: PaymentInterface | string;
}

export interface OrderInterface
	extends OrderBaseInterface,
	OrderAssociationsInterface { }

type OrderAssociations = 'orderItems' | 'user' | 'addresses';

export class Order extends Model<
	InferAttributes<Order, { omit: OrderAssociations }>,
	InferCreationAttributes<Order, { omit: OrderAssociations }>
> {
	declare id: CreationOptional<string>;

	declare status: CreationOptional<OrderStatus>;

	declare createdAt: CreationOptional<Date>;
	declare updatedAt: CreationOptional<Date>;
	declare deletedAt: CreationOptional<Date>;

	// Order hasMany OrderItems
	declare orderItems?: NonAttribute<OrderItem[]>;
	declare getOrderItems: HasManyGetAssociationsMixin<OrderItem>;
	declare setOrderItems: HasManySetAssociationsMixin<OrderItem, string>;
	declare addOrderItem: HasManyAddAssociationMixin<OrderItem, string>;
	declare addOrderItems: HasManyAddAssociationsMixin<OrderItem, string>;
	declare createOrderItem: HasManyCreateAssociationMixin<OrderItem>;
	declare removeOrderItem: HasManyRemoveAssociationMixin<OrderItem, string>;
	declare removeOrderItems: HasManyRemoveAssociationsMixin<OrderItem, string>;
	declare hasOrderItem: HasManyHasAssociationMixin<OrderItem, string>;
	declare hasOrderItems: HasManyHasAssociationsMixin<OrderItem, string>;
	declare countOrderItems: HasManyCountAssociationsMixin;

	// Order belongsTo User
	declare user?: NonAttribute<User>;
	declare getUser: BelongsToGetAssociationMixin<User>;
	declare setUser: BelongsToSetAssociationMixin<User, string>;
	declare createUser: BelongsToCreateAssociationMixin<User>;

	// Order belongsToMany Addresses
	declare addresses?: NonAttribute<Address[]>;
	declare getAddresses: BelongsToManyGetAssociationsMixin<Address>;
	declare setAddresses: BelongsToManySetAssociationsMixin<Address, string>;
	declare addAddress: BelongsToManyAddAssociationMixin<Address, string>;
	declare addAddresses: BelongsToManyAddAssociationsMixin<Address, string>;
	declare createAddress: BelongsToManyCreateAssociationMixin<Address>;
	declare removeAddress: BelongsToManyRemoveAssociationMixin<Address, string>;
	declare removeAddresses: BelongsToManyRemoveAssociationsMixin<
		Address,
		string
	>;
	declare hasAddress: BelongsToManyHasAssociationMixin<Address, string>;
	declare hasAddresses: BelongsToManyHasAssociationsMixin<Address, string>;
	declare countAddresses: BelongsToManyCountAssociationsMixin;

	// Order belongsTo Discount
	declare discount?: NonAttribute<Discount>;
	declare getDiscount: BelongsToGetAssociationMixin<Discount>;
	declare setDiscount: BelongsToSetAssociationMixin<Discount, string>;
	declare createDiscount: BelongsToCreateAssociationMixin<Discount>;

	// Order hasOne Payment
	declare payment?: NonAttribute<Payment>;
	declare getPayment: HasOneGetAssociationMixin<Payment>;
	declare setPayment: HasOneSetAssociationMixin<Payment, string>;
	declare createPayment: HasOneCreateAssociationMixin<Payment>;

	declare static associations: {
		orderItems: Association<Order, OrderItem>;
		user: Association<Order, User>;
		billingAddress: Association<Order, Address>;
		shippingAddress: Association<Order, Address>;
		discount: Association<Order, Discount>;
		payment: Association<Order, Payment>;
	};

	static initModel(sequelize: Sequelize): typeof Order {
		Order.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4
				},
				status: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [orderStatuses]
					},
					defaultValue: OrderStatus.draft
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

		return Order;
	}

	static associate() {
		// Order deps

		Order.belongsTo(User, {
			foreignKey: 'userId'
		});

		Order.belongsToMany(Address, {
			through: 'OrderAddress'
		});

		Order.belongsTo(Discount, {
			foreignKey: 'discountId'
		});

		// End deps

		Order.hasMany(OrderItem, {
			as: 'orderItems',
			foreignKey: 'orderId',
			onDelete: 'CASCADE'
		});

		Order.hasOne(Payment, {
			as: 'payment',
			foreignKey: { name: 'orderId', allowNull: true },
			onDelete: 'SET NULL',
			onUpdate: 'CASCADE',
			hooks: true
		});
	}

	public async data(dto: boolean = true): Promise<OrderInterface> {
		const fields = [
			'id',
			'status',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : [])
		];

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Order]
			};
		}, {}) as OrderBaseInterface;

		const [
			user,
			orderItems,
			billingAddress,
			shippingAddress,
			discount,
			payment
		] = await Promise.all([
			fetchSingleData<any, User>(() => this.getUser(), dto),
			fetchMultiData<OrderItemInterface, OrderItem>(
				() => this.getOrderItems(),
				dto
			),
			fetchSingleData<AddressInterface, Address>(
				() => this.getBillingAddress(),
				dto
			),
			fetchSingleData<AddressInterface, Address>(
				() => this.getShippingAddress(),
				dto
			),
			fetchSingleData<DiscountInterface, Discount>(
				() => this.getDiscount(),
				dto
			),
			fetchSingleData<PaymentInterface, Payment>(() => this.getPayment(), dto)
		]);

		if (user === undefined) {
			throw new Error('User not found');
		}

		const associated_data: OrderAssociationsInterface = {
			user,
			orderItems: orderItems as OrderItemInterface[] | string[],
			billingAddress,
			shippingAddress,
			discount,
			payment
		};

		return {
			...base_data,

			price: await this.getPrice(), // in the future we should change this to price model and update it on data retrieval

			...associated_data
		};
	}

	public async getPrice(): Promise<number> {
		const order_items = await this.getOrderItems();

		const price = await order_items.reduce(async (acc, order_item) => {
			const itemPrice = await order_item.getPrice();
			return (await acc) + itemPrice;
		}, Promise.resolve(0));

		return price;
	}

	public async isEmpty(): Promise<boolean> {
		const order_items = await this.getOrderItems();
		return order_items.length === 0;
	}

	public async getShippingAddress(): Promise<Address | null> {
		const addresses = await this.getAddresses();
		return (
			addresses.find(address => address.type === AddressType.shipping) ?? null
		);
	}

	public async getBillingAddress(): Promise<Address | null> {
		const addresses = await this.getAddresses();
		return (
			addresses.find(address => address.type === AddressType.billing) ?? null
		);
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
