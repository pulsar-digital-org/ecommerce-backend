import { Op, Transaction } from 'sequelize'
import db from '../db/db'
import { Cart } from '../db/models/Cart'
import { CartItem, CartItemInterface } from '../db/models/CartItem'
import { BadRequestError } from '../errors'
import { CartItemModifiable } from '../types/cartItem'

async function cartItemCreate(cart: Cart) {
	const cartItem = await db.transaction(async (t: Transaction) => {
		const cartItem = await CartItem.create({}, { transaction: t })

		cart.addCartItem(cartItem, { transaction: t })

		return cartItem
	})

	return cartItem.data()
}

async function cartItemGet(
	cartItemId: string,
	options?: { transaction?: Transaction }
): Promise<CartItem> {
	const cartItem = await CartItem.findByPk(cartItemId, options)
	if (!cartItem) {
		throw new BadRequestError('CartItem not found')
	}

	return cartItem
}

async function cartItemUpdate(cartItem: CartItem, data: CartItemModifiable) {
	cartItem.set(data)

	try {
		await cartItem.validate()
	} catch (err) {
		throw new BadRequestError('Invalid cart item data')
	}

	await db.transaction(async (t: Transaction) => {
		await cartItem.update(data, { transaction: t })
	})

	return cartItem.data()
}

async function cartItemGetMultiple(
	options: { page?: number; size?: number } = {},
	filters: { [key: string]: string | undefined | null } = {}
): Promise<{
	cartItems: CartItemInterface[]
	total: number
	page: number
	size: number
}> {
	const { page = 1, size = 10 } = options

	if (page < 1 || size < 1)
		throw new BadRequestError('Invalid pagination params')

	const offset = (page - 1) * size

	const filteredEntries = Object.entries(filters).filter(
		([_, value]) =>
			value !== undefined &&
			value !== 'undefined' &&
			value !== null &&
			value !== ''
	)

	const conditions = filteredEntries.map(([key, value]) => ({
		[key]:
			value === 'null'
				? { [Op.eq]: null }
				: {
						[Op.like]: `%${value}%`,
				  },
	}))

	const queryOptions = {
		limit: Math.min(size, 10),
		offset,
		where: conditions.length > 0 ? { [Op.and]: conditions } : {},
	}

	const { rows, count } = await CartItem.findAndCountAll({
		...queryOptions,
		order: [['createdAt', 'DESC']],
	})

	const cartItems = await Promise.all(
		rows.map(async (cartItem) => cartItem.data())
	)

	return { cartItems, total: count, page, size }
}

async function cartItemDelete(cartItem: CartItem) {
	cartItem.destroy()
}

export {
	cartItemCreate,
	cartItemGet,
	cartItemUpdate,
	cartItemGetMultiple,
	cartItemDelete,
}
