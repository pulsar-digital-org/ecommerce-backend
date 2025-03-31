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

interface DiscountCodeBaseInterface extends BaseModelInterface {
	type: DiscountType
	value?: number
}

interface DiscountCodeAssociationsInterface {}

export interface DiscountCodeInterface
	extends DiscountCodeBaseInterface,
		DiscountCodeAssociationsInterface {}

type DiscountCodeAssociations = ''

export class DiscountCode extends Model<
	InferAttributes<DiscountCode, { omit: DiscountCodeAssociations }>,
	InferCreationAttributes<DiscountCode, { omit: DiscountCodeAssociations }>
> {
	declare id: CreationOptional<string>

	declare type: CreationOptional<DiscountType>
	declare code: CreationOptional<string>
	declare value: CreationOptional<number>

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
	declare deletedAt: CreationOptional<Date>

	declare static associations: {}

	static initModel(sequelize: Sequelize): typeof DiscountCode {
		DiscountCode.init(
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
				code: {
					type: DataTypes.STRING,
					allowNull: false,
					defaultValue: DataTypes.UUIDV4,
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

		return DiscountCode
	}

	static associate() {}

	public async data(): Promise<DiscountCodeInterface> {
		const fields = [
			'id',
			'type',
			'code',
			'value',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		]

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof DiscountCode],
			}
		}, {}) as DiscountCodeInterface

		return {
			...base_data,
		}
	}

	public async apply(value: number): Promise<number> {
		if (this.type === DiscountType.fixed) {
			return value - this.value
		} else if (this.type === DiscountType.percentage) {
			return value - (value * this.value) / 100
		}

		return value
	}
}
