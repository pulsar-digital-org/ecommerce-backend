import { Sequelize } from 'sequelize'
import { User } from './User'
import { Order } from './Order'
import { Price } from './Price'
import { Product } from './Product'
import { OrderItem } from './OrderItem'
import { Address } from './Address'
import { ProductPrice } from './ProductPrice'
import { Discount } from './Discount'
import { Payment } from './Payment'
import { Category } from './Category'
import { Image } from './Image'
import { Cart } from './Cart'
import { CartItem } from './CartItem'
import { DiscountCode } from './DiscountCode'
import { Entity } from './Entity'

export interface ModelIntefaceHelper<TInterface> {
	data(dto: boolean): Promise<TInterface>
	id: string
}

export interface BaseModelInterface {
	id: string

	updateAt: Date // this might be needed to be changed to string and all the other dates as well
	createdAt: Date
	deletedAt?: Date
}

export function initModels(sequelize: Sequelize) {
	Address.initModel(sequelize)
	Cart.initModel(sequelize)
	CartItem.initModel(sequelize)
	Category.initModel(sequelize)
	Discount.initModel(sequelize)
	DiscountCode.initModel(sequelize)
	Entity.initModel(sequelize)
	Image.initModel(sequelize)
	Order.initModel(sequelize)
	OrderItem.initModel(sequelize)
	Payment.initModel(sequelize)
	Price.initModel(sequelize)
	Product.initModel(sequelize)
	ProductPrice.initModel(sequelize)
	User.initModel(sequelize)

	Address.associate()
	Cart.associate()
	CartItem.associate()
	Category.associate()
	Discount.associate()
	DiscountCode.associate()
	Entity.associate()
	Image.associate()
	Order.associate()
	OrderItem.associate()
	Payment.associate()
	Price.associate()
	Product.associate()
	ProductPrice.associate()
	User.associate()

	return {
		Address,
		Cart,
		CartItem,
		Category,
		Discount,
		DiscountCode,
		Entity,
		Image,
		Order,
		OrderItem,
		Payment,
		Price,
		Product,
		ProductPrice,
		User,
	}
}
