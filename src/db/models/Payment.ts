import {
	Association,
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	NonAttribute,
	Sequelize,
	BelongsToCreateAssociationMixin,
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
} from 'sequelize'
import { fetchSingleData, validateStringField } from '../helper'
import { Order, OrderInterface } from './Order'
import { BaseModelInterface } from './models'

interface PaymentBaseInterface extends BaseModelInterface {
	stripeId: string
}

interface PaymentAssociationsInterface {
	order: OrderInterface | string
}

export interface PaymentInterface
	extends PaymentBaseInterface,
		PaymentAssociationsInterface {}

type PaymentAssociations = 'order'

export class Payment extends Model<
	InferAttributes<Payment, { omit: PaymentAssociations }>,
	InferCreationAttributes<Payment, { omit: PaymentAssociations }>
> {
	declare id: CreationOptional<string>

	declare stripeId: CreationOptional<string>

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
	declare deletedAt: CreationOptional<Date>

	// Payment belongsTo Order
	declare order?: NonAttribute<Order>
	declare getOrder: BelongsToGetAssociationMixin<Order>
	declare setOrder: BelongsToSetAssociationMixin<Order, string>
	declare createOrder: BelongsToCreateAssociationMixin<Order>

	declare static associations: {
		order: Association<Payment, Order>
	}

	static initModel(sequelize: Sequelize): typeof Payment {
		Payment.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				stripeId: {
					type: DataTypes.STRING,
					allowNull: true,
					validate: {
						isString: validateStringField('stripeId'),
						len: {
							args: [0, 1024],
							msg: 'Name max length is 1024 characters',
						},
					},
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

		return Payment
	}

	static associate() {
		Payment.belongsTo(Order, {
			foreignKey: 'orderId',
			onDelete: 'CASCADE',
		})
	}

	public async data(dto: boolean = true): Promise<PaymentInterface> {
		const fields = [
			'id',
			'stripeId',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		]

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Payment],
			}
		}, {}) as PaymentBaseInterface

		const [order] = await Promise.all([
			fetchSingleData<OrderInterface, Order>(() => this.getOrder(), dto),
		])

		if (order === undefined) {
			throw new Error('Order not found')
		}

		const associated_data: PaymentAssociationsInterface = {
			order,
		}

		return {
			...base_data,

			...associated_data,
		}
	}
}
