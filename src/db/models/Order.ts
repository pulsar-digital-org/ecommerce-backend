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
	BelongsToManySetAssociationsMixin,
} from 'sequelize'
import { OrderItem, OrderItemInterface } from './OrderItem'
import logger from '../../logger'
import db from '../db'
import { AddressType, OrderStatus, orderStatuses } from '../types'
import { User, UserInterface } from './User'
import { Address, AddressInterface } from './Address'
import { Payment, PaymentInterface } from './Payment'
import { fetchMultiData, fetchSingleData } from '../helper'
import { BaseModelInterface } from './models'
import { DiscountCode, DiscountCodeInterface } from './DiscountCode'

interface OrderBaseInterface extends BaseModelInterface {
	status: OrderStatus
	price: number
}

interface OrderAssociationsInterface {
	user: UserInterface | string
	orderItems: OrderItemInterface[] | string[]
	billingAddress?: AddressInterface | string
	shippingAddress?: AddressInterface | string
	discount?: DiscountCodeInterface | string
	payment?: PaymentInterface | string
}

export interface OrderInterface
	extends OrderBaseInterface,
		OrderAssociationsInterface {}

type OrderAssociations = 'orderItems' | 'user' | 'addresses'

export class Order extends Model<
	InferAttributes<Order, { omit: OrderAssociations }>,
	InferCreationAttributes<Order, { omit: OrderAssociations }>
> {
	declare id: CreationOptional<string>

	declare status: CreationOptional<OrderStatus>

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
	declare deletedAt: CreationOptional<Date>

	// Order hasMany OrderItems
	declare orderItems?: NonAttribute<OrderItem[]>
	declare getOrderItems: HasManyGetAssociationsMixin<OrderItem>
	declare setOrderItems: HasManySetAssociationsMixin<OrderItem, string>
	declare addOrderItem: HasManyAddAssociationMixin<OrderItem, string>
	declare addOrderItems: HasManyAddAssociationsMixin<OrderItem, string>
	declare createOrderItem: HasManyCreateAssociationMixin<OrderItem>
	declare removeOrderItem: HasManyRemoveAssociationMixin<OrderItem, string>
	declare removeOrderItems: HasManyRemoveAssociationsMixin<OrderItem, string>
	declare hasOrderItem: HasManyHasAssociationMixin<OrderItem, string>
	declare hasOrderItems: HasManyHasAssociationsMixin<OrderItem, string>
	declare countOrderItems: HasManyCountAssociationsMixin

	// Order belongsTo User
	declare user?: NonAttribute<User>
	declare getUser: BelongsToGetAssociationMixin<User>
	declare setUser: BelongsToSetAssociationMixin<User, string>
	declare createUser: BelongsToCreateAssociationMixin<User>

	// Order belongsToMany Addresses
	declare addresses?: NonAttribute<Address[]>
	declare getAddresses: BelongsToManyGetAssociationsMixin<Address>
	declare setAddresses: BelongsToManySetAssociationsMixin<Address, string>
	declare addAddress: BelongsToManyAddAssociationMixin<Address, string>
	declare addAddresses: BelongsToManyAddAssociationsMixin<Address, string>
	declare createAddress: BelongsToManyCreateAssociationMixin<Address>
	declare removeAddress: BelongsToManyRemoveAssociationMixin<Address, string>
	declare removeAddresses: BelongsToManyRemoveAssociationsMixin<Address, string>
	declare hasAddress: BelongsToManyHasAssociationMixin<Address, string>
	declare hasAddresses: BelongsToManyHasAssociationsMixin<Address, string>
	declare countAddresses: BelongsToManyCountAssociationsMixin

	// Order belongsTo DiscountCode
	declare discount?: NonAttribute<DiscountCode>
	declare getDiscountCode: BelongsToGetAssociationMixin<DiscountCode>
	declare setDiscountCode: BelongsToSetAssociationMixin<DiscountCode, string>
	declare createDiscountCode: BelongsToCreateAssociationMixin<DiscountCode>

	// Order hasOne Payment
	declare payment?: NonAttribute<Payment>
	declare getPayment: HasOneGetAssociationMixin<Payment>
	declare setPayment: HasOneSetAssociationMixin<Payment, string>
	declare createPayment: HasOneCreateAssociationMixin<Payment>

	declare static associations: {
		orderItems: Association<Order, OrderItem>
		user: Association<Order, User>
		billingAddress: Association<Order, Address>
		shippingAddress: Association<Order, Address>
		discount: Association<Order, DiscountCode>
		payment: Association<Order, Payment>
	}

	static initModel(sequelize: Sequelize): typeof Order {
		Order.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				status: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [orderStatuses],
					},
					defaultValue: OrderStatus.draft,
				},
				createdAt: {
					type: DataTypes.DATE,
				},
				updatedAt: {
					type: DataTypes.DATE,
				},
				deletedAt: {
					type: DataTypes.DATE,
					allowNull: true,
				},
			},
			{
				sequelize,
				paranoid: true,
			}
		)

		return Order
	}

	static associate() {
		// Order deps

		Order.belongsTo(User, {
			foreignKey: 'userId',
		})

		Order.belongsToMany(Address, {
			through: 'OrderAddress',
		})

		Order.belongsTo(DiscountCode, {
			foreignKey: 'discountId',
		})

		// End deps

		Order.hasMany(OrderItem, {
			as: 'orderItems',
			foreignKey: 'orderId',
			onDelete: 'CASCADE',
		})

		Order.hasOne(Payment, {
			as: 'payment',
			foreignKey: { name: 'orderId', allowNull: true },
			onDelete: 'SET NULL',
			onUpdate: 'CASCADE',
			hooks: true,
		})
	}

	public async data(dto: boolean = true): Promise<OrderInterface> {
		const fields = [
			'id',
			'status',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		]

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Order],
			}
		}, {}) as OrderBaseInterface

		const [
			user,
			orderItems,
			billingAddress,
			shippingAddress,
			discount,
			payment,
		] = await Promise.all([
			fetchSingleData<UserInterface, User>(() => this.getUser(), dto),
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
			fetchSingleData<DiscountCodeInterface, DiscountCode>(
				() => this.getDiscountCode(),
				dto
			),
			fetchSingleData<PaymentInterface, Payment>(() => this.getPayment(), dto),
		])

		if (user === undefined) {
			throw new Error('User not found')
		}

		const associated_data: OrderAssociationsInterface = {
			user,
			orderItems: orderItems as OrderItemInterface[] | string[],
			billingAddress,
			shippingAddress,
			discount,
			payment,
		}

		return {
			...base_data,

			price: await this.getPrice(), // in the future we should change this to price model and update it on data retrieval

			...associated_data,
		}
	}

	public async getPrice(): Promise<number> {
		let total = 0
		const order_items = await this.getOrderItems()

		for (const order_item of order_items) {
			total += order_item.price
		}

		const discount = await this.getDiscountCode()
		if (discount) {
			total = await discount.apply(total)
		}

		return total
	}

	public async isEmpty(): Promise<boolean> {
		const order_items = await this.getOrderItems()
		return order_items.length === 0
	}

	public async getShippingAddress(): Promise<Address | null> {
		const addresses = await this.getAddresses()
		return (
			addresses.find((address) => address.type === AddressType.shipping) ?? null
		)
	}

	public async getBillingAddress(): Promise<Address | null> {
		const addresses = await this.getAddresses()
		return (
			addresses.find((address) => address.type === AddressType.billing) ?? null
		)
	}
}
