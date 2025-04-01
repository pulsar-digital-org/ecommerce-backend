import {
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	Sequelize,
} from 'sequelize'
import { DiscountType, discountTypes } from '../types'
import { BaseModelInterface } from './models'

interface DiscountBaseInterface extends BaseModelInterface {
	type: DiscountType
	value?: number
}

interface DiscountAssociationsInterface {}

export interface DiscountInterface
	extends DiscountBaseInterface,
		DiscountAssociationsInterface {}

type DiscountAssociations = ''

export class Discount extends Model<
	InferAttributes<Discount, { omit: DiscountAssociations }>,
	InferCreationAttributes<Discount, { omit: DiscountAssociations }>
> {
	declare id: CreationOptional<string>

	declare type: CreationOptional<DiscountType>

	declare value: CreationOptional<number>

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
	declare deletedAt: CreationOptional<Date>

	declare static associations: {}

	static initModel(sequelize: Sequelize): typeof Discount {
		Discount.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				type: {
					type: DataTypes.STRING,
					allowNull: false,
					validate: {
						isIn: [discountTypes],
					},
					defaultValue: DiscountType.fixed,
				},
				value: {
					type: DataTypes.INTEGER,
					allowNull: true,
					validate: {
						isDecimal: {
							msg: 'Value must be a number',
						},
						min: {
							args: [0],
							msg: 'Value must be greater than or equal to 0',
						},
						max: {
							args: [100],
							msg: 'Value must be less than or equal to 100',
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

		return Discount
	}

	static associate() {}

	public async data(): Promise<DiscountInterface> {
		const fields = [
			'id',
			'type',
			'value',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		]

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Discount],
			}
		}, {}) as DiscountInterface

		const associated_data: DiscountAssociationsInterface = {}

		return {
			...base_data,

			...associated_data,
		}
	}
}
