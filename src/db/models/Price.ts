import {
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	Sequelize,
	NonAttribute,
	Association,
	HasOneGetAssociationMixin,
	HasOneCreateAssociationMixin,
	HasOneSetAssociationMixin,
} from 'sequelize'
import { Discount, DiscountInterface } from './Discount'
import { fetchSingleData } from '../helper'
import { BaseModelInterface } from './models'

interface PriceBaseInterface extends BaseModelInterface {
	price: number
	tax: number
}

interface PriceAssociationsInterface {
	discount: DiscountInterface | string
}

export interface PriceInterface
	extends PriceBaseInterface,
		PriceAssociationsInterface {}

type PriceAssociations = 'discount'

export class Price extends Model<
	InferAttributes<Price, { omit: PriceAssociations }>,
	InferCreationAttributes<Price, { omit: PriceAssociations }>
> {
	declare id: CreationOptional<string>

	declare price: CreationOptional<number>
	declare tax: CreationOptional<number>

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
	declare deletedAt: CreationOptional<Date>

	// Has one Discount
	declare discount?: NonAttribute<Discount>
	declare getDiscount: HasOneGetAssociationMixin<Discount>
	declare setDiscount: HasOneSetAssociationMixin<Discount, string>
	declare createDiscount: HasOneCreateAssociationMixin<Discount>

	declare static associations: {
		discount: Association<Price, Discount>
	}

	static initModel(sequelize: Sequelize): typeof Price {
		Price.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				price: {
					type: DataTypes.INTEGER,
					defaultValue: 0,
					validate: {
						isInt: {
							msg: "Field 'price' must be in cents",
						},
					},
				},
				tax: {
					type: DataTypes.FLOAT,
					defaultValue: 0,
					validate: {
						isFloat: {
							msg: "Field 'tax' must be a float",
						},
						min: {
							args: [0],
							msg: "Field 'tax' must be greater than or equal to 0",
						},
						max: {
							args: [1],
							msg: "Field 'tax' must be less than or equal to 1",
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

		return Price
	}

	static associate() {
		Price.hasOne(Discount, {
			foreignKey: 'priceId',
		})
	}

	public async data(dto: boolean = true): Promise<PriceInterface> {
		const fields = [
			'id',
			'price',
			'tax',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		]

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Price],
			}
		}, {}) as PriceBaseInterface

		const [discount] = await Promise.all([
			fetchSingleData<DiscountInterface, Discount>(
				() => this.getDiscount(),
				dto
			),
		])

		const associated_data: PriceAssociationsInterface = {
			discount,
		}

		return {
			...base_data,

			...associated_data,
		}
	}
}
