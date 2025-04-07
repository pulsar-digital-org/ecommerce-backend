import { Op, Transaction } from 'sequelize'
import db from '../db/db'
import { Address } from '../db/models/Address'
import { Entity, EntityInterface } from '../db/models/Entity'
import { BadRequestError } from '../errors'
import { EntityModifiable } from '../types/entity'

async function entityCreate(data: EntityModifiable, address: Address) {
	const entity = await db.transaction(async (t: Transaction) => {
		const entity = await Entity.create(data, { transaction: t })

		address.addEntity(entity, { transaction: t })

		return entity
	})

	return entity.data()
}

async function entityGet(
	entityId: string,
	options?: { transaction?: Transaction }
): Promise<Entity> {
	const entity = await Entity.findByPk(entityId, options)
	if (!entity) {
		throw new BadRequestError('Entity not found')
	}

	return entity
}

async function entityUpdate(entity: Entity, data: EntityModifiable) {
	// This is not yet allowed, since we cannot track back the address from the order if the user changes it
	throw new BadRequestError('Entity update is not allowed')

	entity.set(data)

	try {
		await entity.validate()
	} catch (err) {
		throw new BadRequestError('Invalid entity data')
	}

	await db.transaction(async (t: Transaction) => {
		await entity.update(data, { transaction: t })
	})

	return entity.data()
}

async function entityGetMultiple(
	options: { page?: number; size?: number } = {},
	filters: { [key: string]: string | undefined | null } = {}
): Promise<{
	entities: EntityInterface[]
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

	const { rows, count } = await Entity.findAndCountAll({
		...queryOptions,
		order: [['createdAt', 'DESC']],
	})

	const entities = await Promise.all(rows.map(async (entity) => entity.data()))

	return { entities, total: count, page, size }
}

async function entityDelete(entity: Entity) {
	entity.destroy()
}

export {
	entityCreate,
	entityGet,
	entityUpdate,
	entityGetMultiple,
	entityDelete,
}
