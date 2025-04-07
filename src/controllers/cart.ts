import { Op, Transaction } from 'sequelize'
import db from '../db/db'
import { Cart, CartInterface } from '../db/models/Cart'
import { User } from '../db/models/User'
import { BadRequestError } from '../errors'

async function cartCreate(user: User) {
	const cart = await db.transaction(async (t: Transaction) => {
		const cart = await Cart.create({}, { transaction: t })

		user.setCart(cart, { transaction: t })

		return cart
	})

	return cart.data()
}

async function cartGet(
	cartId: string,
	options?: { transaction?: Transaction }
): Promise<Cart> {
	const cart = await Cart.findByPk(cartId, options)
	if (!cart) {
		throw new BadRequestError('Cart not found')
	}

	return cart
}

async function cartGetMultiple(
	options: { page?: number; size?: number } = {},
	filters: { [key: string]: string | undefined | null } = {}
): Promise<{
	carts: CartInterface[]
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

	const { rows, count } = await Cart.findAndCountAll({
		...queryOptions,
		order: [['createdAt', 'DESC']],
	})

	const carts = await Promise.all(rows.map(async (cart) => cart.data()))

	return { carts, total: count, page, size }
}

async function cartDelete(cart: Cart) {
	cart.destroy()
}

export { cartCreate, cartGet, cartGetMultiple, cartDelete }
