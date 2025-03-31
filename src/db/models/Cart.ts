import {
	Association,
	CreationOptional,
	DataTypes,
	InferCreationAttributes,
	InferAttributes,
	Model,
	NonAttribute,
	Sequelize,
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
	HasOneGetAssociationMixin,
	HasOneCreateAssociationMixin,
	HasOneSetAssociationMixin,
} from 'sequelize'
import { CartItem, CartItemInterface } from './CartItem'
import { fetchMultiData, fetchSingleData } from '../helper'
import { BaseModelInterface } from './models'
import { DiscountCode, DiscountCodeInterface } from './DiscountCode'

interface CartBaseInterface extends BaseModelInterface {
	price: number
}

interface CartAssociationsInterface {
	cartItems: CartItemInterface[] | string[]
	discount: DiscountCodeInterface | string
}

export interface CartInterface
	extends CartBaseInterface,
		CartAssociationsInterface {}

type CartAssociations = 'cartItems' | 'discount'

export class Cart extends Model<
	InferAttributes<Cart, { omit: CartAssociations }>,
	InferCreationAttributes<Cart, { omit: CartAssociations }>
> {
	declare id: CreationOptional<string>

	declare createdAt: CreationOptional<Date>
	declare updatedAt: CreationOptional<Date>

	// Cart hasOne Cart
	declare discount?: NonAttribute<DiscountCode>
	declare getDiscountCode: HasOneGetAssociationMixin<DiscountCode>
	declare setDiscountCode: HasOneSetAssociationMixin<DiscountCode, string>
	declare createDiscountCode: HasOneCreateAssociationMixin<DiscountCode>

	// Cart hasMany CartItems
	declare cartItems?: NonAttribute<CartItem[]>
	declare getCartItems: HasManyGetAssociationsMixin<CartItem>
	declare setCartItems: HasManySetAssociationsMixin<CartItem, string>
	declare addCartItem: HasManyAddAssociationMixin<CartItem, string>
	declare addCartItems: HasManyAddAssociationsMixin<CartItem, string>
	declare createCartItem: HasManyCreateAssociationMixin<CartItem>
	declare removeCartItem: HasManyRemoveAssociationMixin<CartItem, string>
	declare removeCartItems: HasManyRemoveAssociationsMixin<CartItem, string>
	declare hasCartItem: HasManyHasAssociationMixin<CartItem, string>
	declare hasCartItems: HasManyHasAssociationsMixin<CartItem, string>
	declare countCartItems: HasManyCountAssociationsMixin

	declare static associations: {
		cartItems: Association<Cart, CartItem>
		cart: Association<Cart, Cart>
	}

	static initModel(sequelize: Sequelize): typeof Cart {
		Cart.init(
			{
				id: {
					type: DataTypes.UUID,
					primaryKey: true,
					allowNull: false,
					unique: true,
					defaultValue: DataTypes.UUIDV4,
				},
				createdAt: {
					type: DataTypes.DATE,
				},
				updatedAt: {
					type: DataTypes.DATE,
				},
			},
			{
				sequelize,
			}
		)

		return Cart
	}

	static associate() {
		// Cart has no deps

		Cart.belongsTo(DiscountCode, {
			foreignKey: 'discountId',
			as: 'discount',
			onDelete: 'CASCADE',
		})

		Cart.hasMany(CartItem, {
			foreignKey: 'cartId',
			as: 'cartItems',
			onDelete: 'CASCADE',
		})
	}

	public async data(dto: boolean = true): Promise<CartInterface> {
		const fields = ['id', 'role', 'username', 'email', 'createdAt', 'updatedAt']

		const base_data = fields.reduce((acc, field) => {
			return {
				...acc,
				[field]: this[field as keyof Cart],
			}
		}, {}) as CartBaseInterface

		const [cartItems, discount] = await Promise.all([
			fetchMultiData<CartItemInterface, CartItem>(
				() => this.getCartItems(),
				dto
			),
			fetchSingleData<DiscountCodeInterface, DiscountCode>(
				() => this.getDiscountCode(),
				dto
			),
		])

		const associated_data: CartAssociationsInterface = {
			cartItems,
			discount,
		}

		return {
			...base_data,

			price: await this.getPrice(),

			...associated_data,
		}
	}

	public async getPrice(): Promise<number> {
		let total = 0
		const cartItems = await this.getCartItems()

		for (const cartItem of cartItems) {
			const price = await cartItem.getPrice()

			total += price
		}

		// Apply discount
		const discount = await this.getDiscountCode()
		if (discount) {
			total = await discount.apply(total)
		}

		return total
	}
}
