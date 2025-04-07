import { Op, Transaction } from 'sequelize'
import db from '../db/db'
import { Address, AddressInterface } from '../db/models/Address'
import { User } from '../db/models/User'
import { BadRequestError } from '../errors'
import { AddressModifiable } from '../types/address'

async function addressCreate(data: AddressModifiable, user: User) {
	const address = await db.transaction(async (t: Transaction) => {
		const address = await Address.create(data, { transaction: t })

		user.addAddress(address, { transaction: t })

		return address
	})

	return address.data()
}

async function addressGet(
	addressId: string,
	options?: { transaction?: Transaction }
) {
	const address = await Address.findByPk(addressId, options)
	if (!address) {
		throw new Error("Couldn't find address")
	}

	return address
}

async function addressUpdate(address: Address, data: AddressModifiable) {
	// This is not yet allowed, since we cannot track back the address from the order if the user changes it

	throw new BadRequestError('Address update is not allowed')

	address.set(data)

	try {
		await address.validate()
	} catch (err) {
		throw new BadRequestError('Invalid address data')
	}

	await db.transaction(async (t: Transaction) => {
		await address.update(data, { transaction: t })
	})

	return address.data()
}

async function addressGetMultiple(
	options: { page?: number; size?: number } = {},
	filters: { [key: string]: string | undefined | null } = {}
): Promise<{
	addresses: AddressInterface[]
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

	const { rows, count } = await Address.findAndCountAll({
		...queryOptions,
		order: [['createdAt', 'DESC']],
	})

	const addresses = await Promise.all(
		rows.map(async (address) => address.data())
	)

	return { addresses, total: count, page, size }
}

async function addressDelete(address: Address) {
	// only soft delete allowed for now
	address.destroy()
}

export {
	addressCreate,
	addressGet,
	addressUpdate,
	addressGetMultiple,
	addressDelete,
}
