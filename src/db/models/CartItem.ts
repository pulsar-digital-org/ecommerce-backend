import {
	Association,
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	NonAttribute,
	Sequelize,
	BelongsToGetAssociationMixin,
	BelongsToSetAssociationMixin,
	BelongsToCreateAssociationMixin,
} from 'sequelize'
import { Product } from './Product'
import { fetchSingleData } from '../helper'
import { BaseModelInterface } from './models'

interface CartItemBaseInterface extends BaseModelInterface {
	quantity: number
	price: number
}

interface CartItemAssociationsInterface {
	product: any | string
}

export interface CartItemInterface
	extends CartItemBaseInterface,
		CartItemAssociationsInterface {}

type CartItemAssociations = 'product'

export class CartItem extends Model<
	InferAttributes<CartItem, { omit: CartItemAssociations }>,
	InferCreationAttributes<CartItem, { omit: CartItemAssociations }>
> {
	declare id: CreationOptional<string>

	declare quantity: CreationOptional<number>

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>
	declare deletedAt: CreationOptional<Date>

	// CartItem belongsTo Product
	declare product?: NonAttribute<Product>
	declare getProduct: BelongsToGetAssociationMixin<Product>
	declare setProduct: BelongsToSetAssociationMixin<Product, string>
	declare createProduct: BelongsToCreateAssociationMixin<Product>

	declare static associations: {
		product: Association<CartItem, Product>
	}

	static initModel(sequelize: Sequelize): typeof CartItem {
		CartItem.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				quantity: {
					type: DataTypes.INTEGER,
					defaultValue: 1,
					validate: {
						isInt: {
							msg: "Field 'quantity' must be an integer",
						},
						min: {
							args: [1],
							msg: "Field 'quantity' must be greater than or equal to 1",
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

		return CartItem
	}

	static associate() {
		CartItem.belongsTo(Product, {
			as: 'product',
			foreignKey: 'productId',
			onDelete: 'CASCADE',
		})
	}

	public async data(dto: boolean = true): Promise<CartItemInterface> {
		const fields = [
			'id',
			'quantity',
			'createdAt',
			'updatedAt',
			...(this.deletedAt ? ['deletedAt'] : []),
		]

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof CartItem],
			}
		}, {}) as CartItemInterface

		const [product] = await Promise.all([
			fetchSingleData<any, Product>(() => this.getProduct(), dto),
		])

		if (!product) {
			throw new Error('Product not found')
		}

		const associated_data: CartItemAssociationsInterface = {
			product,
		}

		return {
			...base_data,

			price: await this.getPrice(),

			...associated_data,
		}
	}

	public async getPrice(): Promise<number> {
		const product = await this.getProduct()
		const activePrice = await product.getActivePrice()

		if (!activePrice) {
			// throw new Error('Product does not have an active price');
			return 0
		}

		const price = activePrice.price * this.quantity

		return price
	}

	public async addQuantity(quantity: number): Promise<void> {
		this.quantity += quantity

		if (this.quantity < 1) {
			this.quantity = 1
		}

		const product = await this.getProduct()

		if (product?.stock < this.quantity) {
			this.quantity = product?.stock ?? 1

			throw new Error('Not enough stock')
		}

		await this.save()
	}
}
